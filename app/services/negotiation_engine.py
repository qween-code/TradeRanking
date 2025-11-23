"""
AI-Powered Negotiation Engine
Handles autonomous multi-round negotiations with suppliers
"""

import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from loguru import logger

from app.database import supabase
from app.models import (
    NegotiationSession,
    NegotiationRound,
    NegotiationOffer,
    RFQ,
    Supplier
)
from app.services.preference_learner import ProcurementPreferenceLearner
from app.services.strategy_selector import NegotiationStrategyEngine
from app.services.trade_off_optimizer import TradeOffOptimizer
from app.redis_client import redis_client


class NegotiationEngine:
    """
    Main orchestrator for AI-powered negotiations.
    """

    def __init__(self):
        self.preference_learner = ProcurementPreferenceLearner()
        self.strategy_engine = NegotiationStrategyEngine()
        self.trade_off_optimizer = TradeOffOptimizer()

    async def create_session(
        self,
        rfq_id: str,
        user_id: str,
        strategy: str = "balanced",
        max_rounds: int = 5
    ) -> NegotiationSession:
        """
        Create a new negotiation session for an RFQ.

        Args:
            rfq_id: ID of the RFQ to negotiate
            user_id: ID of the buyer user
            strategy: Negotiation strategy (aggressive, balanced, conservative)
            max_rounds: Maximum number of negotiation rounds

        Returns:
            NegotiationSession object
        """
        logger.info(f"Creating negotiation session for RFQ {rfq_id}")

        # Get RFQ details
        rfq = await self._get_rfq(rfq_id)
        if not rfq:
            raise ValueError(f"RFQ {rfq_id} not found")

        # Load user preferences
        user_prefs = await self.preference_learner.load_preferences(user_id)

        # Create session
        session_data = {
            "rfq_id": rfq_id,
            "user_id": user_id,
            "status": "active",
            "strategy": strategy,
            "max_rounds": max_rounds,
            "current_round": 0,
            "deadline_at": datetime.utcnow() + timedelta(days=7),
            "budget_usd": rfq.budget_max,
            "target_lead_time_days": rfq.deadline_date_days,
        }

        result = supabase.table("negotiation_sessions").insert(session_data).execute()
        session = NegotiationSession(**result.data[0])

        # Send initial RFQ to suppliers
        await self._send_initial_rfq_to_suppliers(session, rfq)

        logger.info(f"Created negotiation session {session.id}")
        return session

    async def execute_round(self, session_id: str) -> Dict:
        """
        Execute one round of negotiation.

        Flow:
        1. Collect supplier responses (if any)
        2. Evaluate all current offers
        3. Select action (accept, counter, drop supplier, etc.)
        4. Execute action
        5. Update session state

        Returns:
            Dictionary with round results
        """
        logger.info(f"Executing negotiation round for session {session_id}")

        # Load session
        session = await self._get_session(session_id)
        if session.status != "active":
            raise ValueError(f"Session {session_id} is not active")

        # Increment round
        session.current_round += 1

        # Get current offers
        current_offers = await self._get_current_offers(session_id)

        if not current_offers:
            logger.warning(f"No offers received for session {session_id}")
            return {
                "status": "waiting_for_offers",
                "round": session.current_round,
                "message": "Waiting for supplier responses"
            }

        # Load user preferences
        user_prefs = await self.preference_learner.load_preferences(session.user_id)

        # Create negotiation state
        state = self._create_negotiation_state(session, current_offers, user_prefs)

        # Select action using RL policy
        action = self.strategy_engine.select_action(state)

        # Execute action
        result = await self._execute_action(session, action, current_offers)

        # Log round
        await self._log_round(session, action, result)

        # Check if negotiation is complete
        if result.get("final", False):
            await self._finalize_session(session, result)

        return result

    async def _send_initial_rfq_to_suppliers(
        self,
        session: NegotiationSession,
        rfq: RFQ
    ):
        """
        Send initial RFQ to all qualified suppliers.
        """
        # Get qualified suppliers for this RFQ
        suppliers = await self._find_qualified_suppliers(rfq)

        logger.info(f"Sending RFQ to {len(suppliers)} suppliers")

        # Create initial round
        round_data = {
            "session_id": session.id,
            "round_number": 0,
            "action_type": "initial_rfq_send",
            "actor": "buyer_agent",
            "actor_id": session.user_id,
            "details": {
                "supplier_count": len(suppliers),
                "rfq_summary": {
                    "title": rfq.title,
                    "quantity": rfq.quantity,
                    "budget": rfq.budget_max,
                    "deadline": rfq.deadline_date.isoformat()
                }
            }
        }

        result = supabase.table("negotiation_rounds").insert(round_data).execute()
        round_id = result.data[0]["id"]

        # Send to each supplier
        tasks = []
        for supplier in suppliers:
            tasks.append(
                self._send_rfq_to_supplier(
                    session, round_id, supplier, rfq
                )
            )

        await asyncio.gather(*tasks)

    async def _send_rfq_to_supplier(
        self,
        session: NegotiationSession,
        round_id: str,
        supplier: Supplier,
        rfq: RFQ
    ):
        """
        Send RFQ to a single supplier (email or API).
        """
        # Check if supplier has agent integration
        if supplier.has_agent_integration:
            # Send via API to supplier's agent
            await self._send_to_supplier_agent(session, supplier, rfq)
        else:
            # Send via email to human supplier
            await self._send_email_to_supplier(session, supplier, rfq)

        logger.info(f"Sent RFQ to supplier {supplier.id}")

    async def _evaluate_offers(
        self,
        session: NegotiationSession,
        offers: List[NegotiationOffer],
        user_prefs: Dict
    ) -> List[Dict]:
        """
        Score all offers using learned preferences + parameter engine.
        """
        scored_offers = []

        for offer in offers:
            # Get supplier risk scores from parameter engine
            supplier_risk = await self._get_supplier_risk_score(offer.supplier_id)
            geopolitical_risk = await self._get_geopolitical_risk(offer.supplier_id)
            financial_health = await self._get_supplier_financial_health(offer.supplier_id)

            # Calculate base score using preference learner
            base_score = self.preference_learner.predict_offer_score(
                offer, session.rfq_id, user_prefs
            )

            # Adjust for risks
            risk_penalty = (
                supplier_risk * 0.2 +
                geopolitical_risk * 0.15 +
                (100 - financial_health) * 0.15
            ) / 100.0

            final_score = base_score * (1 - risk_penalty)

            scored_offers.append({
                "offer": offer,
                "base_score": base_score,
                "risk_penalty": risk_penalty,
                "final_score": final_score,
                "breakdown": {
                    "price_score": self._score_price(offer.price, session.budget_usd),
                    "quality_score": offer.quality_score,
                    "lead_time_score": self._score_lead_time(
                        offer.lead_time_days, session.target_lead_time_days
                    ),
                    "supplier_reliability": 100 - supplier_risk,
                    "financial_stability": financial_health,
                    "geopolitical_safety": 100 - geopolitical_risk
                }
            })

        # Sort by final score (descending)
        scored_offers.sort(key=lambda x: x["final_score"], reverse=True)

        return scored_offers

    def _create_negotiation_state(
        self,
        session: NegotiationSession,
        offers: List[NegotiationOffer],
        user_prefs: Dict
    ) -> Dict:
        """
        Create state representation for RL policy.
        """
        # Score offers
        scored_offers = asyncio.run(
            self._evaluate_offers(session, offers, user_prefs)
        )

        state = {
            "session": session,
            "current_offers": offers,
            "scored_offers": scored_offers,
            "round_number": session.current_round,
            "max_rounds": session.max_rounds,
            "budget": session.budget_usd,
            "target_lead_time": session.target_lead_time_days,
            "user_preferences": user_prefs,
            "best_offer": scored_offers[0] if scored_offers else None,
            "second_best_offer": scored_offers[1] if len(scored_offers) > 1 else None,
            "num_active_suppliers": len(offers),
            "time_remaining": (session.deadline_at - datetime.utcnow()).days
        }

        return state

    async def _execute_action(
        self,
        session: NegotiationSession,
        action: Dict,
        offers: List[NegotiationOffer]
    ) -> Dict:
        """
        Execute negotiation action.

        Action types:
        - accept_offer: Accept best offer and end negotiation
        - counter_offer: Send counteroffer to supplier
        - drop_supplier: Remove supplier from negotiation
        - request_concession: Request price/lead time improvement
        - end_negotiation: End without accepting (fallback to manual)
        """
        action_type = action["type"]

        if action_type == "accept_offer":
            return await self._accept_offer(session, action["offer_id"])

        elif action_type == "counter_offer":
            return await self._send_counter_offer(
                session,
                action["supplier_id"],
                action["counter_price"],
                action["counter_lead_time"]
            )

        elif action_type == "request_concession":
            return await self._request_concession(
                session,
                action["supplier_id"],
                action["concession_type"],
                action["concession_amount"]
            )

        elif action_type == "drop_supplier":
            return await self._drop_supplier(session, action["supplier_id"])

        elif action_type == "end_negotiation":
            return await self._end_negotiation_manual(session)

        else:
            raise ValueError(f"Unknown action type: {action_type}")

    async def _accept_offer(
        self,
        session: NegotiationSession,
        offer_id: str
    ) -> Dict:
        """
        Accept an offer and finalize negotiation.
        """
        logger.info(f"Accepting offer {offer_id} in session {session.id}")

        # Update offer status
        supabase.table("negotiation_offers").update({
            "status": "accepted"
        }).eq("id", offer_id).execute()

        # Get offer details
        offer = await self._get_offer(offer_id)

        # Calculate savings
        savings_usd = session.budget_usd - offer.price * offer.quantity
        savings_percent = (savings_usd / session.budget_usd) * 100

        return {
            "status": "accepted",
            "final": True,
            "offer_id": offer_id,
            "supplier_id": offer.supplier_id,
            "price": offer.price,
            "lead_time_days": offer.lead_time_days,
            "savings_usd": savings_usd,
            "savings_percent": savings_percent,
            "message": f"Accepted offer from supplier {offer.supplier_id}"
        }

    async def _send_counter_offer(
        self,
        session: NegotiationSession,
        supplier_id: str,
        counter_price: float,
        counter_lead_time: int
    ) -> Dict:
        """
        Send counteroffer to supplier.
        """
        logger.info(
            f"Sending counteroffer to supplier {supplier_id}: "
            f"${counter_price}, {counter_lead_time} days"
        )

        # Create counter offer record
        counter_data = {
            "session_id": session.id,
            "round_id": session.current_round,
            "supplier_id": supplier_id,
            "price": counter_price,
            "lead_time_days": counter_lead_time,
            "status": "pending_supplier_response"
        }

        supabase.table("negotiation_offers").insert(counter_data).execute()

        # Send to supplier (email or API)
        supplier = await self._get_supplier(supplier_id)
        await self._send_counter_to_supplier(session, supplier, counter_price, counter_lead_time)

        return {
            "status": "counter_offer_sent",
            "final": False,
            "supplier_id": supplier_id,
            "counter_price": counter_price,
            "counter_lead_time": counter_lead_time,
            "message": "Waiting for supplier response"
        }

    async def _finalize_session(
        self,
        session: NegotiationSession,
        result: Dict
    ):
        """
        Finalize negotiation session and update learning models.
        """
        # Update session status
        final_status = "completed" if result.get("status") == "accepted" else "failed"

        supabase.table("negotiation_sessions").update({
            "status": final_status,
            "updated_at": datetime.utcnow()
        }).eq("id", session.id).execute()

        # Update RL model with reward
        if result.get("status") == "accepted":
            reward = self.strategy_engine.calculate_reward(result, session)
            await self._update_rl_model(session, reward)

        # Update user preference model
        await self.preference_learner.update_from_negotiation(
            session.user_id, session.id, result
        )

        logger.info(f"Finalized negotiation session {session.id} with status {final_status}")

    async def _get_supplier_risk_score(self, supplier_id: str) -> int:
        """Get composite supplier risk score from parameter engine."""
        # This would call the parameter computation engine
        # For now, mock implementation
        return 25  # 0-100, lower is better

    async def _get_geopolitical_risk(self, supplier_id: str) -> int:
        """Get geopolitical risk score for supplier location."""
        return 15

    async def _get_supplier_financial_health(self, supplier_id: str) -> int:
        """Get supplier financial health score."""
        return 85  # 0-100, higher is better

    def _score_price(self, price: float, budget: float) -> float:
        """Score price (0-100, higher is better)."""
        if price > budget:
            return 0.0
        return ((budget - price) / budget) * 100

    def _score_lead_time(self, lead_time: int, target: int) -> float:
        """Score lead time (0-100, higher is better)."""
        if lead_time > target * 1.5:
            return 0.0
        elif lead_time <= target:
            return 100.0
        else:
            return 100 - ((lead_time - target) / target) * 100

    # Additional helper methods...
    async def _get_session(self, session_id: str) -> NegotiationSession:
        """Get negotiation session by ID."""
        result = supabase.table("negotiation_sessions").select("*").eq("id", session_id).execute()
        if not result.data:
            raise ValueError(f"Session {session_id} not found")
        return NegotiationSession(**result.data[0])

    async def _get_rfq(self, rfq_id: str) -> RFQ:
        """Get RFQ by ID."""
        result = supabase.table("rfqs").select("*").eq("id", rfq_id).execute()
        if not result.data:
            raise ValueError(f"RFQ {rfq_id} not found")
        return RFQ(**result.data[0])

    async def _get_current_offers(self, session_id: str) -> List[NegotiationOffer]:
        """Get all active offers for a session."""
        result = supabase.table("negotiation_offers").select("*").eq(
            "session_id", session_id
        ).eq("status", "active").execute()
        return [NegotiationOffer(**row) for row in result.data]

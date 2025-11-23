"""
Procurement Preference Learning Module
Uses Inverse Reinforcement Learning to learn buyer's implicit preferences
"""

import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from loguru import logger
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from app.database import supabase
from app.models import RFQ, NegotiationOffer


class ProcurementPreferenceLearner:
    """
    Learn buyer's implicit procurement preferences from historical decisions.

    Uses Inverse Reinforcement Learning (IRL) to infer feature weights that
    best explain the buyer's past choices.
    """

    def __init__(self):
        self.feature_weights = {}
        self.supplier_loyalty_bonuses = {}
        self.scaler = StandardScaler()
        self.confidence_score = 0.0
        self.learned_from_count = 0

    async def load_preferences(self, user_id: str) -> Dict:
        """
        Load learned preferences for a user from database.
        If not exists, learn from historical RFQs.
        """
        # Try to load from DB
        result = supabase.table("user_preferences").select("*").eq(
            "user_id", user_id
        ).execute()

        if result.data:
            prefs = result.data[0]
            self.feature_weights = prefs["feature_weights"]
            self.supplier_loyalty_bonuses = prefs["supplier_loyalty_bonuses"]
            self.confidence_score = prefs["confidence_score"]
            self.learned_from_count = prefs["learned_from_rfq_count"]

            logger.info(
                f"Loaded preferences for user {user_id}: "
                f"{self.learned_from_count} RFQs, confidence {self.confidence_score:.2f}"
            )
            return prefs

        # Not found, learn from historical RFQs
        logger.info(f"No preferences found for user {user_id}, learning from history...")
        await self.learn_from_history(user_id)
        return await self.load_preferences(user_id)

    async def learn_from_history(self, user_id: str, min_rfqs: int = 5):
        """
        Learn preferences from user's historical RFQs.

        Args:
            user_id: User to learn preferences for
            min_rfqs: Minimum number of completed RFQs required
        """
        # Get historical RFQs with multiple offers where buyer made a choice
        historical_rfqs = await self._get_historical_rfqs(user_id)

        if len(historical_rfqs) < min_rfqs:
            logger.warning(
                f"Insufficient data for user {user_id}: "
                f"{len(historical_rfqs)} RFQs (need {min_rfqs})"
            )
            # Use default preferences
            self._use_default_preferences()
            await self._save_preferences(user_id)
            return

        logger.info(f"Learning from {len(historical_rfqs)} historical RFQs...")

        # Extract training data
        X_chosen, X_rejected, contexts = await self._extract_training_data(
            historical_rfqs
        )

        # Fit IRL model
        self._fit_irl_model(X_chosen, X_rejected, contexts)

        # Learn supplier loyalty patterns
        self._learn_supplier_loyalty(historical_rfqs)

        # Calculate confidence score
        self.confidence_score = min(1.0, len(historical_rfqs) / 50.0)
        self.learned_from_count = len(historical_rfqs)

        # Save to database
        await self._save_preferences(user_id)

        logger.info(
            f"Learned preferences for user {user_id}: "
            f"confidence={self.confidence_score:.2f}"
        )

    async def _extract_training_data(
        self,
        historical_rfqs: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray, List[Dict]]:
        """
        Extract features for chosen and rejected offers.

        Returns:
            X_chosen: Feature matrix for chosen offers
            X_rejected: Feature matrix for rejected offers
            contexts: Contextual information for each RFQ
        """
        X_chosen = []
        X_rejected = []
        contexts = []

        for rfq_data in historical_rfqs:
            rfq_id = rfq_data["rfq_id"]
            chosen_offer_id = rfq_data["chosen_offer_id"]

            # Get all offers for this RFQ
            offers = await self._get_offers_for_rfq(rfq_id)

            if len(offers) < 2:
                continue  # Need at least 2 offers to learn

            # Find chosen and rejected offers
            chosen = next((o for o in offers if o.id == chosen_offer_id), None)
            rejected = [o for o in offers if o.id != chosen_offer_id]

            if not chosen:
                continue

            # Extract features
            rfq = await self._get_rfq(rfq_id)
            context = self._get_rfq_context(rfq)

            chosen_features = self._extract_offer_features(chosen, rfq)
            X_chosen.append(chosen_features)
            contexts.append(context)

            for reject in rejected:
                rejected_features = self._extract_offer_features(reject, rfq)
                X_rejected.append(rejected_features)

        return (
            np.array(X_chosen),
            np.array(X_rejected),
            contexts
        )

    def _extract_offer_features(self, offer: NegotiationOffer, rfq: RFQ) -> List[float]:
        """
        Extract feature vector from an offer.

        Features:
        - price_normalized: offer price / budget
        - price_vs_budget_percent: (budget - price) / budget * 100
        - lead_time_normalized: offer lead time / target lead time
        - quality_score: supplier quality score (0-100)
        - on_time_delivery_rate: supplier OTD rate
        - supplier_relationship_tenure_months: how long we've worked with supplier
        - supplier_financial_health: supplier financial score (0-100)
        - geopolitical_risk: supplier location geopolitical risk (0-100)
        - payment_terms_score: score of payment terms (0-100)
        """
        features = []

        # Price features
        features.append(offer.price / rfq.budget_max)  # price_normalized
        features.append((rfq.budget_max - offer.price) / rfq.budget_max)  # savings ratio

        # Lead time features
        if rfq.deadline_date_days:
            features.append(offer.lead_time_days / rfq.deadline_date_days)
        else:
            features.append(0.5)

        # Quality and reliability (would be fetched from parameter engine)
        features.append(offer.quality_score / 100.0)
        features.append(self._get_supplier_otd_rate(offer.supplier_id) / 100.0)

        # Relationship features
        relationship_months = self._get_relationship_tenure(offer.supplier_id)
        features.append(min(relationship_months / 60.0, 1.0))  # normalize to 0-1

        # Risk features
        financial_health = self._get_supplier_financial_health(offer.supplier_id)
        features.append(financial_health / 100.0)

        geopolitical_risk = self._get_geopolitical_risk(offer.supplier_id)
        features.append(1.0 - geopolitical_risk / 100.0)  # invert so higher is better

        # Payment terms
        payment_score = self._score_payment_terms(offer.payment_terms)
        features.append(payment_score / 100.0)

        return features

    def _fit_irl_model(
        self,
        X_chosen: np.ndarray,
        X_rejected: np.ndarray,
        contexts: List[Dict]
    ):
        """
        Fit Inverse Reinforcement Learning model.

        Approach: Treat as a ranking problem. The chosen offer should score
        higher than rejected offers. Use logistic regression with ranking loss.
        """
        if len(X_chosen) == 0:
            logger.warning("No training data, using default weights")
            self._use_default_preferences()
            return

        # Create training data: positive examples (chosen) vs negative (rejected)
        X = np.vstack([X_chosen, X_rejected])
        y = np.array([1] * len(X_chosen) + [0] * len(X_rejected))

        # Normalize features
        X_scaled = self.scaler.fit_transform(X)

        # Fit logistic regression
        model = LogisticRegression(max_iter=1000, random_state=42)
        model.fit(X_scaled, y)

        # Extract feature weights
        feature_names = [
            'price_normalized',
            'price_savings_ratio',
            'lead_time_normalized',
            'quality_score',
            'on_time_delivery_rate',
            'relationship_tenure',
            'financial_health',
            'geopolitical_safety',
            'payment_terms_score'
        ]

        self.feature_weights = {
            name: float(weight)
            for name, weight in zip(feature_names, model.coef_[0])
        }

        logger.info(f"Learned feature weights: {self.feature_weights}")

    def _learn_supplier_loyalty(self, historical_rfqs: List[Dict]):
        """
        Detect supplier loyalty patterns.

        If buyer consistently chooses the same supplier even when not the
        cheapest, infer a loyalty bonus.
        """
        supplier_choice_counts = {}
        supplier_was_cheapest_counts = {}

        for rfq_data in historical_rfqs:
            chosen_offer_id = rfq_data["chosen_offer_id"]
            rfq_id = rfq_data["rfq_id"]

            offers = asyncio.run(self._get_offers_for_rfq(rfq_id))
            if len(offers) < 2:
                continue

            chosen = next((o for o in offers if o.id == chosen_offer_id), None)
            if not chosen:
                continue

            supplier_id = chosen.supplier_id

            # Count how many times this supplier was chosen
            supplier_choice_counts[supplier_id] = \
                supplier_choice_counts.get(supplier_id, 0) + 1

            # Check if this supplier had the lowest price
            cheapest_price = min(o.price for o in offers)
            if chosen.price == cheapest_price:
                supplier_was_cheapest_counts[supplier_id] = \
                    supplier_was_cheapest_counts.get(supplier_id, 0) + 1

        # Calculate loyalty bonuses
        for supplier_id, choice_count in supplier_choice_counts.items():
            cheapest_count = supplier_was_cheapest_counts.get(supplier_id, 0)

            if choice_count >= 5:  # Minimum threshold
                # Ratio of times chosen despite not being cheapest
                non_cheapest_ratio = (choice_count - cheapest_count) / choice_count

                if non_cheapest_ratio > 0.3:  # Chosen 30%+ of time despite not cheapest
                    loyalty_bonus = non_cheapest_ratio * 0.2  # Max 20% bonus
                    self.supplier_loyalty_bonuses[supplier_id] = loyalty_bonus

                    logger.info(
                        f"Detected loyalty to supplier {supplier_id}: "
                        f"chosen {choice_count} times, cheapest {cheapest_count} times, "
                        f"bonus={loyalty_bonus:.2f}"
                    )

    def predict_offer_score(
        self,
        offer: NegotiationOffer,
        rfq_id: str,
        preferences: Optional[Dict] = None
    ) -> float:
        """
        Predict score for an offer based on learned preferences.

        Returns:
            Score (0-100), higher is better
        """
        if preferences is None:
            preferences = {
                "feature_weights": self.feature_weights,
                "supplier_loyalty_bonuses": self.supplier_loyalty_bonuses
            }

        # Get RFQ
        rfq = asyncio.run(self._get_rfq(rfq_id))

        # Extract features
        features = self._extract_offer_features(offer, rfq)

        # Calculate weighted score
        score = 0.0
        feature_names = list(self.feature_weights.keys())

        for i, feature_name in enumerate(feature_names):
            if i < len(features):
                weight = preferences["feature_weights"].get(feature_name, 0.0)
                score += weight * features[i]

        # Add supplier loyalty bonus
        loyalty_bonus = preferences["supplier_loyalty_bonuses"].get(
            offer.supplier_id, 0.0
        )
        score += loyalty_bonus

        # Normalize to 0-100 scale (logistic function)
        score_normalized = 100 / (1 + np.exp(-score))

        return score_normalized

    def explain_preference(
        self,
        chosen_offer: NegotiationOffer,
        alternative_offers: List[NegotiationOffer],
        rfq_id: str
    ) -> Dict:
        """
        Explain why chosen offer was preferred over alternatives.

        Returns human-readable explanation of decision factors.
        """
        rfq = asyncio.run(self._get_rfq(rfq_id))

        chosen_features = self._extract_offer_features(chosen_offer, rfq)
        chosen_score = self.predict_offer_score(chosen_offer, rfq_id)

        explanations = []

        for alt_offer in alternative_offers:
            alt_features = self._extract_offer_features(alt_offer, rfq)
            alt_score = self.predict_offer_score(alt_offer, rfq_id)

            score_delta = chosen_score - alt_score

            # Decompose score difference by feature
            feature_contributions = {}
            feature_names = list(self.feature_weights.keys())

            for i, feature_name in enumerate(feature_names):
                if i < len(chosen_features):
                    weight = self.feature_weights.get(feature_name, 0.0)
                    feature_delta = (chosen_features[i] - alt_features[i]) * weight
                    feature_contributions[feature_name] = feature_delta

            # Find top 3 contributing factors
            top_factors = sorted(
                feature_contributions.items(),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:3]

            # Generate human-readable explanation
            reason_parts = []
            for factor_name, contribution in top_factors:
                if contribution > 0:
                    reason_parts.append(
                        self._factor_to_english(factor_name, "better")
                    )
                elif contribution < 0:
                    reason_parts.append(
                        self._factor_to_english(factor_name, "worse")
                    )

            explanations.append({
                "alternative_supplier": alt_offer.supplier_id,
                "score_delta": score_delta,
                "primary_reasons": reason_parts,
                "feature_contributions": feature_contributions
            })

        return {
            "chosen_supplier": chosen_offer.supplier_id,
            "chosen_score": chosen_score,
            "explanations": explanations
        }

    def _factor_to_english(self, factor_name: str, direction: str) -> str:
        """Convert feature name to human-readable explanation."""
        explanations = {
            "price_savings_ratio": {
                "better": "better price (more savings)",
                "worse": "worse price (less savings)"
            },
            "quality_score": {
                "better": "higher quality score",
                "worse": "lower quality score"
            },
            "lead_time_normalized": {
                "better": "faster delivery",
                "worse": "slower delivery"
            },
            "on_time_delivery_rate": {
                "better": "better on-time delivery track record",
                "worse": "worse delivery reliability"
            },
            "relationship_tenure": {
                "better": "longer business relationship",
                "worse": "newer supplier relationship"
            },
            "financial_health": {
                "better": "stronger financial health",
                "worse": "weaker financial position"
            },
            "geopolitical_safety": {
                "better": "lower geopolitical risk",
                "worse": "higher geopolitical risk"
            }
        }

        return explanations.get(factor_name, {}).get(direction, factor_name)

    def _use_default_preferences(self):
        """Use default preference weights when no historical data."""
        self.feature_weights = {
            'price_normalized': -0.6,  # Lower price is better (negative weight)
            'price_savings_ratio': 0.6,  # Higher savings is better
            'lead_time_normalized': -0.3,  # Shorter lead time is better
            'quality_score': 0.5,
            'on_time_delivery_rate': 0.4,
            'relationship_tenure': 0.2,
            'financial_health': 0.3,
            'geopolitical_safety': 0.25,
            'payment_terms_score': 0.15
        }
        self.supplier_loyalty_bonuses = {}
        self.confidence_score = 0.1  # Low confidence for defaults

    async def _save_preferences(self, user_id: str):
        """Save learned preferences to database."""
        data = {
            "user_id": user_id,
            "feature_weights": self.feature_weights,
            "supplier_loyalty_bonuses": self.supplier_loyalty_bonuses,
            "learned_from_rfq_count": self.learned_from_count,
            "confidence_score": self.confidence_score,
            "last_updated_at": datetime.utcnow().isoformat()
        }

        # Upsert
        result = supabase.table("user_preferences").upsert(data).execute()
        logger.info(f"Saved preferences for user {user_id}")

    # Helper methods (mocked for now, would call real services)
    def _get_supplier_otd_rate(self, supplier_id: str) -> float:
        """Get supplier on-time delivery rate (0-100)."""
        return 85.0  # Mock

    def _get_relationship_tenure(self, supplier_id: str) -> int:
        """Get relationship tenure in months."""
        return 24  # Mock

    def _get_supplier_financial_health(self, supplier_id: str) -> float:
        """Get supplier financial health score (0-100)."""
        return 75.0  # Mock

    def _get_geopolitical_risk(self, supplier_id: str) -> float:
        """Get geopolitical risk score (0-100)."""
        return 20.0  # Mock

    def _score_payment_terms(self, payment_terms: str) -> float:
        """Score payment terms (0-100)."""
        # Simple scoring: NET 30 = 100, NET 60 = 75, NET 90 = 50, etc.
        if "NET 30" in payment_terms or "Net 30" in payment_terms:
            return 100.0
        elif "NET 60" in payment_terms:
            return 75.0
        elif "NET 90" in payment_terms:
            return 50.0
        else:
            return 60.0  # Default

    def _get_rfq_context(self, rfq: RFQ) -> Dict:
        """Extract context from RFQ."""
        return {
            "urgency": rfq.urgency,
            "category": rfq.category,
            "budget": rfq.budget_max,
            "quantity": rfq.quantity
        }

    async def _get_historical_rfqs(self, user_id: str) -> List[Dict]:
        """Get completed RFQs with accepted offers."""
        # This would query the database for historical RFQs
        # Mock for now
        return []

    async def _get_offers_for_rfq(self, rfq_id: str) -> List[NegotiationOffer]:
        """Get all offers for an RFQ."""
        result = supabase.table("offers").select("*").eq("rfq_id", rfq_id).execute()
        return [NegotiationOffer(**row) for row in result.data]

    async def _get_rfq(self, rfq_id: str) -> RFQ:
        """Get RFQ by ID."""
        result = supabase.table("rfqs").select("*").eq("id", rfq_id).execute()
        return RFQ(**result.data[0])

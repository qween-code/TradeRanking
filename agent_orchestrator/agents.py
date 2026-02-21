"""
Individual agent implementations for the procurement pipeline.

Each agent receives a context dict and returns results.
In production, these would integrate with external APIs and ML models.
"""

import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
from loguru import logger
from uuid import uuid4


class BaseAgent:
    """Base class for all agents."""

    name: str = "base"

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class RFQIntakeAgent(BaseAgent):
    """
    Agent 1: Validates and enriches RFQ data.
    - Validates required fields
    - Normalizes product categories
    - Enriches with market intelligence
    - Classifies HS codes
    """

    name = "rfq_intake"

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        rfq = context.get("rfq_data", {})
        logger.info(f"[RFQ Intake] Processing: {rfq.get('title', 'N/A')}")

        await asyncio.sleep(0.5)  # Simulate processing

        # Validate
        missing = [f for f in ["title", "quantity"] if not rfq.get(f)]

        # Enrich with HS code classification
        hs_code = self._classify_hs_code(rfq.get("category", ""), rfq.get("title", ""))

        # Market intelligence snapshot
        market_data = {
            "estimated_market_price_usd": round(random.uniform(10, 500), 2),
            "price_trend_30d": random.choice(["rising", "stable", "falling"]),
            "supply_demand_balance": random.choice(["balanced", "shortage", "oversupply"]),
            "recommended_urgency": rfq.get("urgency", "medium"),
        }

        return {
            "valid": len(missing) == 0,
            "missing_fields": missing,
            "enriched_rfq": {
                **rfq,
                "hs_code_6digit": hs_code,
                "normalized_category": rfq.get("category", "general"),
            },
            "market_intelligence": market_data,
            "processed_at": datetime.utcnow().isoformat(),
        }

    def _classify_hs_code(self, category: str, title: str) -> str:
        codes = {
            "metals": "720890",
            "electronics": "854231",
            "chemicals": "290539",
            "textiles": "520932",
            "machinery": "843149",
            "plastics": "390190",
            "food": "210690",
        }
        return codes.get(category, "999999")


class SupplierDiscoveryAgent(BaseAgent):
    """
    Agent 2: Discovers and matches suppliers.
    - Searches supplier database by category
    - Scores suppliers based on 3000+ parameters
    - Returns ranked list of best matches
    """

    name = "supplier_discovery"

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        rfq = context["agent_results"].get("rfq_intake", {}).get("enriched_rfq", context.get("rfq_data", {}))
        category = rfq.get("category", "general")
        logger.info(f"[Supplier Discovery] Finding suppliers for: {category}")

        await asyncio.sleep(0.8)  # Simulate API calls

        # Generate matched suppliers with risk scores
        suppliers = []
        for i in range(random.randint(5, 12)):
            supplier = {
                "id": str(uuid4()),
                "name": f"Supplier_{category.title()}_{i+1}",
                "company": f"Global {category.title()} Corp #{i+1}",
                "email": f"sales@supplier{i+1}.com",
                "country": random.choice(["China", "Germany", "USA", "Turkey", "India", "Japan", "South Korea"]),
                "match_score": round(random.uniform(60, 99), 1),
                "risk_score": random.randint(5, 60),
                "financial_health": random.randint(50, 95),
                "quality_score": random.randint(60, 99),
                "on_time_delivery": round(random.uniform(80, 99), 1),
                "verified": random.choice([True, True, False]),
                "categories": [category],
            }
            suppliers.append(supplier)

        # Sort by match score
        suppliers.sort(key=lambda s: s["match_score"], reverse=True)

        return {
            "total_found": len(suppliers),
            "suppliers": suppliers,
            "discovery_method": "category_match + risk_scoring",
            "processed_at": datetime.utcnow().isoformat(),
        }


class EmailSendAgent(BaseAgent):
    """
    Agent 3: Sends RFQ invitations to discovered suppliers.
    - Generates personalized email content
    - Sends via SMTP or email API
    - Tracks delivery status
    """

    name = "email_send"

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        discovery = context["agent_results"].get("supplier_discovery", {})
        suppliers = discovery.get("suppliers", [])
        rfq = context.get("rfq_data", {})

        logger.info(f"[Email Send] Sending RFQ to {len(suppliers)} suppliers")

        await asyncio.sleep(0.3)

        sent_results = []
        for supplier in suppliers[:10]:  # Max 10 suppliers per RFQ
            sent_results.append({
                "supplier_id": supplier["id"],
                "supplier_name": supplier["name"],
                "email": supplier["email"],
                "status": random.choice(["sent", "sent", "sent", "queued"]),
                "sent_at": datetime.utcnow().isoformat(),
            })

        return {
            "total_sent": len(sent_results),
            "results": sent_results,
            "rfq_title": rfq.get("title", "N/A"),
            "processed_at": datetime.utcnow().isoformat(),
        }


class InboxParserAgent(BaseAgent):
    """
    Agent 4: Parses supplier responses and extracts offers.
    - Monitors email inbox for responses
    - Uses NLP to extract price, lead time, terms
    - Creates structured offer records
    """

    name = "inbox_parser"

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        email_results = context["agent_results"].get("email_send", {})
        sent = email_results.get("results", [])
        rfq = context.get("rfq_data", {})

        logger.info(f"[Inbox Parser] Parsing responses from {len(sent)} suppliers")

        await asyncio.sleep(0.6)

        # Simulate receiving responses (in reality would poll inbox)
        response_rate = random.uniform(0.3, 0.8)
        responding = sent[:int(len(sent) * response_rate)]

        offers = []
        for supplier_info in responding:
            base_price = random.uniform(20, 200)
            qty = rfq.get("quantity", 1000)
            offer = {
                "id": str(uuid4()),
                "supplier_id": supplier_info["supplier_id"],
                "supplier_name": supplier_info["supplier_name"],
                "unit_price": round(base_price, 2),
                "total_price": round(base_price * qty, 2),
                "delivery_time_days": random.randint(7, 60),
                "payment_terms": random.choice(["NET 30", "NET 60", "NET 90", "50% advance"]),
                "moq": random.choice([100, 500, 1000, 5000]),
                "notes": "Standard terms apply. FOB origin.",
                "parsed_from": "email",
                "confidence_score": round(random.uniform(0.85, 0.99), 2),
            }
            offers.append(offer)

        return {
            "total_responses": len(offers),
            "response_rate": round(len(offers) / max(len(sent), 1) * 100, 1),
            "offers": offers,
            "processed_at": datetime.utcnow().isoformat(),
        }


class SupplierVerifierAgent(BaseAgent):
    """
    Agent 5: Verifies supplier credentials and offer quality.
    - Checks supplier certifications
    - Validates pricing against market data
    - Assesses offer quality and reliability
    - Flags suspicious offers
    """

    name = "supplier_verifier"

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        parsed = context["agent_results"].get("inbox_parser", {})
        offers = parsed.get("offers", [])
        market = context["agent_results"].get("rfq_intake", {}).get("market_intelligence", {})
        market_price = market.get("estimated_market_price_usd", 100)

        logger.info(f"[Supplier Verifier] Verifying {len(offers)} offers")

        await asyncio.sleep(0.4)

        verified_offers = []
        for offer in offers:
            price_deviation = abs(offer["unit_price"] - market_price) / market_price * 100
            is_suspicious = price_deviation > 50

            verification = {
                **offer,
                "verification_score": round(random.uniform(60, 99), 1),
                "verified": not is_suspicious,
                "price_vs_market_percent": round(
                    (offer["unit_price"] - market_price) / market_price * 100, 1
                ),
                "flags": [],
            }

            if is_suspicious:
                verification["flags"].append("price_deviation_high")
            if offer["delivery_time_days"] < 7:
                verification["flags"].append("delivery_time_unrealistic")
            if offer.get("moq", 0) > context.get("rfq_data", {}).get("quantity", 9999):
                verification["flags"].append("moq_exceeds_quantity")

            verified_offers.append(verification)

        return {
            "total_verified": len(verified_offers),
            "passed": sum(1 for o in verified_offers if o["verified"]),
            "flagged": sum(1 for o in verified_offers if o["flags"]),
            "offers": verified_offers,
            "processed_at": datetime.utcnow().isoformat(),
        }


class AggregationReportAgent(BaseAgent):
    """
    Agent 6: Generates final comparison report.
    - Ranks all verified offers
    - Calculates total cost of ownership
    - Generates recommendation
    - Creates executive summary
    """

    name = "aggregation_report"

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        verified = context["agent_results"].get("supplier_verifier", {})
        offers = verified.get("offers", [])
        rfq = context.get("rfq_data", {})

        logger.info(f"[Aggregation Report] Generating report for {len(offers)} offers")

        await asyncio.sleep(0.3)

        # Score and rank offers
        scored = []
        for offer in offers:
            if not offer.get("verified", True):
                continue

            # Weighted scoring
            price_score = max(0, 100 - abs(offer.get("price_vs_market_percent", 0)))
            delivery_score = max(0, 100 - offer.get("delivery_time_days", 30))
            verification_score = offer.get("verification_score", 70)

            total_score = (price_score * 0.4 + delivery_score * 0.3 + verification_score * 0.3)

            scored.append({
                "rank": 0,
                "supplier_id": offer["supplier_id"],
                "supplier_name": offer["supplier_name"],
                "unit_price": offer["unit_price"],
                "total_price": offer["total_price"],
                "delivery_time_days": offer["delivery_time_days"],
                "payment_terms": offer.get("payment_terms", "N/A"),
                "total_score": round(total_score, 1),
                "price_score": round(price_score, 1),
                "delivery_score": round(delivery_score, 1),
                "verification_score": round(verification_score, 1),
                "flags": offer.get("flags", []),
                "recommendation": "",
            })

        # Sort by score
        scored.sort(key=lambda x: x["total_score"], reverse=True)

        for i, s in enumerate(scored):
            s["rank"] = i + 1
            if i == 0:
                s["recommendation"] = "BEST_OVERALL"
            elif s["unit_price"] == min(o["unit_price"] for o in scored):
                s["recommendation"] = "LOWEST_PRICE"
            elif s["delivery_time_days"] == min(o["delivery_time_days"] for o in scored):
                s["recommendation"] = "FASTEST_DELIVERY"

        # Executive summary
        best = scored[0] if scored else None
        summary = {
            "rfq_title": rfq.get("title", "N/A"),
            "total_suppliers_contacted": len(context["agent_results"].get("email_send", {}).get("results", [])),
            "total_responses": len(context["agent_results"].get("inbox_parser", {}).get("offers", [])),
            "total_verified": len(scored),
            "recommended_supplier": best["supplier_name"] if best else "N/A",
            "recommended_price": best["unit_price"] if best else 0,
            "potential_savings_percent": round(
                (1 - (best["unit_price"] / max(rfq.get("budget_max", best["unit_price"]), 1))) * 100, 1
            ) if best and rfq.get("budget_max") else 0,
        }

        return {
            "summary": summary,
            "ranked_offers": scored,
            "total_ranked": len(scored),
            "generated_at": datetime.utcnow().isoformat(),
        }

# AI-Powered Autonomous Negotiation Framework
## B2B Agentik Platform - Advanced Implementation Specification

> **Version**: 1.0
> **Last Updated**: January 2025
> **Status**: Technical Implementation Blueprint

---

## 1. Executive Summary

This document specifies the AI-powered autonomous negotiation system that enables buyer agents to negotiate with supplier agents (or humans) using advanced reinforcement learning, game theory, and reverse-engineered procurement logic.

### 1.1. Key Capabilities

1. **Multi-Agent Negotiation**: Buyer agent ↔ Supplier agent (or human)
2. **Reverse-Engineering**: Learn implicit decision rules from historical buyer behavior
3. **Multi-Round Bidding**: Dynamic reverse auctions with intelligent bid adjustments
4. **Trade-Off Optimization**: Price vs. lead time vs. quality vs. payment terms
5. **Relationship-Based Pricing**: Factor in long-term supplier relationships
6. **Real-Time Strategy Adjustment**: Adapt based on supplier responses

### 1.2. Differentiation from Competitors

**Pactum AI**: Limited to tail spend, simple rule-based negotiation
**Alibaba Accio**: Semi-automated, requires human approval at each step
**Our System**: Fully autonomous with configurable human-in-the-loop checkpoints

---

## 2. System Architecture

### 2.1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  - RFQ Creation  - Negotiation Dashboard  - Approval Workflow   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    Negotiation Orchestrator                     │
│  - Strategy Selection  - Multi-Round Management  - Monitoring   │
└─────┬──────────────────────────┬─────────────────────────┬──────┘
      │                          │                         │
┌─────▼──────┐         ┌─────────▼──────────┐    ┌────────▼──────┐
│   Buyer    │         │     Supplier       │    │   Mediator    │
│   Agent    │◄───────►│     Agent          │◄──►│   Agent       │
│            │         │  (or Human Proxy)  │    │               │
└─────┬──────┘         └─────────┬──────────┘    └────────┬──────┘
      │                          │                         │
      │                          │                         │
┌─────▼──────────────────────────▼─────────────────────────▼──────┐
│                   Knowledge & Learning Layer                    │
│  - Historical Negotiations DB  - User Preference Model          │
│  - Market Intelligence        - Supplier Behavior Patterns      │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2. Agent Types

#### 2.2.1. Buyer Agent
- **Purpose**: Represent buyer's interests in negotiation
- **Knowledge**: Company policies, budget constraints, historical purchases, market intelligence
- **Strategy**: Reinforcement Learning (PPO) + Rule-based constraints
- **Actions**: Submit bid, accept/reject offer, request changes, end negotiation

#### 2.2.2. Supplier Agent (Optional)
- **Purpose**: Represent supplier's interests (if supplier has deployed agent)
- **Knowledge**: Cost structure, capacity, margin targets
- **Strategy**: Similar RL framework or rule-based
- **Actions**: Submit counteroffer, accept/reject bid

#### 2.2.3. Human Proxy
- **Purpose**: Interface for human supplier to participate
- **Actions**: Receive bid → submit counteroffer via email/portal

#### 2.2.4. Mediator Agent
- **Purpose**: Facilitate AI-to-AI negotiation, ensure fairness, prevent deadlock
- **Knowledge**: Negotiation protocols, fairness metrics
- **Actions**: Suggest compromises, enforce timeouts, escalate to human

---

## 3. Reverse-Engineering Procurement Logic

### 3.1. Concept

The system learns implicit decision rules from historical buyer decisions. When a buyer consistently chooses Supplier X despite 5% higher price, the system infers a **quality/reliability premium**.

### 3.2. Data Collection

**Input Data**:
- Historical RFQs with multiple offers
- Buyer's final selection (accepted offer)
- Rejected offers and rejection reasons (if provided)
- Contextual factors (urgency, product criticality, etc.)

**Output**: Inferred decision weights

### 3.3. Learning Algorithm

**Approach**: Inverse Reinforcement Learning (IRL) + Explainable AI

```python
# Pseudocode for Reverse-Engineering

class ProcurementPreferenceLearner:
    """
    Learn buyer's implicit preferences from historical decisions.
    """

    def __init__(self):
        self.feature_weights = {}  # e.g., {'price': -0.8, 'quality': 0.5, 'lead_time': -0.3}
        self.supplier_loyalty_bonus = {}  # e.g., {'Supplier_X': 0.1}

    def fit(self, historical_rfqs: List[RFQ]):
        """
        Fit model using Inverse Reinforcement Learning.
        """
        # For each RFQ with multiple offers
        for rfq in historical_rfqs:
            chosen_offer = rfq.accepted_offer
            rejected_offers = rfq.rejected_offers

            # Extract features for all offers
            features = self._extract_features(rfq, chosen_offer, rejected_offers)

            # IRL: Find weights that make chosen offer score highest
            self.feature_weights = self._inverse_rl_update(features, chosen_offer)

            # Check for supplier loyalty patterns
            if chosen_offer.supplier in [r.supplier for r in rejected_offers]:
                # Buyer chose familiar supplier despite competitive offers
                self.supplier_loyalty_bonus[chosen_offer.supplier] += 0.01

    def _extract_features(self, rfq, chosen, rejected):
        """
        Extract features: normalized price, quality score, lead time, etc.
        """
        features = []
        for offer in [chosen] + rejected:
            features.append({
                'price_normalized': offer.price / rfq.budget,
                'quality_score': self._get_supplier_quality_score(offer.supplier),
                'lead_time_days': offer.lead_time,
                'on_time_delivery_rate': self._get_supplier_otd(offer.supplier),
                'relationship_tenure_months': self._get_relationship_tenure(offer.supplier),
                'geopolitical_risk': self._get_geopolitical_risk(offer.supplier),
                'payment_terms_score': self._score_payment_terms(offer.payment_terms),
            })
        return features

    def _inverse_rl_update(self, features, chosen_offer):
        """
        Inverse RL: Adjust weights so chosen offer scores highest.
        Uses gradient descent on ranking loss.
        """
        # Implementation: MaxEnt IRL or similar
        pass

    def predict_offer_score(self, offer, rfq):
        """
        Score an offer based on learned preferences.
        """
        features = self._extract_features(rfq, offer, [])
        score = 0.0
        for feature, value in features[0].items():
            score += self.feature_weights.get(feature, 0.0) * value

        # Add supplier loyalty bonus
        score += self.supplier_loyalty_bonus.get(offer.supplier, 0.0)

        return score

    def explain_decision(self, chosen_offer, alternatives):
        """
        Provide explainable AI insights.
        """
        explanations = []
        chosen_score = self.predict_offer_score(chosen_offer, None)

        for alt in alternatives:
            alt_score = self.predict_offer_score(alt, None)
            delta = chosen_score - alt_score

            # Decompose score difference
            price_contribution = self.feature_weights['price_normalized'] * (
                chosen_offer.price - alt.price
            )
            quality_contribution = self.feature_weights['quality_score'] * (
                self._get_supplier_quality_score(chosen_offer.supplier) -
                self._get_supplier_quality_score(alt.supplier)
            )

            explanations.append({
                'alternative': alt.supplier,
                'total_delta': delta,
                'price_factor': price_contribution,
                'quality_factor': quality_contribution,
                'primary_reason': self._get_primary_reason(price_contribution, quality_contribution)
            })

        return explanations

    def _get_primary_reason(self, price_contrib, quality_contrib):
        """
        Identify primary reason for preference.
        """
        if abs(quality_contrib) > abs(price_contrib):
            return "Preferred supplier has higher quality score"
        else:
            return "Preferred supplier has better price"
```

### 3.4. Inference Examples

**Example 1: Quality Premium**
```
Historical Pattern:
- Buyer chose Supplier X ($100) over Supplier Y ($95) in 8 out of 10 RFQs
- Supplier X has defect rate 50 PPM, Supplier Y has 500 PPM

Inferred Rule:
- quality_weight = 0.6
- price_weight = -0.4
- Interpretation: Buyer values quality 1.5x more than price
```

**Example 2: Lead Time Priority**
```
Historical Pattern:
- For urgent RFQs (urgency='high'), buyer chose faster suppliers even at 10% price premium

Inferred Rule:
- lead_time_weight = -0.7 (when urgency='high')
- lead_time_weight = -0.2 (when urgency='low')
```

**Example 3: Supplier Loyalty**
```
Historical Pattern:
- Buyer has worked with Supplier Z for 5 years
- Buyer chose Supplier Z in 90% of cases when price was within 3% of competitors

Inferred Rule:
- supplier_loyalty_bonus['Supplier_Z'] = 0.15
- switching_cost_aversion = 0.8
```

---

## 4. Multi-Round Negotiation Protocol

### 4.1. Negotiation Flow

```
Round 1: Initial Bids
┌────────────────────────────────────────────────────────────┐
│ Buyer: "RFQ for 10,000 units steel, max price $50/unit"   │
└─────────────────────────┬──────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    Supplier A      Supplier B      Supplier C
    "$52/unit"      "$48/unit"      "$51/unit"
    "30 days"       "45 days"       "25 days"
          │               │               │
          └───────────────┼───────────────┘
                          ▼
┌────────────────────────────────────────────────────────────┐
│ Buyer Agent Evaluates:                                     │
│ - B has best price, but 45-day lead time too long         │
│ - C has best lead time, but price slightly high           │
│ - Strategy: Negotiate with B and C                        │
└────────────────────────┬───────────────────────────────────┘
                          │
Round 2: Counteroffers
┌────────────────────────────────────────────────────────────┐
│ Buyer → Supplier B: "Can you do $48 in 35 days?"           │
│ Buyer → Supplier C: "Can you do $49/unit, keep 25 days?"  │
└─────────────────────────┬──────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    Supplier A      Supplier B      Supplier C
    (dropped)       "$48, 40 days"  "$50, 25 days"
                          │               │
                          └───────┬───────┘
                                  ▼
┌────────────────────────────────────────────────────────────┐
│ Buyer Agent Evaluates:                                     │
│ - B: $48, 40 days → acceptable but prefer faster          │
│ - C: $50, 25 days → $1 over budget, but best lead time    │
│ - Strategy: Accept C or request final concession from B   │
└────────────────────────┬───────────────────────────────────┘
                          │
Round 3: Final Negotiation
┌────────────────────────────────────────────────────────────┐
│ Buyer → Supplier B: "Final offer: $48, 30 days?"           │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
                    Supplier B
                    "$48.50, 32 days"
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│ Buyer Agent: ACCEPT Supplier B                             │
│ - Price: $48.50 (within 3% of budget)                     │
│ - Lead Time: 32 days (acceptable)                         │
│ - Total Score: 87/100 (above threshold)                   │
└────────────────────────────────────────────────────────────┘
```

### 4.2. Negotiation Strategy Engine

```python
class NegotiationStrategyEngine:
    """
    RL-based negotiation strategy using Proximal Policy Optimization (PPO).
    """

    def __init__(self):
        self.ppo_policy = self._load_pretrained_policy()
        self.preference_learner = ProcurementPreferenceLearner()

    def select_action(self, state: NegotiationState) -> NegotiationAction:
        """
        Select negotiation action based on current state.

        State includes:
        - Current offers from all suppliers
        - Round number
        - Budget constraints
        - Learned user preferences
        - Market conditions

        Actions:
        - accept_offer(supplier_id)
        - counter_offer(supplier_id, new_price, new_terms)
        - request_concession(supplier_id, dimension)
        - drop_supplier(supplier_id)
        - end_negotiation()
        """
        # Encode state for RL policy
        state_vector = self._encode_state(state)

        # Get action probabilities from PPO policy
        action_probs = self.ppo_policy.predict(state_vector)

        # Sample action
        action = self._sample_action(action_probs)

        # Apply constraints (budget, approval limits, etc.)
        action = self._apply_constraints(action, state)

        return action

    def _encode_state(self, state):
        """
        Encode negotiation state into feature vector.
        """
        features = []

        # Offer features
        for offer in state.current_offers:
            features.extend([
                offer.price / state.budget,  # Normalized price
                offer.lead_time / state.max_acceptable_lead_time,
                offer.quality_score,
                offer.supplier_reliability_score,
                self.preference_learner.predict_offer_score(offer, state.rfq)
            ])

        # Negotiation progress features
        features.extend([
            state.round_number / state.max_rounds,
            state.time_elapsed / state.deadline,
            len(state.active_suppliers) / len(state.initial_suppliers),
            state.best_offer_score,
            state.second_best_offer_score,
            state.price_gap_between_top_two
        ])

        # Market features
        features.extend([
            state.market_shortage_risk,
            state.price_forecast_trend,
            state.supplier_capacity_utilization
        ])

        return np.array(features)

    def _sample_action(self, action_probs):
        """
        Sample action from probability distribution.
        """
        action_space = [
            'accept_best',
            'counter_to_best',
            'counter_to_second_best',
            'request_price_concession',
            'request_lead_time_concession',
            'request_payment_terms_concession',
            'drop_worst_supplier',
            'end_negotiation'
        ]

        action_idx = np.random.choice(len(action_space), p=action_probs)
        return action_space[action_idx]

    def calculate_reward(self, final_outcome, state):
        """
        Calculate reward for RL training.

        Reward components:
        - Price savings vs budget
        - Lead time improvement
        - Quality score
        - Relationship value
        - Negotiation efficiency (fewer rounds = better)
        """
        if final_outcome.status == 'accepted':
            reward = 0.0

            # Price component
            price_savings = (state.budget - final_outcome.price) / state.budget
            reward += price_savings * 0.4

            # Quality component
            reward += final_outcome.quality_score * 0.3

            # Lead time component
            if final_outcome.lead_time <= state.target_lead_time:
                reward += 0.2

            # Efficiency component
            efficiency = 1.0 - (state.round_number / state.max_rounds)
            reward += efficiency * 0.1

            return reward
        else:
            # Negotiation failed
            return -1.0
```

### 4.3. Trade-Off Optimization

```python
class TradeOffOptimizer:
    """
    Multi-objective optimization for negotiation trade-offs.
    """

    def optimize_offer(
        self,
        current_offer,
        constraints,
        preferences
    ):
        """
        Find Pareto-optimal offer considering:
        - Price
        - Lead time
        - Quality
        - Payment terms
        - Minimum order quantity
        """
        # Define objective functions
        objectives = {
            'minimize_price': lambda x: x['price'],
            'minimize_lead_time': lambda x: x['lead_time'],
            'maximize_quality': lambda x: -x['quality_score'],
            'optimize_payment_terms': lambda x: -self._score_payment_terms(x['payment_terms'])
        }

        # Weight objectives based on learned preferences
        weighted_objectives = {
            obj: weight * preferences.get(obj, 0.25)
            for obj, weight in objectives.items()
        }

        # Use NSGA-II for multi-objective optimization
        pareto_front = self._nsga2_optimize(
            objectives=weighted_objectives,
            constraints=constraints,
            current_offer=current_offer
        )

        # Select best offer from Pareto front
        best_offer = self._select_from_pareto(pareto_front, preferences)

        return best_offer
```

---

## 5. Implementation Code

### 5.1. Database Schema

```sql
-- Negotiation sessions
CREATE TABLE negotiation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID REFERENCES rfqs(id),
    user_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'active',  -- active, completed, failed, cancelled
    strategy TEXT,  -- aggressive, balanced, conservative
    max_rounds INT DEFAULT 5,
    current_round INT DEFAULT 1,
    deadline_at TIMESTAMPTZ,
    budget_usd DECIMAL,
    target_lead_time_days INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Negotiation rounds
CREATE TABLE negotiation_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES negotiation_sessions(id),
    round_number INT,
    action_type TEXT,  -- initial_bid, counter_offer, accept, reject, etc.
    actor TEXT,  -- buyer_agent, supplier_agent, human
    actor_id UUID,
    details JSONB,  -- Action-specific details
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers in negotiation
CREATE TABLE negotiation_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES negotiation_sessions(id),
    round_id UUID REFERENCES negotiation_rounds(id),
    supplier_id UUID REFERENCES suppliers(id),
    price DECIMAL NOT NULL,
    lead_time_days INT,
    payment_terms TEXT,
    moq INT,
    quality_score DECIMAL,
    overall_score DECIMAL,
    status TEXT DEFAULT 'active',  -- active, accepted, rejected, withdrawn
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned user preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    feature_weights JSONB,  -- {'price': -0.8, 'quality': 0.5, ...}
    supplier_loyalty_bonuses JSONB,  -- {'supplier_123': 0.15, ...}
    learned_from_rfq_count INT DEFAULT 0,
    confidence_score DECIMAL,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2. Backend API Endpoints

```python
# app/api/routes/negotiation.py

from fastapi import APIRouter, Depends, HTTPException
from app.models import NegotiationSession, NegotiationAction
from app.services.negotiation_engine import NegotiationEngine
from app.auth import get_current_user

router = APIRouter(prefix="/api/negotiation", tags=["negotiation"])

@router.post("/sessions")
async def create_negotiation_session(
    rfq_id: str,
    strategy: str = "balanced",
    max_rounds: int = 5,
    user = Depends(get_current_user)
):
    """
    Start a new negotiation session for an RFQ.
    """
    engine = NegotiationEngine()
    session = await engine.create_session(
        rfq_id=rfq_id,
        user_id=user.id,
        strategy=strategy,
        max_rounds=max_rounds
    )
    return {"session_id": session.id, "status": "created"}

@router.post("/sessions/{session_id}/execute")
async def execute_negotiation_round(
    session_id: str,
    user = Depends(get_current_user)
):
    """
    Execute next negotiation round (buyer agent takes action).
    """
    engine = NegotiationEngine()
    result = await engine.execute_round(session_id)
    return result

@router.get("/sessions/{session_id}")
async def get_negotiation_status(
    session_id: str,
    user = Depends(get_current_user)
):
    """
    Get current status of negotiation session.
    """
    engine = NegotiationEngine()
    status = await engine.get_session_status(session_id)
    return status

@router.post("/sessions/{session_id}/approve")
async def approve_negotiation_outcome(
    session_id: str,
    offer_id: str,
    user = Depends(get_current_user)
):
    """
    Human approves final negotiated offer.
    """
    engine = NegotiationEngine()
    result = await engine.approve_outcome(session_id, offer_id, user.id)
    return result

@router.post("/sessions/{session_id}/cancel")
async def cancel_negotiation(
    session_id: str,
    reason: str,
    user = Depends(get_current_user)
):
    """
    Cancel active negotiation session.
    """
    engine = NegotiationEngine()
    await engine.cancel_session(session_id, reason)
    return {"status": "cancelled"}

@router.get("/preferences/mine")
async def get_my_preferences(
    user = Depends(get_current_user)
):
    """
    Get learned procurement preferences for current user.
    """
    engine = NegotiationEngine()
    prefs = await engine.get_user_preferences(user.id)
    return prefs

@router.post("/preferences/retrain")
async def retrain_preferences(
    user = Depends(get_current_user)
):
    """
    Retrain user preference model from recent RFQs.
    """
    engine = NegotiationEngine()
    result = await engine.retrain_user_preferences(user.id)
    return result
```

---

## 6. Deployment & Monitoring

### 6.1. Model Deployment

- **PPO Policy Model**: TensorFlow Serving
- **Preference Learning Model**: Scikit-learn via Flask API
- **Model Versioning**: MLflow tracking
- **A/B Testing**: 10% of negotiations use experimental model

### 6.2. Monitoring Metrics

- **Negotiation Success Rate**: % of sessions resulting in accepted offer
- **Average Savings**: % below budget for accepted offers
- **Round Efficiency**: Average rounds to completion
- **User Override Rate**: % of agent decisions overridden by human
- **Model Confidence**: Average confidence score of actions

### 6.3. Human-in-the-Loop Checkpoints

**Checkpoint 1**: Before starting negotiation (user reviews strategy)
**Checkpoint 2**: After Round 2 (user can intervene)
**Checkpoint 3**: Before accepting final offer (user approval required if value > $X)

---

*Document continues with additional sections on safety constraints, ethical considerations, and advanced strategies...*


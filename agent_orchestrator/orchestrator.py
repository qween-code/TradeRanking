"""
Agent Orchestrator - Manages the 6-step AI agent pipeline.

Pipeline:
1. RFQ Intake Agent       → Validates/enriches RFQ data
2. Supplier Discovery     → Finds matching suppliers
3. Email Send Agent       → Sends RFQ to suppliers
4. Inbox Parser Agent     → Parses supplier responses
5. Supplier Verifier      → Verifies supplier credentials
6. Aggregation Report     → Generates comparison report
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any, Optional
from loguru import logger

from agent_orchestrator.agents import (
    RFQIntakeAgent,
    SupplierDiscoveryAgent,
    EmailSendAgent,
    InboxParserAgent,
    SupplierVerifierAgent,
    AggregationReportAgent,
)


class AgentOrchestrator:
    """
    Orchestrates the 6-agent pipeline for automated procurement.
    """

    PIPELINE = [
        ("rfq_intake", RFQIntakeAgent),
        ("supplier_discovery", SupplierDiscoveryAgent),
        ("email_send", EmailSendAgent),
        ("inbox_parser", InboxParserAgent),
        ("supplier_verifier", SupplierVerifierAgent),
        ("aggregation_report", AggregationReportAgent),
    ]

    def __init__(self, redis_manager=None):
        self.redis_manager = redis_manager
        self.agents = {name: cls() for name, cls in self.PIPELINE}

    async def process_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a complete job through all 6 agents.
        """
        job_id = job_data["job_id"]
        logger.info(f"Starting pipeline for job {job_id}")

        context = {
            "job_id": job_id,
            "rfq_data": job_data.get("rfq_data", {}),
            "user_id": job_data.get("user_id"),
            "started_at": datetime.utcnow().isoformat(),
            "agent_results": {},
        }

        for i, (agent_name, _) in enumerate(self.PIPELINE):
            agent = self.agents[agent_name]
            progress = int(((i) / len(self.PIPELINE)) * 100)

            logger.info(f"[{job_id}] Running agent: {agent_name} ({progress}%)")

            # Update status
            if self.redis_manager:
                await self.redis_manager.set_job_status(
                    job_id, "in_progress",
                    current_agent=agent_name,
                    progress_percent=progress,
                )

            try:
                result = await agent.execute(context)
                context["agent_results"][agent_name] = result
                logger.info(f"[{job_id}] Agent {agent_name} completed successfully")
            except Exception as e:
                logger.error(f"[{job_id}] Agent {agent_name} failed: {e}")
                if self.redis_manager:
                    await self.redis_manager.set_job_status(
                        job_id, "failed",
                        current_agent=agent_name,
                        error=str(e),
                    )
                return {"status": "failed", "error": str(e), "failed_agent": agent_name}

        # All agents completed
        context["completed_at"] = datetime.utcnow().isoformat()

        if self.redis_manager:
            await self.redis_manager.set_job_status(
                job_id, "completed",
                progress_percent=100,
                result=json.dumps(context["agent_results"].get("aggregation_report", {})),
            )

        logger.info(f"[{job_id}] Pipeline completed successfully")
        return {"status": "completed", "result": context["agent_results"]}

    async def run_single_agent(self, agent_name: str, context: Dict) -> Dict:
        """Run a single agent outside the pipeline."""
        if agent_name not in self.agents:
            raise ValueError(f"Unknown agent: {agent_name}")
        return await self.agents[agent_name].execute(context)

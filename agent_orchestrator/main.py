"""
Agent Orchestrator - Main entry point.
Listens to Redis queue and processes jobs through the agent pipeline.
"""

import asyncio
import sys
from loguru import logger

logger.remove()
logger.add(sys.stdout, level="INFO", format="{time:HH:mm:ss} | {level:<7} | {message}")
logger.add("logs/orchestrator.log", rotation="10 MB", retention="7 days", level="DEBUG")


async def main():
    """Main loop: dequeue jobs from Redis and process them."""
    from app.config import settings
    from app.redis_client import init_redis, get_redis, RedisJobManager
    from agent_orchestrator.orchestrator import AgentOrchestrator

    logger.info("Agent Orchestrator starting...")
    await init_redis()

    redis = get_redis()
    manager = RedisJobManager(redis)
    orchestrator = AgentOrchestrator(redis_manager=manager)

    logger.info("Listening for jobs on queue: agentik:jobs")

    while True:
        try:
            job_data = await manager.dequeue_job(timeout=5)

            if job_data is None:
                continue

            job_id = job_data.get("job_id", "unknown")
            logger.info(f"Received job: {job_id}")

            result = await orchestrator.process_job(job_data)

            if result["status"] == "completed":
                logger.info(f"Job {job_id} completed successfully")
            else:
                logger.error(f"Job {job_id} failed: {result.get('error')}")

        except KeyboardInterrupt:
            logger.info("Shutting down orchestrator...")
            break
        except Exception as e:
            logger.error(f"Orchestrator error: {e}")
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())

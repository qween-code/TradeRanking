"""
Redis client for job queuing, caching, and real-time data.
"""

import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from loguru import logger
from app.config import settings

redis_instance = None


async def init_redis():
    global redis_instance
    try:
        import redis.asyncio as aioredis
        redis_instance = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        await redis_instance.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e} - using mock mode")
        redis_instance = MockRedis()


async def close_redis():
    global redis_instance
    if redis_instance and not isinstance(redis_instance, MockRedis):
        await redis_instance.close()
        logger.info("Redis connection closed")


def get_redis():
    return redis_instance


class RedisJobManager:
    """Manages job queues and status tracking via Redis."""

    MAIN_QUEUE = "agentik:jobs"
    STATUS_PREFIX = "agentik:status:"
    AGENT_PREFIX = "agentik:agent:"
    USER_JOBS_PREFIX = "user:"

    def __init__(self, redis_conn=None):
        self.redis = redis_conn or redis_instance

    async def enqueue_job(self, job_id: str, job_data: Dict[str, Any]) -> str:
        payload = json.dumps({**job_data, "job_id": job_id, "enqueued_at": datetime.utcnow().isoformat()})
        await self.redis.lpush(self.MAIN_QUEUE, payload)
        await self.set_job_status(job_id, "queued")
        if "user_id" in job_data:
            await self.redis.lpush(f"{self.USER_JOBS_PREFIX}{job_data['user_id']}:jobs", job_id)
        logger.info(f"Job {job_id} enqueued")
        return job_id

    async def dequeue_job(self, timeout: int = 0) -> Optional[Dict]:
        result = await self.redis.brpop(self.MAIN_QUEUE, timeout=timeout)
        if result:
            _, payload = result
            return json.loads(payload)
        return None

    async def enqueue_agent(self, agent_name: str, job_data: Dict[str, Any]):
        payload = json.dumps(job_data)
        await self.redis.lpush(f"{self.AGENT_PREFIX}{agent_name}", payload)
        logger.debug(f"Enqueued to agent:{agent_name}")

    async def dequeue_agent(self, agent_name: str, timeout: int = 0) -> Optional[Dict]:
        result = await self.redis.brpop(f"{self.AGENT_PREFIX}{agent_name}", timeout=timeout)
        if result:
            _, payload = result
            return json.loads(payload)
        return None

    async def set_job_status(self, job_id: str, status: str, **extra):
        key = f"{self.STATUS_PREFIX}{job_id}"
        data = {"status": status, "updated_at": datetime.utcnow().isoformat(), **extra}
        await self.redis.hset(key, mapping={k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) for k, v in data.items()})

    async def get_job_status(self, job_id: str) -> Optional[Dict]:
        key = f"{self.STATUS_PREFIX}{job_id}"
        data = await self.redis.hgetall(key)
        if not data:
            return None
        for k, v in data.items():
            try:
                data[k] = json.loads(v)
            except (json.JSONDecodeError, TypeError):
                pass
        return data

    async def get_user_recent_jobs(self, user_id: str, limit: int = 20) -> List[str]:
        return await self.redis.lrange(f"{self.USER_JOBS_PREFIX}{user_id}:jobs", 0, limit - 1)

    async def get_queue_size(self, queue_name: str = None) -> int:
        return await self.redis.llen(queue_name or self.MAIN_QUEUE)


class MockRedis:
    """In-memory mock for development without Redis."""

    def __init__(self):
        self._data = {}
        self._lists = {}
        logger.info("Mock Redis initialized (in-memory)")

    async def ping(self):
        return True

    async def close(self):
        pass

    async def get(self, key):
        return self._data.get(key)

    async def set(self, key, value, ex=None):
        self._data[key] = value

    async def delete(self, key):
        self._data.pop(key, None)

    async def hset(self, key, mapping=None, **kwargs):
        if key not in self._data:
            self._data[key] = {}
        if mapping:
            self._data[key].update(mapping)
        self._data[key].update(kwargs)

    async def hgetall(self, key):
        return self._data.get(key, {})

    async def lpush(self, key, *values):
        if key not in self._lists:
            self._lists[key] = []
        for v in values:
            self._lists[key].insert(0, v)

    async def brpop(self, key, timeout=0):
        lst = self._lists.get(key, [])
        if lst:
            return (key, lst.pop())
        return None

    async def lrange(self, key, start, stop):
        lst = self._lists.get(key, [])
        return lst[start:stop + 1]

    async def llen(self, key):
        return len(self._lists.get(key, []))

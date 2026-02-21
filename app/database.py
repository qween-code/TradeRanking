"""
Supabase database client wrapper.
Provides async-friendly access to PostgreSQL via Supabase.
"""

from supabase import create_client, Client
from loguru import logger
from app.config import settings

supabase_client: Client = None


def init_supabase() -> Client:
    global supabase_client
    if settings.supabase_url and settings.supabase_anon_key:
        supabase_client = create_client(settings.supabase_url, settings.supabase_anon_key)
        logger.info("Supabase client initialized")
    else:
        logger.warning("Supabase credentials not configured - using mock mode")
        supabase_client = MockSupabaseClient()
    return supabase_client


def get_db() -> Client:
    if supabase_client is None:
        return init_supabase()
    return supabase_client


class MockSupabaseClient:
    """
    Mock Supabase client for development without real Supabase.
    Stores data in memory.
    """

    def __init__(self):
        self._store = {}
        logger.info("Mock Supabase client initialized (in-memory)")

    def table(self, name: str):
        if name not in self._store:
            self._store[name] = []
        return MockTable(self._store, name)


class MockTable:
    def __init__(self, store: dict, name: str):
        self._store = store
        self._name = name
        self._filters = {}
        self._data = None
        self._select_cols = "*"

    def select(self, columns: str = "*"):
        self._select_cols = columns
        return self

    def insert(self, data: dict):
        from uuid import uuid4
        from datetime import datetime
        if "id" not in data:
            data["id"] = str(uuid4())
        if "created_at" not in data:
            data["created_at"] = datetime.utcnow().isoformat()
        if "updated_at" not in data:
            data["updated_at"] = datetime.utcnow().isoformat()
        self._store[self._name].append(data)
        return MockResult([data])

    def upsert(self, data: dict):
        from uuid import uuid4
        from datetime import datetime
        existing = None
        for i, item in enumerate(self._store[self._name]):
            if item.get("id") == data.get("id") or item.get("user_id") == data.get("user_id"):
                existing = i
                break
        if existing is not None:
            self._store[self._name][existing].update(data)
            return MockResult([self._store[self._name][existing]])
        return self.insert(data)

    def update(self, data: dict):
        self._data = data
        return self

    def delete(self):
        self._data = "__delete__"
        return self

    def eq(self, column: str, value):
        self._filters[column] = value
        if self._data == "__delete__":
            self._store[self._name] = [
                item for item in self._store[self._name]
                if item.get(column) != value
            ]
            return MockResult([])
        if self._data is not None and self._data != "__delete__":
            for item in self._store[self._name]:
                if item.get(column) == value:
                    item.update(self._data)
                    item["updated_at"] = __import__("datetime").datetime.utcnow().isoformat()
                    return MockResult([item])
            return MockResult([])

        results = [
            item for item in self._store[self._name]
            if item.get(column) == value
        ]
        return MockResult(results)

    def neq(self, column: str, value):
        results = [
            item for item in self._store[self._name]
            if item.get(column) != value
        ]
        return MockResult(results)

    def order(self, column: str, desc: bool = False):
        return self

    def limit(self, count: int):
        return self

    def range(self, start: int, end: int):
        return self

    def execute(self):
        if self._filters:
            results = self._store[self._name]
            for col, val in self._filters.items():
                results = [item for item in results if item.get(col) == val]
            return MockResult(results)
        return MockResult(self._store[self._name])


class MockResult:
    def __init__(self, data: list):
        self.data = data
        self.count = len(data)

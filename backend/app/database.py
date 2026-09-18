"""MongoDB Atlas connection via Motor (async driver)."""
from __future__ import annotations
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
    return _client


def get_db():
    settings = get_settings()
    return get_client()[settings.MONGODB_DB_NAME]


async def ensure_indexes():
    """Call once at startup. Safe to call repeatedly (idempotent)."""
    db = get_db()
    try:
        await db.analyses.create_index("user_id")
        await db.analyses.create_index("created_at")
        await db.analyses.create_index("language")
        await db.push_subscriptions.create_index("user_id")
        await db.users.create_index("uid", unique=True)
        logger.info("MongoDB indexes ensured")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not create indexes (DB may be unreachable in dev mode): %s", exc)


async def close_client():
    global _client
    if _client:
        _client.close()
        _client = None

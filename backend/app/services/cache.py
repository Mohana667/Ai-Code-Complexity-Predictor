"""
Redis cache for analysis results. Identical code+language pairs are
hashed and cached so re-analyzing (or two users pasting the same
snippet) skips both the parsing pass and the Gemini call.

Degrades gracefully to a no-op cache if Redis is unreachable, so local
dev without Redis running doesn't break the app.
"""
from __future__ import annotations
import hashlib
import json
import logging
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

_redis = None
_redis_unavailable = False


def _get_redis():
    global _redis, _redis_unavailable
    if _redis_unavailable:
        return None
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            settings = get_settings()
            _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis unavailable, running without cache: %s", exc)
            _redis_unavailable = True
            return None
    return _redis


def cache_key(code: str, language: str) -> str:
    digest = hashlib.sha256(f"{language}:{code}".encode()).hexdigest()
    return f"analysis:{digest}"


async def get_cached(code: str, language: str) -> Optional[dict]:
    client = _get_redis()
    if client is None:
        return None
    try:
        raw = await client.get(cache_key(code, language))
        return json.loads(raw) if raw else None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cache read failed: %s", exc)
        return None


async def set_cached(code: str, language: str, payload: dict) -> None:
    client = _get_redis()
    if client is None:
        return
    settings = get_settings()
    try:
        await client.set(cache_key(code, language), json.dumps(payload, default=str),
                          ex=settings.CACHE_TTL_SECONDS)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cache write failed: %s", exc)

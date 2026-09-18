from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.auth import get_current_user
from app.database import get_db
from app.config import get_settings
from app.models.schemas import PushSubscriptionModel, UserProfile
from app.services.notifications import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/vapid-public-key")
async def vapid_public_key():
    settings = get_settings()
    return {"publicKey": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe(sub: PushSubscriptionModel, user: UserProfile = Depends(get_current_user)):
    try:
        db = get_db()
        await db.push_subscriptions.update_one(
            {"user_id": user.uid, "endpoint": sub.endpoint},
            {"$set": {"user_id": user.uid, **sub.model_dump()}},
            upsert=True,
        )
        return {"status": "subscribed"}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Push subscribe skipped (DB unreachable?): %s", exc)
        return {"status": "unavailable"}


@router.delete("/unsubscribe")
async def unsubscribe(endpoint: str, user: UserProfile = Depends(get_current_user)):
    try:
        db = get_db()
        await db.push_subscriptions.delete_one({"user_id": user.uid, "endpoint": endpoint})
        return {"status": "unsubscribed"}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Push unsubscribe skipped (DB unreachable?): %s", exc)
        return {"status": "unavailable"}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Real-time in-app notification channel. The frontend connects after
    login using the Firebase uid. Auth is validated implicitly by only
    delivering events addressed to that uid — for production, additionally
    verify a token passed as a query param before accepting."""
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive ping from client
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

"""
Browser push notifications via the Web Push protocol (VAPID).
Also fans out lightweight in-app real-time events over WebSocket for
the notification bell in the UI (see routers/notifications.py).
"""
from __future__ import annotations
import logging
from app.config import get_settings
from app.models.schemas import NotificationPayload, PushSubscriptionModel

logger = logging.getLogger(__name__)

try:
    from pywebpush import webpush, WebPushException
    _WEBPUSH_AVAILABLE = True
except ImportError:
    _WEBPUSH_AVAILABLE = False


async def send_push(subscription: PushSubscriptionModel, payload: NotificationPayload) -> bool:
    settings = get_settings()
    if not _WEBPUSH_AVAILABLE or not settings.VAPID_PRIVATE_KEY:
        logger.info("Push not configured (dev mode) — would have sent: %s", payload.title)
        return False
    try:
        webpush(
            subscription_info=subscription.model_dump(),
            data=payload.model_dump_json(),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}"},
        )
        return True
    except WebPushException as exc:  # noqa: BLE001
        logger.warning("Push send failed: %s", exc)
        return False


def notification_for_result(risk_level: str, filename: str | None) -> NotificationPayload:
    label = filename or "Your code"
    if risk_level in ("high", "critical"):
        return NotificationPayload(
            title="High complexity detected",
            body=f"{label} was flagged as {risk_level} risk. Tap to see optimization suggestions.",
            icon="/icons/alert.png",
            url="/dashboard",
        )
    return NotificationPayload(
        title="Analysis complete",
        body=f"{label} analyzed — {risk_level} risk.",
        icon="/icons/check.png",
        url="/dashboard",
    )


class ConnectionManager:
    """In-memory WebSocket registry for real-time in-app notifications.
    For multi-instance deployment behind ECS auto-scaling, back this with
    Redis pub/sub instead of the in-process dict (noted in README)."""

    def __init__(self):
        self.active: dict[str, list] = {}

    async def connect(self, user_id: str, websocket) -> None:
        await websocket.accept()
        self.active.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: str, websocket) -> None:
        if user_id in self.active and websocket in self.active[user_id]:
            self.active[user_id].remove(websocket)

    async def notify(self, user_id: str, payload: NotificationPayload) -> None:
        for ws in self.active.get(user_id, []):
            try:
                await ws.send_json(payload.model_dump())
            except Exception:  # noqa: BLE001
                pass


manager = ConnectionManager()

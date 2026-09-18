"""
Firebase Authentication integration.

Frontend signs the user in with the Firebase JS SDK and sends the resulting
ID token as `Authorization: Bearer <token>` on every request. This module
verifies that token server-side using the Firebase Admin SDK.

In development without FIREBASE_CREDENTIALS_JSON configured, verification
is skipped and a placeholder user is returned so the rest of the app is
still testable end-to-end — this MUST be disabled (raise instead) before
any real deployment. See README "Security" section.
"""
from __future__ import annotations
import json
import logging
from fastapi import Header, HTTPException, status
from app.config import get_settings
from app.models.schemas import UserProfile

logger = logging.getLogger(__name__)

_firebase_app = None


def _init_firebase():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    settings = get_settings()
    if not settings.FIREBASE_CREDENTIALS_JSON:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials

        raw = settings.FIREBASE_CREDENTIALS_JSON
        cred_data = json.loads(raw) if raw.strip().startswith("{") else raw  # inline JSON or file path
        cred = credentials.Certificate(cred_data)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as exc:  # noqa: BLE001
        logger.error("Firebase init failed: %s", exc)
        return None


async def get_current_user(authorization: str | None = Header(default=None)) -> UserProfile:
    settings = get_settings()
    app = _init_firebase()
    if not authorization or not authorization.startswith("Bearer "):
        if app is None and settings.ENV == "development":
            logger.warning("No Authorization header and Firebase not configured — "
                            "using DEV placeholder identity.")
            return UserProfile(uid="dev-user", email="dev@example.com", display_name="Dev User")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()

    if app is None:
        if settings.ENV == "development":
            logger.warning("Firebase not configured — using DEV placeholder identity. "
                            "Set FIREBASE_CREDENTIALS_JSON before deploying.")
            return UserProfile(uid="dev-user", email="dev@example.com", display_name="Dev User")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                             detail="Auth not configured")

    try:
        from firebase_admin import auth as firebase_auth
        decoded = firebase_auth.verify_id_token(token)
        return UserProfile(
            uid=decoded["uid"],
            email=decoded.get("email"),
            display_name=decoded.get("name"),
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                             detail="Invalid or expired token") from exc

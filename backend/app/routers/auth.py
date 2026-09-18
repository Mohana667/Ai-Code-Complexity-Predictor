from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.database import get_db
from app.config import get_settings
from app.models.schemas import UserProfile


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

ADMIN_EMAIL = "admin@gmail.com"

@router.post("/sync", response_model=UserProfile)
async def sync_profile(
    user: UserProfile = Depends(get_current_user),
):
    """
    Sync the authenticated Firebase user into MongoDB.

    Normal users:
        is_admin = False

    Admin:
        email = admin@gmail.com
        is_admin = True
    """

    settings = get_settings()

    email = (
        user.email.lower().strip()
        if user.email
        else ""
    )

    configured_admin_emails = {
        email.lower().strip()
        for email in settings.admin_emails
    }

    is_admin = (
        email == ADMIN_EMAIL
        or email in configured_admin_emails
    )

    user.is_admin = is_admin

    try:

        db = get_db()

        await db.users.update_one(
            {
                "uid": user.uid,
            },
            {
                "$set": user.model_dump(
                    exclude={
                        "created_at",
                    }
                ),
                "$setOnInsert": {
                    "created_at": user.created_at,
                },
            },
            upsert=True,
        )

        logger.info(
            "Profile synced: %s | admin=%s",
            user.email,
            is_admin,
        )

    except Exception as exc:
        logger.exception(
            "Profile sync failed for %s: %s",
            user.email,
            exc,
        )

    return user

@router.get(
    "/me",
    response_model=UserProfile,
)
async def me(
    user: UserProfile = Depends(get_current_user),
):

    email = (
        user.email.lower().strip()
        if user.email
        else ""
    )

    settings = get_settings()

    configured_admin_emails = {
        email.lower().strip()
        for email in settings.admin_emails
    }

    user.is_admin = (
        email == ADMIN_EMAIL
        or email in configured_admin_emails
    )

    return user
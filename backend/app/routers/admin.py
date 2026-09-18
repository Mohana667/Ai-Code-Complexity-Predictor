from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models.schemas import (
    AdminActivityEvent,
    AdminOverview,
    AdminUserSummary,
    AnalysisResponse,
    UserProfile,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


# =========================================================
# Admin Authentication
# =========================================================

async def get_admin_user(
    user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """
    Allow access only to users marked as admin in MongoDB
    or whose email is configured in ADMIN_EMAILS.
    """

    settings = get_settings()
    db = get_db()
    user_doc = await db.users.find_one(
        {"uid": user.uid},
        {"is_admin": 1},
    )

    db_is_admin = bool(
        user_doc and user_doc.get("is_admin", False)
    )

    email_is_admin = (
        bool(user.email)
        and user.email.lower() in settings.admin_emails
    )
    if not (db_is_admin or email_is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    user.is_admin = True

    return user

@router.get(
    "/overview",
    response_model=AdminOverview,
)
async def get_admin_overview(
    admin: UserProfile = Depends(get_admin_user),
):
    """
    Return overall application statistics for the admin dashboard.
    """

    try:
        db = get_db()

        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)

        total_users = await db.users.count_documents({})

        total_analyses = await db.analyses.count_documents({})

        active_users_pipeline = [
            {
                "$match": {
                    "created_at": {
                        "$gte": last_24h,
                    }
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                }
            },
            {
                "$count": "total",
            },
        ]

        active_result = await db.analyses.aggregate(
            active_users_pipeline
        ).to_list(length=1)

        active_users_24h = (
            active_result[0]["total"]
            if active_result
            else 0
        )

        risk_distribution = {
            "low": 0,
            "moderate": 0,
            "high": 0,
            "critical": 0,
        }

        risk_cursor = db.analyses.aggregate(
            [
                {
                    "$group": {
                        "_id": "$estimate.risk_level",
                        "count": {
                            "$sum": 1
                        },
                    }
                }
            ]
        )

        async for item in risk_cursor:
            level = item.get("_id")

            if level:
                risk_distribution[level] = item.get(
                    "count",
                    0,
                )

        language_distribution = {}

        language_cursor = db.analyses.aggregate(
            [
                {
                    "$group": {
                        "_id": "$language",
                        "count": {
                            "$sum": 1
                        },
                    }
                }
            ]
        )

        async for item in language_cursor:
            language = item.get("_id")

            if language:
                language_distribution[language] = item.get(
                    "count",
                    0,
                )

        risk_result = await db.analyses.aggregate(
            [
                {
                    "$group": {
                        "_id": None,
                        "average": {
                            "$avg": "$estimate.risk_score"
                        },
                    }
                }
            ]
        ).to_list(length=1)

        avg_risk_score = (
            float(risk_result[0]["average"])
            if risk_result
            and risk_result[0].get("average") is not None
            else 0.0
        )

        signups_last_7_days = {}

        signup_cursor = db.users.aggregate(
            [
                {
                    "$match": {
                        "created_at": {
                            "$gte": last_7d,
                        }
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$created_at",
                            }
                        },
                        "count": {
                            "$sum": 1,
                        },
                    }
                },
                {
                    "$sort": {
                        "_id": 1,
                    }
                },
            ]
        )

        async for item in signup_cursor:
            day = item.get("_id")

            if day:
                signups_last_7_days[day] = item.get(
                    "count",
                    0,
                )

        recent_cursor = (
            db.analyses
            .find({})
            .sort("created_at", -1)
            .limit(10)
        )

        recent_activity = []

        async for doc in recent_cursor:

            user_email = None

            if doc.get("user_id"):
                user_doc = await db.users.find_one(
                    {
                        "uid": doc["user_id"]
                    },
                    {
                        "email": 1
                    },
                )

                if user_doc:
                    user_email = user_doc.get("email")

            estimate = doc.get("estimate", {})

            recent_activity.append(
                AdminActivityEvent(
                    type="analysis",
                    user_email=user_email,
                    user_id=doc.get(
                        "user_id",
                        "",
                    ),
                    language=doc.get(
                        "language",
                        "python",
                    ),
                    filename=doc.get("filename"),
                    time_complexity=estimate.get(
                        "time_complexity",
                        "Unknown",
                    ),
                    risk_level=estimate.get(
                        "risk_level",
                        "low",
                    ),
                    risk_score=estimate.get(
                        "risk_score",
                        0,
                    ),
                    created_at=doc.get(
                        "created_at",
                        now,
                    ),
                )
            )

        return AdminOverview(
            total_users=total_users,
            total_analyses=total_analyses,
            active_users_24h=active_users_24h,
            avg_risk_score=round(
                avg_risk_score,
                2,
            ),
            risk_distribution=risk_distribution,
            language_distribution=language_distribution,
            signups_last_7_days=signups_last_7_days,
            recent_activity=recent_activity,
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Admin overview failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin dashboard data unavailable",
        ) from exc

@router.get(
    "/users",
    response_model=list[AdminUserSummary],
)
async def get_admin_users(
    admin: UserProfile = Depends(get_admin_user),
):
    """
    Return all registered users with their analysis statistics.
    """

    try:
        db = get_db()

        users_cursor = db.users.find({}).sort(
            "created_at",
            -1,
        )

        users = []

        async for user_doc in users_cursor:

            uid = user_doc.get("uid", "")

            analysis_stats = await db.analyses.aggregate(
                [
                    {
                        "$match": {
                            "user_id": uid,
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "count": {
                                "$sum": 1,
                            },
                            "average_risk": {
                                "$avg": "$estimate.risk_score",
                            },
                            "last_active": {
                                "$max": "$created_at",
                            },
                        }
                    }
                ]
            ).to_list(length=1)

            stats = (
                analysis_stats[0]
                if analysis_stats
                else {}
            )

            users.append(
                AdminUserSummary(
                    uid=uid,
                    email=user_doc.get("email"),
                    display_name=user_doc.get(
                        "display_name"
                    ),
                    is_admin=user_doc.get(
                        "is_admin",
                        False,
                    ),
                    created_at=user_doc.get(
                        "created_at",
                        datetime.utcnow(),
                    ),
                    analysis_count=stats.get(
                        "count",
                        0,
                    ),
                    avg_risk_score=round(
                        float(
                            stats.get(
                                "average_risk",
                                0.0,
                            )
                        ),
                        2,
                    ),
                    last_active=stats.get(
                        "last_active"
                    ),
                )
            )

        return users

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Admin users lookup failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User data unavailable",
        ) from exc

@router.get(
    "/analyses",
    response_model=list[AnalysisResponse],
)
async def get_admin_analyses(
    limit: int = 50,
    admin: UserProfile = Depends(get_admin_user),
):
    """
    Return recent analysis records across all users.
    """

    limit = max(
        1,
        min(limit, 200),
    )

    try:
        db = get_db()

        cursor = (
            db.analyses
            .find({})
            .sort("created_at", -1)
            .limit(limit)
        )

        results = []

        async for doc in cursor:

            doc["id"] = str(
                doc.pop("_id", "")
            )

            results.append(
                AnalysisResponse(**doc)
            )

        return results

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Admin analyses lookup failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analysis data unavailable",
        ) from exc
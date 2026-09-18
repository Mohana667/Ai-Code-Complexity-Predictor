from __future__ import annotations
import logging
from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.database import get_db
from app.models.schemas import DashboardStats, AnalysisResponse, UserProfile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(user: UserProfile = Depends(get_current_user)):
    empty = DashboardStats(
        total_analyses=0, avg_risk_score=0.0,
        risk_distribution={"low": 0, "moderate": 0, "high": 0, "critical": 0},
        language_distribution={}, recent_analyses=[],
    )
    try:
        db = get_db()
        query = {"user_id": user.uid}

        total = await db.analyses.count_documents(query)

        risk_distribution = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
        language_distribution: dict[str, int] = {}
        risk_sum = 0

        cursor = db.analyses.find(query)
        async for doc in cursor:
            est = doc.get("estimate", {})
            risk_level = est.get("risk_level", "low")
            risk_distribution[risk_level] = risk_distribution.get(risk_level, 0) + 1
            risk_sum += est.get("risk_score", 0)
            lang = doc.get("language", "unknown")
            language_distribution[lang] = language_distribution.get(lang, 0) + 1

        recent_cursor = db.analyses.find(query).sort("created_at", -1).limit(5)
        recent = []
        async for doc in recent_cursor:
            doc["id"] = str(doc.pop("_id", ""))
            recent.append(AnalysisResponse(**doc))

        return DashboardStats(
            total_analyses=total,
            avg_risk_score=(risk_sum / total) if total else 0.0,
            risk_distribution=risk_distribution,
            language_distribution=language_distribution,
            recent_analyses=recent,
        )
    except Exception as exc:  # noqa: BLE001 - Mongo unreachable in local dev shouldn't 500 the dashboard
        logger.warning("Dashboard stats unavailable (DB unreachable?): %s", exc)
        return empty

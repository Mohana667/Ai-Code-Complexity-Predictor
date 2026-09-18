from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.auth import get_current_user
from app.database import get_db

from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    UserProfile,
    NotificationPayload,
)

from app.services import (
    complexity_analyzer,
    complexity_estimator,
    local_ai_service,
    cache,
)

from app.services.notifications import (
    manager,
    notification_for_result,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/analysis",
    tags=["analysis"],
)


# =========================================================
# Analyze Code
# =========================================================

@router.post(
    "",
    response_model=AnalysisResponse,
)
async def analyze_code(
    request: AnalysisRequest,
    user: UserProfile = Depends(get_current_user),
):
    settings = get_settings()

    # ---------------------------------------------------------
    # 1. Validate code size
    # ---------------------------------------------------------

    if len(request.code.encode()) > settings.MAX_CODE_SIZE_BYTES:

        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Code exceeds "
                f"{settings.MAX_CODE_SIZE_BYTES} byte limit"
            ),
        )

    # ---------------------------------------------------------
    # 2. Check whether Local AI enhancement is requested
    # ---------------------------------------------------------

    use_ai = (
        request.use_ai_enhancement
        and local_ai_service.is_configured()
    )

    # ---------------------------------------------------------
    # 3. Use cache only when AI enhancement is disabled
    # ---------------------------------------------------------

    if not use_ai:

        cached = await cache.get_cached(
            request.code,
            request.language.value,
        )

        if cached:

            cached["user_id"] = user.uid

            return AnalysisResponse(
                **cached
            )

    # ---------------------------------------------------------
    # 4. Static code analysis
    # ---------------------------------------------------------

    try:

        metrics = complexity_analyzer.analyze(
            request.code,
            request.language,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # ---------------------------------------------------------
    # 5. Initial heuristic complexity estimation
    # ---------------------------------------------------------

    estimate = complexity_estimator.estimate(
        metrics
    )

    # ---------------------------------------------------------
    # 6. Local AI enhancement using Ollama
    # ---------------------------------------------------------

    ai_enhanced = False

    if request.use_ai_enhancement:

        if local_ai_service.is_configured():

            logger.info(
                "Local AI refinement requested for %s code.",
                request.language.value,
            )

            estimate, ai_enhanced = (
                await local_ai_service.enhance(
                    request.code,
                    request.language.value,
                    metrics,
                    estimate,
                )
            )

            if ai_enhanced:

                logger.info(
                    "Local DeepSeek refinement completed successfully."
                )

            else:

                logger.warning(
                    "Local DeepSeek refinement failed. "
                    "Using heuristic analysis."
                )

        else:

            logger.warning(
                "AI enhancement requested but "
                "local AI service is not configured."
            )

    # ---------------------------------------------------------
    # 7. Build final analysis response
    # ---------------------------------------------------------

    result = AnalysisResponse(
        language=request.language,
        filename=request.filename,
        metrics=metrics,
        estimate=estimate,
        ai_enhanced=ai_enhanced,
        user_id=user.uid,
    )

    # ---------------------------------------------------------
    # 8. Save analysis to MongoDB
    # ---------------------------------------------------------

    db = get_db()

    try:

        inserted = await db.analyses.insert_one(
            result.model_dump(
                exclude={"id"}
            )
        )

        result.id = str(
            inserted.inserted_id
        )

    except Exception as exc:

        logger.warning(
            "Could not save analysis to MongoDB: %s",
            exc,
        )

    # ---------------------------------------------------------
    # 9. Update cache only when AI was not used
    # ---------------------------------------------------------

    if not ai_enhanced:

        try:

            await cache.set_cached(
                request.code,
                request.language.value,
                result.model_dump(),
            )

        except Exception as exc:

            logger.warning(
                "Could not update analysis cache: %s",
                exc,
            )

    # ---------------------------------------------------------
    # 10. Send result notification
    # ---------------------------------------------------------

    payload: NotificationPayload = (
        notification_for_result(
            estimate.risk_level.value,
            request.filename,
        )
    )

    await manager.notify(
        user.uid,
        payload,
    )

    # ---------------------------------------------------------
    # 11. Return final result
    # ---------------------------------------------------------

    return result


# =========================================================
# Analysis History
# =========================================================

@router.get(
    "/history",
    response_model=list[AnalysisResponse],
)
async def get_history(
    limit: int = 20,
    user: UserProfile = Depends(get_current_user),
):

    try:

        db = get_db()

        cursor = (
            db.analyses
            .find({
                "user_id": user.uid
            })
            .sort(
                "created_at",
                -1,
            )
            .limit(limit)
        )

        results = []

        async for doc in cursor:

            doc["id"] = str(
                doc.pop("_id", "")
            )

            results.append(
                AnalysisResponse(
                    **doc
                )
            )

        return results

    except Exception as exc:

        logger.warning(
            "History unavailable "
            "(DB unreachable?): %s",
            exc,
        )

        return []


# =========================================================
# Get Single Analysis
# =========================================================

@router.get(
    "/{analysis_id}",
    response_model=AnalysisResponse,
)
async def get_analysis(
    analysis_id: str,
    user: UserProfile = Depends(get_current_user),
):

    from bson import ObjectId

    try:

        db = get_db()

        doc = await db.analyses.find_one(
            {
                "_id": ObjectId(analysis_id),
                "user_id": user.uid,
            }
        )

    except Exception as exc:

        logger.warning(
            "Analysis lookup unavailable "
            "(DB unreachable?): %s",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database unavailable — "
                "is MongoDB running?"
            ),
        ) from exc

    if not doc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    doc["id"] = str(
        doc.pop("_id")
    )

    return AnalysisResponse(
        **doc
    )
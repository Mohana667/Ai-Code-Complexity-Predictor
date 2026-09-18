from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import ensure_indexes, close_client

from app.routers import (
    analysis,
    dashboard,
    notifications,
    auth as auth_router,
    admin,
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    logger.info("Code Complexity Predictor API started")

    yield

    await close_client()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description=(
            "Analyzes source code and predicts "
            "time/space complexity before execution."
        ),
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(
        auth_router.router,
        prefix=settings.API_V1_PREFIX,
    )

    # Code analysis
    app.include_router(
        analysis.router,
        prefix=settings.API_V1_PREFIX,
    )

    # User dashboard
    app.include_router(
        dashboard.router,
        prefix=settings.API_V1_PREFIX,
    )

    # Real-time notifications
    app.include_router(
        notifications.router,
        prefix=settings.API_V1_PREFIX,
    )

    # Admin dashboard
    app.include_router(
        admin.router,
        prefix=settings.API_V1_PREFIX,
    )
    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "service": settings.APP_NAME,
        }

    return app


app = create_app()
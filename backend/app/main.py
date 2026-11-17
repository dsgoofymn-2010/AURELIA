import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import text

from app.api.routes import health, inquiries
from app.config import get_settings
from app.db import get_engine, init_db, shutdown_db

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    init_db(settings.database_url)

    # --- Startup checks ---
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            logger.info("Database connectivity check passed")

            # Check alembic_version table
            try:
                result = await conn.execute(
                    text("SELECT version_num FROM alembic_version ORDER BY version_num DESC LIMIT 1")
                )
                row = result.first()
                if row:
                    logger.info("Current alembic revision: %s", row[0])
                else:
                    logger.warning("alembic_version table exists but has no revision")
            except Exception:
                logger.warning("alembic_version table not found — migrations may not have been run")
    except Exception as exc:
        if settings.environment == "production":
            logger.critical("Cannot connect to database on startup: %s", exc)
            raise
        logger.error("Database unreachable on startup (non-production, continuing): %s", exc)

    yield

    # --- Shutdown ---
    await shutdown_db()
    logger.info("Database engine disposed")


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    # Disable docs in production
    docs_kwargs: dict = {}
    if settings.environment == "production":
        docs_kwargs.update(docs_url=None, redoc_url=None, openapi_url=None)

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        **docs_kwargs,
    )

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.allowed_host_list:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.allowed_host_list,
        )

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(inquiries.router, prefix="/api/v1")

    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        docs_path = "/docs" if settings.environment != "production" else None
        return {"service": settings.app_name, "docs": docs_path}

    return app


app = create_app()

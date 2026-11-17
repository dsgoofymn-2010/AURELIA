import logging
import secrets
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from contextvars import ContextVar
from pathlib import Path

from alembic.config import Config as AlembicConfig
from alembic.script import ScriptDirectory
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import text

from app.api.routes import health, inquiries
from app.config import get_settings
from app.db import get_engine, init_db, shutdown_db

logger = logging.getLogger("app.main")

_request_id: ContextVar[str] = ContextVar("request_id", default="-")


class _RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = _request_id.get()
        return True


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(request_id)s] %(name)s %(message)s",
    )
    for handler in logging.getLogger().handlers:
        if not any(isinstance(f, _RequestIdFilter) for f in handler.filters):
            handler.addFilter(_RequestIdFilter())


def _alembic_head() -> str | None:
    candidates = [
        Path(__file__).resolve().parents[1],
        Path.cwd(),
        Path.cwd().parent,
    ]
    backend_dir = next(
        (path for path in candidates if (path / "alembic.ini").exists()),
        None,
    )
    if backend_dir is None:
        return None
    try:
        config = AlembicConfig(str(backend_dir / "alembic.ini"))
        config.set_main_option("script_location", str(backend_dir / "alembic"))
        return ScriptDirectory.from_config(config).get_current_head()
    except Exception:  # noqa: BLE001 - a missing head must not crash startup
        logger.exception("Could not determine Alembic head revision")
        return None


async def _check_database(settings) -> None:
    engine = get_engine()
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
        logger.info("Database connectivity check passed")

        current: str | None = None
        try:
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            current = result.scalar_one_or_none()
        except Exception:
            logger.warning("alembic_version table not found or unreadable")

        head = _alembic_head()
        if head is None:
            logger.warning("Alembic head revision could not be determined")
            return
        if current != head:
            message = f"Database revision {current!r} does not match Alembic head {head!r}"
            if settings.environment != "development":
                logger.critical(message)
                raise RuntimeError(message)
            logger.warning(message)
        else:
            logger.info("Database migration revision matches head: %s", head)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    init_db(settings.database_url)

    try:
        await _check_database(settings)
    except Exception as exc:
        if settings.environment != "development":
            logger.critical("Startup database check failed: %s", exc)
            raise
        logger.error("Startup database check failed (non-production, continuing): %s", exc)

    yield

    await shutdown_db()
    logger.info("Database engine disposed")


def create_app() -> FastAPI:
    settings = get_settings()
    _configure_logging()

    docs_kwargs: dict = {}
    if settings.environment != "development":
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
        if settings.environment != "development":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

    @app.middleware("http")
    async def limit_inquiry_body(request: Request, call_next):
        if (
            request.method == "POST"
            and request.url.path.rstrip("/") == "/api/v1/inquiries"
        ):
            raw_length = request.headers.get("content-length")
            if raw_length is not None:
                try:
                    length = int(raw_length)
                except ValueError:
                    return JSONResponse(
                        status_code=400,
                        content={"detail": "Invalid Content-Length"},
                    )
                if length > settings.max_inquiry_body_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request body too large"},
                    )
        return await call_next(request)

    @app.middleware("http")
    async def enforce_https(request: Request, call_next):
        if settings.environment != "development" and request.url.path not in {
            "/api/v1/health",
            "/api/v1/ping",
        }:
            proto = request.url.scheme
            forwarded = request.headers.get("x-forwarded-proto")
            if forwarded and settings.trusted_proxy_list:
                proto = forwarded.split(",")[0].strip()
            if proto != "https" and request.method != "OPTIONS":
                return RedirectResponse(
                    str(request.url.replace(scheme="https")),
                    status_code=307,
                )
        return await call_next(request)

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

    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        raw = request.headers.get("x-request-id", "")
        request_id = "".join(c for c in raw if c.isalnum() or c in "-_")[:64]
        if not request_id:
            request_id = secrets.token_hex(8)
        token = _request_id.set(request_id)
        started = time.perf_counter()
        try:
            response = await call_next(request)
            response.headers["X-Request-Id"] = request_id
            logger.info(
                "%s %s -> %s (%.1f ms)",
                request.method,
                request.url.path,
                response.status_code,
                (time.perf_counter() - started) * 1000,
            )
            return response
        finally:
            _request_id.reset(token)

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(inquiries.router, prefix="/api/v1")

    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        docs_path = "/docs" if settings.environment == "development" else None
        return {"service": settings.app_name, "docs": docs_path}

    return app


app = create_app()

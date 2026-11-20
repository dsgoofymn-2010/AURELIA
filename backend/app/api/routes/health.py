from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.schemas import HealthOut, PingOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
async def health(db: AsyncSession = Depends(get_db)) -> JSONResponse:
    try:
        await db.execute(text("SELECT 1"))
        db_status = "up"
    except Exception:
        db_status = "down"

    status = "ok" if db_status == "up" else "degraded"
    body = HealthOut(status=status, database=db_status)
    status_code = 200 if db_status == "up" else 503
    return JSONResponse(content=body.model_dump(), status_code=status_code)


@router.get("/ping", response_model=PingOut)
async def ping() -> PingOut:
    settings = get_settings()
    return PingOut(service=settings.app_name, environment=settings.environment)

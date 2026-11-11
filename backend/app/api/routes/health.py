from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.schemas import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
async def health(db: AsyncSession = Depends(get_db)) -> HealthOut:
    try:
        await db.execute(text("SELECT 1"))
        db_status = "up"
    except Exception:
        db_status = "down"
    return HealthOut(
        status="ok" if db_status == "up" else "degraded", database=db_status
    )


@router.get("/ping")
async def ping() -> dict:
    settings = get_settings()
    return {"service": settings.app_name, "environment": settings.environment}

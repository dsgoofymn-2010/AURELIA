import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Inquiry
from app.schemas import InquiryCreate

logger = logging.getLogger("app.inquiries")


async def create_inquiry(db: AsyncSession, data: InquiryCreate) -> Inquiry:
    dump = data.model_dump(by_alias=False)

    # --- Idempotency-key deduplication (24 h window) ---
    idempotency_key = dump.get("idempotency_key")
    if idempotency_key:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        existing = await db.execute(
            select(Inquiry).where(
                Inquiry.idempotency_key == idempotency_key,
                Inquiry.created_at >= cutoff,
            )
        )
        found = existing.scalars().first()
        if found:
            logger.info("idempotency hit key=%s → inquiry %s", idempotency_key, found.id)
            return found

    # --- Short-window email+project_type deduplication (5 min) ---
    dedup_cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    existing_dup = await db.execute(
        select(Inquiry).where(
            Inquiry.email == dump["email"],
            Inquiry.project_type == dump["project_type"],
            Inquiry.created_at >= dedup_cutoff,
        )
    )
    dup = existing_dup.scalars().first()
    if dup:
        logger.info(
            "short-window dedupe hit email=%s project_type=%s → inquiry %s",
            dump["email"],
            dump["project_type"],
            dup.id,
        )
        return dup

    # --- Insert ---
    inquiry = Inquiry(**dump)
    db.add(inquiry)
    try:
        await db.commit()
        await db.refresh(inquiry)
    except Exception:
        await db.rollback()
        logger.exception("Database error while creating inquiry")
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable \u2014 please retry",
        )
    logger.info("stored inquiry %s", inquiry.id)
    return inquiry


async def list_inquiries(
    db: AsyncSession,
    *,
    limit: int = 50,
    offset: int = 0,
    email: str | None = None,
    project_type: str | None = None,
    created_after: datetime | None = None,
    created_before: datetime | None = None,
) -> dict[str, Any]:
    query = select(Inquiry)
    count_query = select(func.count()).select_from(Inquiry)

    if email:
        query = query.where(Inquiry.email == email)
        count_query = count_query.where(Inquiry.email == email)
    if project_type:
        query = query.where(Inquiry.project_type == project_type)
        count_query = count_query.where(Inquiry.project_type == project_type)
    if created_after:
        query = query.where(Inquiry.created_at >= created_after)
        count_query = count_query.where(Inquiry.created_at >= created_after)
    if created_before:
        query = query.where(Inquiry.created_at <= created_before)
        count_query = count_query.where(Inquiry.created_at <= created_before)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    result = await db.execute(
        query.order_by(Inquiry.created_at.desc(), Inquiry.id.desc())
        .offset(offset)
        .limit(limit)
    )
    items = list(result.scalars().all())

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
    }

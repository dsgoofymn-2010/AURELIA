import logging
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import (
    DisconnectionError,
    IntegrityError,
    InterfaceError,
    OperationalError,
    SQLAlchemyError,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Inquiry
from app.schemas import InquiryCreate

logger = logging.getLogger("app.inquiries")


def _payload_matches(existing: Inquiry, payload: dict[str, Any]) -> bool:
    return all(getattr(existing, field) == value for field, value in payload.items())


async def _find_by_key(db: AsyncSession, key: str) -> Inquiry | None:
    result = await db.execute(
        select(Inquiry)
        .where(Inquiry.idempotency_key == key)
        .order_by(Inquiry.id.asc())
        .limit(1)
    )
    return result.scalars().first()


def _reuse(existing: Inquiry, payload: dict[str, Any], key: str) -> Inquiry:
    if _payload_matches(existing, payload):
        logger.info("idempotency hit key=%s → inquiry %s", key, existing.id)
        return existing
    logger.warning("idempotency key reuse with different payload key=%s", key)
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="This idempotency key was already used with different submission data",
    )


async def create_inquiry(db: AsyncSession, data: InquiryCreate) -> Inquiry:
    dump = data.model_dump(by_alias=False)
    idempotency_key = dump.pop("idempotency_key", None)

    if idempotency_key:
        existing = await _find_by_key(db, idempotency_key)
        if existing:
            return _reuse(existing, dump, idempotency_key)

    inquiry = Inquiry(**dump, idempotency_key=idempotency_key)
    db.add(inquiry)
    try:
        await db.commit()
        await db.refresh(inquiry)
    except IntegrityError:
        # A concurrent request with the same idempotency key won the race.
        await db.rollback()
        if idempotency_key:
            existing = await _find_by_key(db, idempotency_key)
            if existing:
                return _reuse(existing, dump, idempotency_key)
        logger.exception("Integrity error while creating inquiry")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not store inquiry",
        )
    except (OperationalError, InterfaceError, DisconnectionError):
        await db.rollback()
        logger.exception("Database unavailable while creating inquiry")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable — please retry",
        )
    except SQLAlchemyError:
        await db.rollback()
        logger.exception("Database error while creating inquiry")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not store inquiry",
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

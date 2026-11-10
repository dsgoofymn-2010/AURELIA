import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Inquiry
from app.schemas import InquiryCreate

logger = logging.getLogger("app.inquiries")


async def create_inquiry(db: AsyncSession, data: InquiryCreate) -> Inquiry:
    inquiry = Inquiry(**data.model_dump(by_alias=False))
    db.add(inquiry)
    await db.commit()
    await db.refresh(inquiry)
    logger.info("stored inquiry %s", inquiry.id)
    return inquiry


async def list_inquiries(db: AsyncSession, limit: int = 50) -> list[Inquiry]:
    result = await db.execute(
        select(Inquiry)
        .order_by(Inquiry.created_at.desc(), Inquiry.id.desc())
        .limit(limit)
    )
    return list(result.scalars().all())

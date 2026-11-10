from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin_key
from app.db import get_db
from app.schemas import InquiryCreate, InquiryOut
from app.services import email_service, inquiry_service

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("", response_model=InquiryOut, status_code=201)
async def create_inquiry(
    payload: InquiryCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> InquiryOut:
    inquiry = await inquiry_service.create_inquiry(db, payload)
    background_tasks.add_task(email_service.send_inquiry_notification, inquiry)
    return InquiryOut.model_validate(inquiry)


@router.get("", response_model=list[InquiryOut])
async def list_inquiries(
    limit: int = Query(default=50, ge=1, le=200),
    x_admin_key: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[InquiryOut]:
    require_admin_key(x_admin_key)
    inquiries = await inquiry_service.list_inquiries(db, limit=limit)
    return [InquiryOut.model_validate(i) for i in inquiries]

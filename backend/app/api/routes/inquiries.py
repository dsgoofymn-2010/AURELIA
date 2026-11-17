from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin_key
from app.db import get_db
from app.schemas import InquiryCreate, InquiryListOut, InquiryOut
from app.services import inquiry_service

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("", response_model=InquiryOut, status_code=201)
async def create_inquiry(
    payload: InquiryCreate,
    db: AsyncSession = Depends(get_db),
) -> InquiryOut:
    inquiry = await inquiry_service.create_inquiry(db, payload)
    return InquiryOut.model_validate(inquiry)


@router.get("", response_model=InquiryListOut)
async def list_inquiries(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    email: str | None = Query(default=None),
    project_type: str | None = Query(default=None),
    created_after: datetime | None = Query(default=None),
    created_before: datetime | None = Query(default=None),
    _admin: None = Depends(require_admin_key),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    result = await inquiry_service.list_inquiries(
        db,
        limit=limit,
        offset=offset,
        email=email,
        project_type=project_type,
        created_after=created_after,
        created_before=created_before,
    )
    body = InquiryListOut(
        items=[InquiryOut.model_validate(i) for i in result["items"]],
        total=result["total"],
        offset=result["offset"],
        limit=result["limit"],
    )
    return JSONResponse(
        content=body.model_dump(mode="json", by_alias=True),
        headers={"Cache-Control": "no-store, private"},
    )

import re
from datetime import date, datetime, timezone

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _empty_to_none(v: str | None) -> str | None:
    """Normalize empty / whitespace-only strings to None."""
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


_PHONE_RE = re.compile(r"^\+?[\d\s\-()]{7,25}$")


class InquiryCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    project_type: str = Field(
        min_length=1, max_length=120, alias="projectType", serialization_alias="projectType"
    )
    project_location: str | None = Field(
        default=None,
        max_length=255,
        alias="projectLocation",
        serialization_alias="projectLocation",
    )
    preferred_date: date | None = Field(
        default=None, alias="preferredDate", serialization_alias="preferredDate"
    )
    message: str | None = Field(default=None, max_length=2000)
    idempotency_key: str | None = Field(
        default=None, max_length=64, alias="idempotencyKey", serialization_alias="idempotencyKey"
    )
    residence_floor: str | None = Field(
        default=None, max_length=40, alias="residenceFloor", serialization_alias="residenceFloor"
    )

    @field_validator("email", mode="before")
    @classmethod
    def _normalise_email(cls, v: str | None) -> str | None:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("phone", mode="before")
    @classmethod
    def _normalise_phone(cls, v: str | None) -> str | None:
        v = _empty_to_none(v)
        if v is not None:
            if not _PHONE_RE.match(v):
                raise ValueError("phone must match +?[digits/spaces/hyphens/parens]")
            digits = sum(c.isdigit() for c in v)
            if digits < 7 or digits > 15:
                raise ValueError("phone must contain between 7 and 15 digits")
        return v

    @field_validator("project_location", "message", mode="before")
    @classmethod
    def _normalise_optional_strings(cls, v: str | None) -> str | None:
        return _empty_to_none(v)

    @field_validator("preferred_date", mode="before")
    @classmethod
    def _normalise_date(cls, v: object) -> object:
        return _empty_to_none(v) if isinstance(v, str) else v

    @field_validator("preferred_date", mode="after")
    @classmethod
    def _reject_past_dates(cls, v: date | None) -> date | None:
        if v is not None and v < datetime.now(timezone.utc).date():
            raise ValueError("preferred_date must not be in the past")
        return v


class InquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str | None = None
    project_type: str = Field(serialization_alias="projectType")
    project_location: str | None = Field(default=None, serialization_alias="projectLocation")
    preferred_date: date | None = Field(default=None, serialization_alias="preferredDate")
    message: str | None = None
    residence_floor: str | None = Field(default=None, serialization_alias="residenceFloor")
    created_at: datetime = Field(serialization_alias="createdAt")


class InquiryListOut(BaseModel):
    items: list[InquiryOut]
    total: int
    offset: int
    limit: int


class HealthOut(BaseModel):
    status: str
    database: str


class PingOut(BaseModel):
    service: str
    environment: str

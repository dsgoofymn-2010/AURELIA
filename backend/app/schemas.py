from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class InquiryCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=40)
    project_type: str = Field(
        min_length=1, max_length=120, alias="projectType", serialization_alias="projectType"
    )
    project_location: str = Field(
        min_length=1,
        max_length=255,
        alias="projectLocation",
        serialization_alias="projectLocation",
    )


class InquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str
    project_type: str = Field(serialization_alias="projectType")
    project_location: str = Field(serialization_alias="projectLocation")
    created_at: datetime


class HealthOut(BaseModel):
    status: str
    database: str

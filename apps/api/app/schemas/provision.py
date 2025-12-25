from pydantic import BaseModel, EmailStr
from typing import Optional


class TenantCreateRequest(BaseModel):
    name: str
    domain: str
    primary_color: str = "#000000"
    font_family: str = "Inter"
    seed_data: bool = True


class TenantResponse(BaseModel):
    id: str
    schema_name: str
    message: str


class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    business_name: Optional[str] = None

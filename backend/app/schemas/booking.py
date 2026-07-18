from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int = 1
    check_in: date
    check_out: date
    guests: int = Field(ge=1)


class BookingResult(BaseModel):
    id: int
    booking_uuid: UUID
    status: str
    total: float
    nights: int

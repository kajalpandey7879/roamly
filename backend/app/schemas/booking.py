from datetime import date

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int = 1
    check_in: date
    check_out: date
    guests: int = Field(ge=1)


class BookingResult(BaseModel):
    id: int
    status: str
    total: float
    nights: int

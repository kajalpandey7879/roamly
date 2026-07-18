from fastapi import APIRouter

from backend.app.core.config import settings
from backend.app.schemas.booking import BookingCreate, BookingResult
from backend.app.services.booking_service import booking_service

router = APIRouter(tags=["bookings"])


@router.post("/bookings", response_model=BookingResult, status_code=201)
def create_booking(payload: BookingCreate):
    return booking_service.create(payload)


@router.get("/trips")
def get_trips(user_id: int = settings.active_guest_id):
    return booking_service.trips(user_id)

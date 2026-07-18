from fastapi import APIRouter

from backend.app.core.config import settings
from backend.app.schemas.review import ReviewCreate, ReviewResult
from backend.app.services.review_service import review_service

router = APIRouter(prefix="/bookings", tags=["reviews"])


@router.post("/{booking_uuid}/review", response_model=ReviewResult, status_code=201)
def create_review(
    booking_uuid: str,
    payload: ReviewCreate,
    user_id: int = settings.active_guest_id,
):
    return review_service.create(booking_uuid, user_id, payload)

from fastapi import APIRouter

from backend.app.core.config import settings
from backend.app.services.favorite_service import favorite_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("")
def get_favorites(user_id: int = settings.active_guest_id):
    return favorite_service.list(user_id)


@router.put("/{listing_id}")
def toggle_favorite(listing_id: int, user_id: int = settings.active_guest_id):
    return favorite_service.toggle(user_id, listing_id)

from fastapi import APIRouter, Query

from backend.app.core.config import settings
from backend.app.schemas.listing import ListingFilters
from backend.app.services.listing_service import listing_service

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("")
def search_listings(location: str = "", category: str = "", property_type: str = "", min_price: float = 0, max_price: float = 10_000, guests: int = Query(1, ge=1), page: int = Query(1, ge=1), page_size: int = Query(8, ge=1, le=24), user_id: int = settings.active_guest_id):
    filters = ListingFilters(location, category, property_type, min_price, max_price, guests, page, page_size)
    return listing_service.search(filters, user_id)


@router.get("/{listing_id}")
def get_listing(listing_id: int, user_id: int = settings.active_guest_id):
    return listing_service.detail(listing_id, user_id)

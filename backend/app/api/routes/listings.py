from datetime import date

from fastapi import APIRouter, Query

from backend.app.core.config import settings
from backend.app.schemas.listing import ListingFilters
from backend.app.services.listing_service import listing_service

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("")
def search_listings(
    location: str = "",
    category: str = "",
    property_type: str = "",
    amenities: str = "",
    min_price: float = Query(0, ge=0),
    max_price: float = Query(10_000, gt=0),
    min_bedrooms: int = Query(0, ge=0),
    min_beds: int = Query(0, ge=0),
    min_baths: float = Query(0, ge=0),
    min_rating: float = Query(0, ge=0, le=5),
    guests: int = Query(1, ge=1),
    check_in: date | None = None,
    check_out: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=24),
    user_id: int = settings.active_guest_id,
):
    filters = ListingFilters(
        location=location,
        category=category,
        property_type=property_type,
        amenities=tuple(value.strip() for value in amenities.split(",") if value.strip()),
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        min_beds=min_beds,
        min_baths=min_baths,
        min_rating=min_rating,
        guests=guests,
        check_in=check_in,
        check_out=check_out,
        page=page,
        page_size=page_size,
    )
    return listing_service.search(filters, user_id)


@router.get("/{listing_id}")
def get_listing(listing_id: int, user_id: int = settings.active_guest_id):
    return listing_service.detail(listing_id, user_id)

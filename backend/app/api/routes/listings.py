from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

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
    flex_length: Literal["weekend", "week", "month"] = "weekend",
    flex_months: str = "",
    north: float | None = Query(None, ge=-90, le=90),
    south: float | None = Query(None, ge=-90, le=90),
    east: float | None = Query(None, ge=-180, le=180),
    west: float | None = Query(None, ge=-180, le=180),
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
        flexible_ranges=_flexible_ranges(flex_length, flex_months),
        north=north,
        south=south,
        east=east,
        west=west,
        page=page,
        page_size=page_size,
    )
    return listing_service.search(filters, user_id)


@router.get("/{listing_id}")
def get_listing(listing_id: int, user_id: int = settings.active_guest_id):
    return listing_service.detail(listing_id, user_id)


def _flexible_ranges(
    stay_length: Literal["weekend", "week", "month"], months: str
) -> tuple[tuple[date, date], ...]:
    ranges: list[tuple[date, date]] = []
    for value in (month.strip() for month in months.split(",") if month.strip()):
        try:
            month_start = date.fromisoformat(f"{value}-01")
        except ValueError as error:
            raise HTTPException(status_code=422, detail="Flexible months must use YYYY-MM") from error

        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        if stay_length == "weekend":
            check_in = month_start + timedelta(days=(4 - month_start.weekday()) % 7)
            check_out = check_in + timedelta(days=2)
        elif stay_length == "week":
            check_in = month_start
            check_out = min(month_start + timedelta(days=7), next_month)
        else:
            check_in = month_start
            check_out = next_month
        ranges.append((check_in, check_out))
    return tuple(ranges[:3])

from datetime import date

from fastapi import HTTPException

from backend.app.db import connection
from backend.app.repositories.listing_repository import listing_repository
from backend.app.schemas.listing import ListingFilters


class ListingService:
    def search(self, filters: ListingFilters, user_id: int) -> dict:
        if filters.min_price > filters.max_price:
            raise HTTPException(status_code=422, detail="Minimum price cannot exceed maximum price")
        if bool(filters.check_in) != bool(filters.check_out):
            raise HTTPException(status_code=422, detail="Both check-in and checkout dates are required")
        if filters.check_in and filters.check_out and filters.check_out <= filters.check_in:
            raise HTTPException(status_code=422, detail="Checkout must be at least one night after check-in")
        if filters.check_in and filters.check_in < date.today():
            raise HTTPException(status_code=422, detail="Check-in cannot be in the past")
        bounds = (filters.north, filters.south, filters.east, filters.west)
        if any(value is not None for value in bounds) and not all(value is not None for value in bounds):
            raise HTTPException(status_code=422, detail="All map bounds are required")
        if filters.north is not None and filters.south is not None and filters.north <= filters.south:
            raise HTTPException(status_code=422, detail="North map bound must exceed south")
        with connection() as database:
            items, total = listing_repository.search(database, filters, user_id)
        pages = max(1, (total + filters.page_size - 1) // filters.page_size)
        return {"items": items, "total": total, "page": filters.page, "pages": pages}

    def detail(self, listing_id: int, user_id: int) -> dict:
        with connection() as database:
            listing = listing_repository.get_detail(database, listing_id, user_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        return listing


listing_service = ListingService()

from fastapi import HTTPException

from backend.app.db import connection
from backend.app.repositories.listing_repository import listing_repository
from backend.app.schemas.listing import ListingFilters


class ListingService:
    def search(self, filters: ListingFilters, user_id: int) -> dict:
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

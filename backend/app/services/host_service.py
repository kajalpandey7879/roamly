from fastapi import HTTPException

from backend.app.db import connection, transaction
from backend.app.repositories.host_repository import host_repository
from backend.app.schemas.listing import ListingCreate


class HostService:
    def listings(self, host_id: int) -> list[dict]:
        with connection() as database:
            return host_repository.listings(database, host_id)

    def bookings(self, host_id: int) -> list[dict]:
        with connection() as database:
            return host_repository.bookings(database, host_id)

    def create(self, host_id: int, payload: ListingCreate) -> dict:
        with transaction() as database:
            if not host_repository.promote_to_host(database, host_id):
                raise HTTPException(status_code=404, detail="User not found")
            listing_id = host_repository.create(database, host_id, payload.model_dump())
        return {"id": listing_id, "role": "host"}

    def update(self, listing_id: int, host_id: int, payload: ListingCreate) -> dict:
        with transaction() as database:
            updated = host_repository.update(database, listing_id, host_id, payload.model_dump())
        if not updated:
            raise HTTPException(status_code=404, detail="Listing not found")
        return {"id": listing_id}

    def delete(self, listing_id: int, host_id: int) -> None:
        with transaction() as database:
            deleted = host_repository.delete(database, listing_id, host_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Listing not found")


host_service = HostService()

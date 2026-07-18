from datetime import date

from fastapi import HTTPException

from backend.app.db import connection, transaction
from backend.app.repositories.booking_repository import booking_repository
from backend.app.schemas.booking import BookingCreate


class BookingService:
    def create(self, payload: BookingCreate) -> dict:
        if payload.check_in < date.today() or payload.check_out <= payload.check_in:
            raise HTTPException(status_code=422, detail="Choose a valid future date range")
        nights = (payload.check_out - payload.check_in).days
        with transaction() as database:
            listing = booking_repository.get_listing(database, payload.listing_id)
            if not listing:
                raise HTTPException(status_code=404, detail="Listing not found")
            if payload.guests > listing["max_guests"]:
                raise HTTPException(status_code=422, detail=f"This stay allows up to {listing['max_guests']} guests")
            if booking_repository.dates_overlap(database, payload.listing_id, payload.check_in.isoformat(), payload.check_out.isoformat()):
                raise HTTPException(status_code=409, detail="Those dates are no longer available")
            total = round(listing["price"] * nights + listing["cleaning_fee"] + listing["service_fee"], 2)
            booking_id = booking_repository.create(database, listing_id=payload.listing_id, guest_id=payload.guest_id, check_in=payload.check_in.isoformat(), check_out=payload.check_out.isoformat(), guests=payload.guests, nights=nights, total=total)
        return {"id": booking_id, "status": "confirmed", "total": total, "nights": nights}

    def trips(self, guest_id: int) -> list[dict]:
        with connection() as database:
            return booking_repository.trips_for_guest(database, guest_id)


booking_service = BookingService()

import sqlite3
from datetime import date

from fastapi import HTTPException

from backend.app.db import transaction
from backend.app.repositories.review_repository import review_repository
from backend.app.schemas.review import ReviewCreate


class ReviewService:
    def create(self, booking_uuid: str, user_id: int, payload: ReviewCreate) -> dict:
        with transaction() as database:
            booking = review_repository.booking_for_review(database, booking_uuid, user_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            if booking["status"] != "confirmed" or date.fromisoformat(booking["check_out"]) >= date.today():
                raise HTTPException(
                    status_code=422, detail="You can review this stay after checkout"
                )
            if booking["existing_review_id"]:
                raise HTTPException(status_code=409, detail="This stay has already been reviewed")
            try:
                review_id = review_repository.create(
                    database,
                    booking_id=booking["booking_id"],
                    listing_id=booking["listing_id"],
                    user_id=user_id,
                    user_name=booking["user_name"],
                    avatar=booking["user_avatar"],
                    rating=payload.rating,
                    body=payload.body.strip(),
                    created_at=date.today().isoformat(),
                )
            except sqlite3.IntegrityError as error:
                raise HTTPException(
                    status_code=409, detail="This stay has already been reviewed"
                ) from error
            rating, review_count = review_repository.listing_stats(
                database, booking["listing_id"]
            )
            database.execute(
                "UPDATE listings SET rating=?, review_count=? WHERE id=?",
                (rating, review_count, booking["listing_id"]),
            )
            is_superhost = review_repository.refresh_host_superhost(database, booking["host_id"])

        return {
            "id": review_id,
            "booking_id": booking["booking_id"],
            "listing_id": booking["listing_id"],
            "user_id": user_id,
            "user_name": booking["user_name"],
            "avatar": booking["user_avatar"],
            "rating": payload.rating,
            "body": payload.body.strip(),
            "created_at": date.today().isoformat(),
            "listing_rating": rating,
            "listing_review_count": review_count,
            "host_is_superhost": is_superhost,
        }


review_service = ReviewService()

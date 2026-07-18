import json
import sqlite3


class BookingRepository:
    def get_listing(self, database: sqlite3.Connection, listing_id: int):
        return database.execute("SELECT * FROM listings WHERE id=?", (listing_id,)).fetchone()

    def dates_overlap(self, database: sqlite3.Connection, listing_id: int, check_in: str, check_out: str) -> bool:
        return database.execute(
            "SELECT 1 FROM bookings WHERE listing_id=? AND status='confirmed' AND check_in < ? AND check_out > ?",
            (listing_id, check_out, check_in),
        ).fetchone() is not None

    def create(self, database: sqlite3.Connection, *, listing_id: int, guest_id: int, check_in: str, check_out: str, guests: int, nights: int, total: float) -> int:
        cursor = database.execute(
            "INSERT INTO bookings(listing_id,guest_id,check_in,check_out,guests,nights,total,status) VALUES (?,?,?,?,?,?,?,'confirmed')",
            (listing_id, guest_id, check_in, check_out, guests, nights, total),
        )
        return cursor.lastrowid

    def trips_for_guest(self, database: sqlite3.Connection, guest_id: int) -> list[dict]:
        rows = database.execute(
            "SELECT b.*, l.title,l.city,l.country,l.images FROM bookings b JOIN listings l ON l.id=b.listing_id WHERE b.guest_id=? ORDER BY b.check_in", (guest_id,),
        ).fetchall()
        trips = []
        for row in rows:
            trip = dict(row)
            trip["image"] = json.loads(trip.pop("images"))[0]
            trips.append(trip)
        return trips


booking_repository = BookingRepository()

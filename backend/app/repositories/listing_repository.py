import sqlite3
from typing import Any

from backend.app.db.serializers import serialize_listing
from backend.app.schemas.listing import ListingFilters


class ListingRepository:
    @staticmethod
    def _where(filters: ListingFilters) -> tuple[str, list[Any]]:
        clauses = ["l.price BETWEEN ? AND ?", "l.max_guests >= ?"]
        values: list[Any] = [filters.min_price, filters.max_price, filters.guests]
        if filters.location:
            clauses.append("(LOWER(l.city) LIKE ? OR LOWER(l.country) LIKE ?)")
            term = f"%{filters.location.lower()}%"
            values.extend([term, term])
        if filters.category:
            clauses.append("l.category = ?")
            values.append(filters.category)
        if filters.property_type:
            clauses.append("l.property_type = ?")
            values.append(filters.property_type)
        return " AND ".join(clauses), values

    def search(self, database: sqlite3.Connection, filters: ListingFilters, user_id: int) -> tuple[list[dict], int]:
        where, values = self._where(filters)
        total = database.execute(f"SELECT COUNT(*) FROM listings l WHERE {where}", values).fetchone()[0]
        rows = database.execute(
            f"""SELECT l.*, EXISTS(SELECT 1 FROM favorites f WHERE f.listing_id=l.id AND f.user_id=?) favorite
            FROM listings l WHERE {where} ORDER BY l.rating DESC LIMIT ? OFFSET ?""",
            [user_id, *values, filters.page_size, (filters.page - 1) * filters.page_size],
        ).fetchall()
        return [serialize_listing(row) for row in rows], total

    def get_detail(self, database: sqlite3.Connection, listing_id: int, user_id: int) -> dict | None:
        row = database.execute(
            """SELECT l.*, EXISTS(SELECT 1 FROM favorites f WHERE f.listing_id=l.id AND f.user_id=?) favorite
            FROM listings l WHERE l.id=?""", (user_id, listing_id),
        ).fetchone()
        if not row:
            return None
        listing = serialize_listing(row)
        listing["host"] = dict(database.execute("SELECT * FROM users WHERE id=?", (row["host_id"],)).fetchone())
        listing["reviews"] = [dict(review) for review in database.execute("SELECT * FROM reviews WHERE listing_id=? ORDER BY created_at DESC", (listing_id,)).fetchall()]
        listing["unavailable_dates"] = [dict(period) for period in database.execute("SELECT check_in, check_out FROM bookings WHERE listing_id=? AND status='confirmed'", (listing_id,)).fetchall()]
        return listing


listing_repository = ListingRepository()

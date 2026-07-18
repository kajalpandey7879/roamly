import sqlite3
from typing import Any

from backend.app.db.serializers import serialize_listing
from backend.app.schemas.listing import ListingFilters


class ListingRepository:
    review_stats_join = """LEFT JOIN (
        SELECT listing_id, ROUND(AVG(rating), 2) rating, COUNT(*) review_count
        FROM reviews
        GROUP BY listing_id
    ) rs ON rs.listing_id=l.id"""

    @staticmethod
    def _where(filters: ListingFilters) -> tuple[str, list[Any]]:
        clauses = ["l.is_active=1", "l.price BETWEEN ? AND ?", "l.max_guests >= ?"]
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
        for amenity in filters.amenities:
            clauses.append("LOWER(l.amenities) LIKE ?")
            values.append(f"%{amenity.lower()}%")
        if filters.min_bedrooms:
            clauses.append("l.bedrooms >= ?")
            values.append(filters.min_bedrooms)
        if filters.min_beds:
            clauses.append("l.beds >= ?")
            values.append(filters.min_beds)
        if filters.min_baths:
            clauses.append("l.baths >= ?")
            values.append(filters.min_baths)
        if filters.min_rating:
            clauses.append("COALESCE(rs.rating, l.rating) >= ?")
            values.append(filters.min_rating)
        if all(
            value is not None
            for value in (filters.north, filters.south, filters.east, filters.west)
        ):
            clauses.append("l.latitude BETWEEN ? AND ?")
            values.extend([filters.south, filters.north])
            if filters.west <= filters.east:
                clauses.append("l.longitude BETWEEN ? AND ?")
                values.extend([filters.west, filters.east])
            else:
                clauses.append("(l.longitude >= ? OR l.longitude <= ?)")
                values.extend([filters.west, filters.east])
        if filters.check_in and filters.check_out:
            clauses.append(
                """NOT EXISTS (
                    SELECT 1 FROM bookings b
                    WHERE b.listing_id = l.id AND b.status = 'confirmed'
                    AND b.check_in < ? AND b.check_out > ?
                )"""
            )
            values.extend([filters.check_out.isoformat(), filters.check_in.isoformat()])
        if filters.flexible_ranges:
            availability_options = []
            for check_in, check_out in filters.flexible_ranges:
                availability_options.append(
                    """NOT EXISTS (
                        SELECT 1 FROM bookings b
                        WHERE b.listing_id = l.id AND b.status = 'confirmed'
                        AND b.check_in < ? AND b.check_out > ?
                    )"""
                )
                values.extend([check_out.isoformat(), check_in.isoformat()])
            clauses.append(f"({' OR '.join(availability_options)})")
        return " AND ".join(clauses), values

    def search(self, database: sqlite3.Connection, filters: ListingFilters, user_id: int) -> tuple[list[dict], int]:
        where, values = self._where(filters)
        total = database.execute(
            f"SELECT COUNT(*) FROM listings l {self.review_stats_join} WHERE {where}", values
        ).fetchone()[0]
        rows = database.execute(
            f"""SELECT l.*,
                COALESCE(rs.rating, l.rating) computed_rating,
                COALESCE(rs.review_count, 0) computed_review_count,
                u.name host_name, u.is_superhost host_is_superhost,
                EXISTS(
                    SELECT 1 FROM favorites f
                    WHERE f.listing_id=l.id AND f.user_id=?
                ) favorite
            FROM listings l
            {self.review_stats_join}
            JOIN users u ON u.id=l.host_id
            WHERE {where}
            ORDER BY l.id ASC
            LIMIT ? OFFSET ?""",
            [user_id, *values, filters.page_size, (filters.page - 1) * filters.page_size],
        ).fetchall()
        return [serialize_listing(row) for row in rows], total

    def get_detail(self, database: sqlite3.Connection, listing_id: int, user_id: int) -> dict | None:
        row = database.execute(
            f"""SELECT l.*,
                COALESCE(rs.rating, l.rating) computed_rating,
                COALESCE(rs.review_count, 0) computed_review_count,
                EXISTS(
                    SELECT 1 FROM favorites f
                    WHERE f.listing_id=l.id AND f.user_id=?
                ) favorite,
                u.id host_user_id, u.name host_name, u.avatar host_avatar,
                u.role host_role, u.joined_year host_joined_year,
                u.is_superhost host_is_superhost
            FROM listings l
            {self.review_stats_join}
            JOIN users u ON u.id=l.host_id
            WHERE l.id=?""",
            (user_id, listing_id),
        ).fetchone()
        if not row:
            return None
        listing = serialize_listing(row)
        listing["host"] = {
            "id": listing.pop("host_user_id"),
            "name": listing.pop("host_name"),
            "avatar": listing.pop("host_avatar"),
            "role": listing.pop("host_role"),
            "joined_year": listing.pop("host_joined_year"),
            "is_superhost": listing.pop("host_is_superhost"),
        }
        listing["reviews"] = [dict(review) for review in database.execute("SELECT * FROM reviews WHERE listing_id=? ORDER BY created_at DESC", (listing_id,)).fetchall()]
        listing["unavailable_dates"] = [dict(period) for period in database.execute("SELECT check_in, check_out FROM bookings WHERE listing_id=? AND status='confirmed'", (listing_id,)).fetchall()]
        return listing


listing_repository = ListingRepository()

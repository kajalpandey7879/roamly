import sqlite3


class ReviewRepository:
    def booking_for_review(
        self, database: sqlite3.Connection, booking_uuid: str, user_id: int
    ) -> sqlite3.Row | None:
        return database.execute(
            """SELECT b.id booking_id, b.listing_id, b.check_out, b.status,
                u.name user_name, u.avatar user_avatar, l.host_id,
                r.id existing_review_id
            FROM bookings b
            JOIN users u ON u.id=b.guest_id
            JOIN listings l ON l.id=b.listing_id
            LEFT JOIN reviews r ON r.booking_id=b.id
            WHERE b.booking_uuid=? AND b.guest_id=?""",
            (booking_uuid, user_id),
        ).fetchone()

    def create(
        self,
        database: sqlite3.Connection,
        *,
        booking_id: int,
        listing_id: int,
        user_id: int,
        user_name: str,
        avatar: str,
        rating: int,
        body: str,
        created_at: str,
    ) -> int:
        cursor = database.execute(
            """INSERT INTO reviews(
                listing_id,booking_id,user_id,user_name,avatar,rating,body,created_at
            ) VALUES (?,?,?,?,?,?,?,?)""",
            (listing_id, booking_id, user_id, user_name, avatar, rating, body, created_at),
        )
        return cursor.lastrowid

    def listing_stats(self, database: sqlite3.Connection, listing_id: int) -> tuple[float, int]:
        row = database.execute(
            "SELECT ROUND(AVG(rating), 2), COUNT(*) FROM reviews WHERE listing_id=?",
            (listing_id,),
        ).fetchone()
        return float(row[0] or 0), int(row[1])

    def refresh_host_superhost(self, database: sqlite3.Connection, host_id: int) -> int:
        row = database.execute(
            """SELECT ROUND(AVG(r.rating), 2) average_rating, COUNT(r.id) review_count
            FROM listings l
            LEFT JOIN reviews r ON r.listing_id=l.id
            WHERE l.host_id=?""",
            (host_id,),
        ).fetchone()
        is_superhost = int((row[1] or 0) >= 5 and (row[0] or 0) >= 4.8)
        database.execute("UPDATE users SET is_superhost=? WHERE id=?", (is_superhost, host_id))
        return is_superhost


review_repository = ReviewRepository()

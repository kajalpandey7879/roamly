import sqlite3

from backend.app.db.serializers import serialize_listing, serialize_listing_payload


class HostRepository:
    def promote_to_host(self, database: sqlite3.Connection, user_id: int) -> bool:
        return bool(
            database.execute(
                "UPDATE users SET role='host' WHERE id=?",
                (user_id,),
            ).rowcount
        )

    def listings(self, database: sqlite3.Connection, host_id: int) -> list[dict]:
        rows = database.execute(
            """SELECT l.*, COUNT(b.id) booking_count
            FROM listings l
            LEFT JOIN bookings b ON b.listing_id=l.id
            WHERE l.host_id=? AND l.is_active=1
            GROUP BY l.id
            ORDER BY l.created_at DESC""",
            (host_id,),
        ).fetchall()
        return [serialize_listing(row) for row in rows]

    def bookings(self, database: sqlite3.Connection, host_id: int) -> list[dict]:
        rows = database.execute("SELECT b.*,l.title,u.name guest_name FROM bookings b JOIN listings l ON l.id=b.listing_id JOIN users u ON u.id=b.guest_id WHERE l.host_id=? ORDER BY b.check_in", (host_id,)).fetchall()
        return [dict(row) for row in rows]

    def create(self, database: sqlite3.Connection, host_id: int, payload: dict) -> int:
        values = serialize_listing_payload(payload)
        columns = ["host_id", *values.keys()]
        cursor = database.execute(f"INSERT INTO listings({','.join(columns)}) VALUES ({','.join(['?'] * len(columns))})", [host_id, *values.values()])
        return cursor.lastrowid

    def update(self, database: sqlite3.Connection, listing_id: int, host_id: int, payload: dict) -> bool:
        values = serialize_listing_payload(payload)
        cursor = database.execute(
            f"UPDATE listings SET {','.join(f'{key}=?' for key in values)} WHERE id=? AND host_id=? AND is_active=1",
            [*values.values(), listing_id, host_id],
        )
        return bool(cursor.rowcount)

    def delete(self, database: sqlite3.Connection, listing_id: int, host_id: int) -> bool:
        return bool(
            database.execute(
                "UPDATE listings SET is_active=0 WHERE id=? AND host_id=? AND is_active=1",
                (listing_id, host_id),
            ).rowcount
        )


host_repository = HostRepository()

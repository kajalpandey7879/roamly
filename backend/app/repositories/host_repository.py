import sqlite3

from backend.app.db.serializers import serialize_listing, serialize_listing_payload


class HostRepository:
    def listings(self, database: sqlite3.Connection, host_id: int) -> list[dict]:
        rows = database.execute("SELECT l.*, (SELECT COUNT(*) FROM bookings b WHERE b.listing_id=l.id) booking_count FROM listings l WHERE host_id=? ORDER BY created_at DESC", (host_id,)).fetchall()
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
        cursor = database.execute(f"UPDATE listings SET {','.join(f'{key}=?' for key in values)} WHERE id=? AND host_id=?", [*values.values(), listing_id, host_id])
        return bool(cursor.rowcount)

    def delete(self, database: sqlite3.Connection, listing_id: int, host_id: int) -> bool:
        return bool(database.execute("DELETE FROM listings WHERE id=? AND host_id=?", (listing_id, host_id)).rowcount)


host_repository = HostRepository()

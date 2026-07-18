import sqlite3

from backend.app.db.serializers import serialize_listing


class FavoriteRepository:
    def toggle(self, database: sqlite3.Connection, user_id: int, listing_id: int) -> bool:
        exists = database.execute("SELECT 1 FROM favorites WHERE user_id=? AND listing_id=?", (user_id, listing_id)).fetchone()
        if exists:
            database.execute("DELETE FROM favorites WHERE user_id=? AND listing_id=?", (user_id, listing_id))
            return False
        database.execute("INSERT INTO favorites VALUES (?,?)", (user_id, listing_id))
        return True

    def for_user(self, database: sqlite3.Connection, user_id: int) -> list[dict]:
        rows = database.execute("SELECT l.* FROM listings l JOIN favorites f ON f.listing_id=l.id WHERE f.user_id=?", (user_id,)).fetchall()
        return [serialize_listing(row, True) for row in rows]


favorite_repository = FavoriteRepository()

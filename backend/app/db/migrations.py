import sqlite3
from uuid import uuid4


def apply_compatibility_migrations(database: sqlite3.Connection) -> None:
    """Keep existing local SQLite databases compatible with the current schema."""
    listing_columns = _columns(database, "listings")

    user_columns = _columns(database, "users")
    user_additions = {
        "email": "TEXT",
        "email_verified": "INTEGER NOT NULL DEFAULT 0",
        "auth_provider": "TEXT NOT NULL DEFAULT 'demo'",
        "created_at": "TEXT",
        "updated_at": "TEXT",
        "last_login_at": "TEXT",
    }
    for column, definition in user_additions.items():
        if column not in user_columns:
            database.execute(f"ALTER TABLE users ADD COLUMN {column} {definition}")
    database.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    database.execute(
        """UPDATE users SET
        created_at=COALESCE(created_at, CURRENT_TIMESTAMP),
        updated_at=COALESCE(updated_at, CURRENT_TIMESTAMP)"""
    )
    database.execute(
        "UPDATE users SET email='alex@roamly.demo' WHERE id=1 AND email IS NULL"
    )
    if "is_active" not in listing_columns:
        database.execute("ALTER TABLE listings ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")

    booking_columns = _columns(database, "bookings")
    if "booking_uuid" not in booking_columns:
        database.execute("ALTER TABLE bookings ADD COLUMN booking_uuid TEXT")

    bookings_without_uuid = database.execute(
        "SELECT id FROM bookings WHERE booking_uuid IS NULL OR booking_uuid=''"
    ).fetchall()
    database.executemany(
        "UPDATE bookings SET booking_uuid=? WHERE id=?",
        [(str(uuid4()), row["id"]) for row in bookings_without_uuid],
    )
    additions = {
        "price_per_night": "REAL NOT NULL DEFAULT 0",
        "cleaning_fee_snapshot": "REAL NOT NULL DEFAULT 0",
        "service_fee_snapshot": "REAL NOT NULL DEFAULT 0",
        "total_price": "REAL NOT NULL DEFAULT 0",
    }
    for column, definition in additions.items():
        if column not in booking_columns:
            database.execute(f"ALTER TABLE bookings ADD COLUMN {column} {definition}")

    database.execute(
        """UPDATE bookings
        SET price_per_night = COALESCE(
                NULLIF(price_per_night, 0),
                (SELECT price FROM listings WHERE listings.id = bookings.listing_id),
                0
            ),
            cleaning_fee_snapshot = COALESCE(
                NULLIF(cleaning_fee_snapshot, 0),
                (SELECT cleaning_fee FROM listings WHERE listings.id = bookings.listing_id),
                0
            ),
            service_fee_snapshot = COALESCE(
                NULLIF(service_fee_snapshot, 0),
                (SELECT service_fee FROM listings WHERE listings.id = bookings.listing_id),
                0
            ),
            total_price = COALESCE(NULLIF(total_price, 0), total)
        """
    )
    database.execute(
        "CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active, created_at)"
    )
    database.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_uuid ON bookings(booking_uuid)"
    )

    review_columns = _columns(database, "reviews")
    if "booking_id" not in review_columns:
        database.execute("ALTER TABLE reviews ADD COLUMN booking_id INTEGER")
    if "user_id" not in review_columns:
        database.execute("ALTER TABLE reviews ADD COLUMN user_id INTEGER")
    database.execute(
        """CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking
        ON reviews(booking_id) WHERE booking_id IS NOT NULL"""
    )


def _columns(database: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in database.execute(f"PRAGMA table_info({table})").fetchall()}

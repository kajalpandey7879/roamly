SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, avatar TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('guest', 'host')),
  joined_year INTEGER NOT NULL, is_superhost INTEGER NOT NULL DEFAULT 0,
  email TEXT UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0,
  auth_provider TEXT NOT NULL DEFAULT 'demo',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL,
  description TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL,
  property_type TEXT NOT NULL, category TEXT NOT NULL,
  price REAL NOT NULL CHECK(price > 0), cleaning_fee REAL NOT NULL DEFAULT 45,
  service_fee REAL NOT NULL DEFAULT 35, max_guests INTEGER NOT NULL CHECK(max_guests > 0),
  bedrooms INTEGER NOT NULL, beds INTEGER NOT NULL, baths REAL NOT NULL,
  rating REAL NOT NULL DEFAULT 5, review_count INTEGER NOT NULL DEFAULT 0,
  amenities TEXT NOT NULL, images TEXT NOT NULL, latitude REAL NOT NULL,
  longitude REAL NOT NULL, is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_uuid TEXT NOT NULL UNIQUE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  guest_id INTEGER NOT NULL REFERENCES users(id), check_in TEXT NOT NULL,
  check_out TEXT NOT NULL CHECK(check_out > check_in),
  guests INTEGER NOT NULL CHECK(guests > 0), nights INTEGER NOT NULL CHECK(nights > 0),
  price_per_night REAL NOT NULL DEFAULT 0,
  cleaning_fee_snapshot REAL NOT NULL DEFAULT 0,
  service_fee_snapshot REAL NOT NULL DEFAULT 0,
  total_price REAL NOT NULL DEFAULT 0, total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, listing_id)
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  booking_id INTEGER UNIQUE REFERENCES bookings(id),
  user_id INTEGER REFERENCES users(id),
  user_name TEXT NOT NULL, avatar TEXT NOT NULL, rating INTEGER NOT NULL,
  body TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(listing_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_email_codes_lookup ON email_verification_codes(email, created_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, expires_at);
"""

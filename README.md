# Roamly Stays

A full-stack, Airbnb-inspired marketplace for discovering and booking distinctive stays. The project implements the complete guest and host workflow with a Next.js frontend, FastAPI API, and persisted SQLite data.

## Features

- Photo-forward explore grid with destination search, guests, categories, property type, price filtering, and pagination
- Listing galleries, host details, amenities, reviews, location preview, availability, and live price breakdowns
- Transactional booking validation that prevents overlapping reservations and excessive guest counts
- Mock checkout confirmation and persisted My Trips view
- Persisted wishlists
- Host dashboard with listing create, edit, and delete plus reservation and revenue views
- Responsive layouts for phone, tablet, and desktop; toast feedback and complete empty/loading states

## Stack

- Frontend: Next.js 15 App Router, React 19, TypeScript, Lucide icons, React Hot Toast
- Backend: Python 3.12, FastAPI, Pydantic
- Database: SQLite using Python's standard `sqlite3` driver
- Testing: Pytest and FastAPI TestClient

## Run locally

### Backend

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000 --app-dir ..
```

API docs are available at `http://localhost:8000/docs`.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` when the API is hosted anywhere other than `http://localhost:8000`.

## Architecture

The codebase uses feature and responsibility boundaries so UI or business rules can change without editing unrelated layers.

### Backend

```text
backend/app/
  api/routes/       # HTTP endpoints only
  core/             # environment and application configuration
  db/               # connection lifecycle, schema, seed data, serializers
  repositories/     # SQLite queries and persistence operations
  schemas/          # Pydantic request/response contracts
  services/         # booking, listing, favorite, and host business rules
  main.py            # FastAPI application factory
```

Routers translate HTTP input, services enforce business rules, and repositories own SQL. Booking creation uses `BEGIN IMMEDIATE`, rechecks date overlap inside the write transaction, and only then inserts the reservation. This prevents two requests from claiming the same date range.

### Frontend

```text
frontend/
  app/               # thin Next.js route entries and global layout
  features/          # explore, listing, booking, trip, wishlist, host domains
  shared/api/        # HTTP client and normalized API errors
  shared/config/     # runtime configuration
  shared/types/      # cross-feature domain contracts
  shared/ui/         # navigation and reusable application UI
```

Each resource has a typed API module. Pages compose feature components; they do not own transport details. Host form mapping is isolated from dashboard rendering, which makes adding fields or changing API payloads localized.

The UI uses a mocked identity model: Alex (user 1) is the active guest and Maya (user 2) is the active host. Payments are intentionally mocked; reservation confirmation represents a successful checkout.

## Database schema

- `users`: mocked guest/host profiles and Superhost status
- `listings`: property content, pricing, capacity, coordinates, amenities, and image JSON
- `bookings`: listing/guest relation, half-open date range (`check_in` inclusive, `check_out` exclusive), totals, and status
- `favorites`: composite-key user/listing relation
- `reviews`: seeded review content and ratings

Foreign keys enforce ownership relationships. Listing deletion cascades to bookings, favorites, and reviews. `idx_bookings_dates` supports availability checks.

## Tests

```powershell
python -m pytest backend -q
cd frontend
npm run build
```

## Assumptions

- Currency is displayed in USD for the demo.
- A booking's checkout date can equal another booking's check-in date.
- Listing photos are URL based, which satisfies the assignment's URL/upload option without requiring cloud storage.
- Existing seeded dates demonstrate unavailable inventory; all other future dates can be booked.
- Messaging, identity verification, real payments, and live map tiles are intentionally mocked or represented as static UI.

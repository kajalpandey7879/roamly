from datetime import date, timedelta
from fastapi.testclient import TestClient
from .main import app
import pytest

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    monkeypatch.setenv("ROAMLY_DATABASE_PATH", str(tmp_path / "test.db"))


def test_listing_search_and_detail():
    with client:
        response = client.get("/listings?guests=2")
        assert response.status_code == 200
        assert response.json()["total"] >= 8
        detail = client.get("/listings/1").json()
        assert detail["host"]["name"]
        assert len(detail["images"]) >= 5


def test_booking_rejects_overlap():
    with client:
        response = client.post("/bookings", json={"listing_id": 1, "guest_id": 1, "check_in": "2026-08-11", "check_out": "2026-08-13", "guests": 2})
        assert response.status_code == 409


def test_booking_rejects_invalid_guest_count():
    start = date.today() + timedelta(days=400)
    with client:
        response = client.post("/bookings", json={"listing_id": 1, "guest_id": 1, "check_in": start.isoformat(), "check_out": (start + timedelta(days=2)).isoformat(), "guests": 99})
        assert response.status_code == 422


def test_host_listing_crud():
    payload = {
        "title": "Testable garden studio",
        "description": "A deliberately temporary listing used to verify the complete host workflow.",
        "city": "Pune",
        "country": "India",
        "property_type": "Entire apartment",
        "category": "Design",
        "price": 120,
        "max_guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "baths": 1,
        "amenities": ["Wifi", "Kitchen"],
        "images": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    with client:
        created = client.post("/host/listings", json=payload)
        assert created.status_code == 201
        listing_id = created.json()["id"]

        payload["price"] = 135
        updated = client.put(f"/host/listings/{listing_id}", json=payload)
        assert updated.status_code == 200

        deleted = client.delete(f"/host/listings/{listing_id}")
        assert deleted.status_code == 204


def test_search_filters_unavailable_dates_and_amenities():
    with client:
        unavailable = client.get("/listings?check_in=2026-08-11&check_out=2026-08-13")
        assert unavailable.status_code == 200
        assert all(item["id"] != 1 for item in unavailable.json()["items"])

        amenity = client.get("/listings?amenities=Private sauna&min_rating=4.9")
        assert amenity.status_code == 200
        assert [item["city"] for item in amenity.json()["items"]] == ["Rovaniemi"]


def test_search_rejects_same_day_stay():
    with client:
        response = client.get("/listings?check_in=2026-09-01&check_out=2026-09-01")
        assert response.status_code == 422


def test_discovery_collections_have_scrollable_inventory():
    with client:
        goa = client.get("/listings?location=North Goa&page_size=12")
        puducherry = client.get("/listings?location=Puducherry&page_size=12")
        assert goa.status_code == 200
        assert puducherry.status_code == 200
        assert goa.json()["total"] >= 8
        assert puducherry.json()["total"] >= 8

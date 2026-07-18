import json
import hashlib
import sqlite3
from uuid import UUID
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

from fastapi.testclient import TestClient
import pytest

from .main import app
from backend.app.services.email_service import email_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    database_path = tmp_path / "test.db"
    monkeypatch.setenv("ROAMLY_DATABASE_PATH", str(database_path))
    yield database_path


def listing_payload(title: str = "Testable garden studio"):
    return {
        "title": title,
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


def test_configured_database_path_creates_missing_parent(tmp_path, monkeypatch):
    database_path = tmp_path / "persistent-volume" / "stays.db"
    monkeypatch.setenv("ROAMLY_DATABASE_PATH", str(database_path))

    with TestClient(app) as isolated_client:
        response = isolated_client.get("/health")

    assert response.status_code == 200
    assert database_path.exists()


def test_cloudinary_signature_is_generated_without_exposing_secret(monkeypatch):
    monkeypatch.setenv("CLOUDINARY_CLOUD_NAME", "demo-cloud")
    monkeypatch.setenv("CLOUDINARY_API_KEY", "public-key")
    monkeypatch.setenv("CLOUDINARY_API_SECRET", "private-secret")

    with client:
        response = client.get("/uploads/signature")

    payload = response.json()
    expected = hashlib.sha1(
        f"folder={payload['folder']}&timestamp={payload['timestamp']}private-secret".encode()
    ).hexdigest()
    assert response.status_code == 200
    assert payload["configured"] is True
    assert payload["signature"] == expected
    assert "private-secret" not in response.text


def test_email_otp_creates_verified_user_and_revocable_session(monkeypatch, isolated_database):
    delivered: dict[str, str] = {}
    monkeypatch.setattr(
        email_service,
        "send_verification_code",
        lambda recipient, code: delivered.update(recipient=recipient, code=code),
    )

    with client:
        requested = client.post(
            "/auth/email/request-code", json={"email": "Ada.Lovelace@example.com"}
        )
        challenge = requested.json()
        assert requested.status_code == 201
        assert delivered["recipient"] == "ada.lovelace@example.com"
        assert delivered["code"] not in requested.text

        incorrect = client.post(
            "/auth/email/verify",
            json={
                "email": "ada.lovelace@example.com",
                "challenge_id": challenge["challenge_id"],
                "code": "000000" if delivered["code"] != "000000" else "111111",
            },
        )
        assert incorrect.status_code == 422

        verified = client.post(
            "/auth/email/verify",
            json={
                "email": "ada.lovelace@example.com",
                "challenge_id": challenge["challenge_id"],
                "code": delivered["code"],
            },
        )
        assert verified.status_code == 200
        auth = verified.json()
        assert auth["user"]["name"] == "Ada Lovelace"
        assert auth["user"]["email_verified"] == 1
        assert "code" not in auth

        headers = {"Authorization": f"Bearer {auth['access_token']}"}
        assert client.get("/auth/me", headers=headers).status_code == 200
        assert client.post("/auth/logout", headers=headers).status_code == 204
        assert client.get("/auth/me", headers=headers).status_code == 401

    database = sqlite3.connect(isolated_database)
    user = database.execute(
        "SELECT email,email_verified,auth_provider FROM users WHERE email=?",
        ("ada.lovelace@example.com",),
    ).fetchone()
    database.close()
    assert user == ("ada.lovelace@example.com", 1, "email")


def test_email_otp_request_is_rate_limited(monkeypatch):
    monkeypatch.setattr(email_service, "send_verification_code", lambda _recipient, _code: None)
    with client:
        statuses = [
            client.post("/auth/email/request-code", json={"email": "rate@example.com"}).status_code
            for _ in range(4)
        ]
    assert statuses == [201, 201, 201, 429]


def test_listing_search_and_detail():
    with client:
        response = client.get("/listings?guests=2")
        assert response.status_code == 200
        assert response.json()["total"] >= 8
        detail = client.get("/listings/1").json()
        assert detail["host"]["name"]
        assert len(detail["images"]) >= 5


def test_listing_search_filters_to_map_bounds():
    with client:
        all_items = client.get("/listings?page_size=24").json()["items"]
        target = all_items[0]
        bounded = client.get(
            "/listings",
            params={
                "north": target["latitude"] + 0.01,
                "south": target["latitude"] - 0.01,
                "east": target["longitude"] + 0.01,
                "west": target["longitude"] - 0.01,
                "page_size": 24,
            },
        )
        incomplete = client.get("/listings?north=25&south=20")

    assert bounded.status_code == 200
    assert target["id"] in {item["id"] for item in bounded.json()["items"]}
    assert incomplete.status_code == 422


def test_booking_rejects_overlap():
    with client:
        response = client.post("/bookings", json={"listing_id": 1, "guest_id": 1, "check_in": "2026-08-11", "check_out": "2026-08-13", "guests": 2})
        assert response.status_code == 409


def test_confirmed_booking_has_persisted_unique_uuid(isolated_database):
    check_in = date.today() + timedelta(days=250)
    payload = {
        "listing_id": 4,
        "guest_id": 1,
        "check_in": check_in.isoformat(),
        "check_out": (check_in + timedelta(days=2)).isoformat(),
        "guests": 1,
    }
    with client:
        first = client.post("/bookings", json=payload)
        second = client.post(
            "/bookings",
            json=payload
            | {
                "check_in": (check_in + timedelta(days=3)).isoformat(),
                "check_out": (check_in + timedelta(days=5)).isoformat(),
            },
        )

    assert first.status_code == 201
    assert second.status_code == 201
    first_uuid = first.json()["booking_uuid"]
    second_uuid = second.json()["booking_uuid"]
    assert str(UUID(first_uuid)) == first_uuid
    assert first_uuid != second_uuid

    database = sqlite3.connect(isolated_database)
    stored_uuid = database.execute(
        "SELECT booking_uuid FROM bookings WHERE id=?", (first.json()["id"],)
    ).fetchone()[0]
    database.close()
    assert stored_uuid == first_uuid


def test_booking_rejects_invalid_guest_count():
    start = date.today() + timedelta(days=400)
    with client:
        response = client.post("/bookings", json={"listing_id": 1, "guest_id": 1, "check_in": start.isoformat(), "check_out": (start + timedelta(days=2)).isoformat(), "guests": 99})
        assert response.status_code == 422


def test_host_listing_crud():
    payload = listing_payload()
    with client:
        created = client.post("/host/listings", json=payload)
        assert created.status_code == 201
        listing_id = created.json()["id"]

        payload["price"] = 135
        updated = client.put(f"/host/listings/{listing_id}", json=payload)
        assert updated.status_code == 200

        deleted = client.delete(f"/host/listings/{listing_id}")
        assert deleted.status_code == 204


def test_first_listing_promotes_the_same_guest_to_host():
    with client:
        before = client.get("/auth/mock-user?user_id=1")
        assert before.status_code == 200
        assert before.json()["name"] == "Alex Morgan"
        assert before.json()["role"] == "guest"

        created = client.post("/host/listings?host_id=1", json=listing_payload("Alex's first home"))
        assert created.status_code == 201
        assert created.json()["role"] == "host"

        after = client.get("/auth/mock-user?user_id=1")
        assert after.json()["role"] == "host"
        owned = client.get("/host/listings?host_id=1").json()
        assert any(listing["id"] == created.json()["id"] for listing in owned)


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


def test_flexible_month_search_checks_real_availability():
    month_start = (date.today() + timedelta(days=450)).replace(day=1)
    check_in = month_start + timedelta(days=(4 - month_start.weekday()) % 7)
    check_out = check_in + timedelta(days=2)
    with client:
        booking = client.post(
            "/bookings",
            json={
                "listing_id": 4,
                "guest_id": 1,
                "check_in": check_in.isoformat(),
                "check_out": check_out.isoformat(),
                "guests": 1,
            },
        )
        assert booking.status_code == 201

        response = client.get(
            f"/listings?location=Rovaniemi&flex_length=weekend&flex_months={month_start:%Y-%m}"
        )
        assert response.status_code == 200
        assert all(listing["id"] != 4 for listing in response.json()["items"])

        malformed = client.get("/listings?flex_months=not-a-month")
        assert malformed.status_code == 422


def test_discovery_collections_have_scrollable_inventory():
    with client:
        goa = client.get("/listings?location=North Goa&page_size=12")
        puducherry = client.get("/listings?location=Puducherry&page_size=12")
        assert goa.status_code == 200
        assert puducherry.status_code == 200
        assert goa.json()["total"] >= 8
        assert puducherry.json()["total"] >= 8


def test_adjacent_bookings_are_allowed_but_real_overlaps_are_rejected():
    first_check_in = date.today() + timedelta(days=300)
    first_check_out = first_check_in + timedelta(days=3)
    payload = {
        "listing_id": 2,
        "guest_id": 1,
        "check_in": first_check_in.isoformat(),
        "check_out": first_check_out.isoformat(),
        "guests": 2,
    }
    with client:
        assert client.post("/bookings", json=payload).status_code == 201

        starts_at_checkout = payload | {
            "check_in": first_check_out.isoformat(),
            "check_out": (first_check_out + timedelta(days=2)).isoformat(),
        }
        assert client.post("/bookings", json=starts_at_checkout).status_code == 201

        overlap = payload | {
            "check_in": (first_check_in + timedelta(days=1)).isoformat(),
            "check_out": (first_check_out + timedelta(days=1)).isoformat(),
        }
        assert client.post("/bookings", json=overlap).status_code == 409


def test_simultaneous_requests_cannot_double_book():
    check_in = date.today() + timedelta(days=500)
    payload = {
        "listing_id": 3,
        "guest_id": 1,
        "check_in": check_in.isoformat(),
        "check_out": (check_in + timedelta(days=3)).isoformat(),
        "guests": 2,
    }
    with client:
        with ThreadPoolExecutor(max_workers=2) as executor:
            responses = list(executor.map(lambda _: client.post("/bookings", json=payload), range(2)))
    assert sorted(response.status_code for response in responses) == [201, 409]


def test_booking_rejects_past_reversed_and_malformed_dates():
    with client:
        past = date.today() - timedelta(days=1)
        past_response = client.post(
            "/bookings",
            json={
                "listing_id": 1,
                "check_in": past.isoformat(),
                "check_out": date.today().isoformat(),
                "guests": 1,
            },
        )
        assert past_response.status_code == 422

        future = date.today() + timedelta(days=40)
        reversed_response = client.post(
            "/bookings",
            json={
                "listing_id": 1,
                "check_in": future.isoformat(),
                "check_out": future.isoformat(),
                "guests": 1,
            },
        )
        assert reversed_response.status_code == 422

        malformed = client.post(
            "/bookings",
            json={"listing_id": "not-an-id", "check_in": "bad-date", "guests": "many"},
        )
        assert malformed.status_code == 422


def test_booking_price_is_snapshotted(isolated_database):
    check_in = date.today() + timedelta(days=600)
    payload = {
        "listing_id": 1,
        "guest_id": 1,
        "check_in": check_in.isoformat(),
        "check_out": (check_in + timedelta(days=5)).isoformat(),
        "guests": 2,
    }
    with client:
        created = client.post("/bookings", json=payload)
        assert created.status_code == 201
        booking_id = created.json()["id"]

        database = sqlite3.connect(isolated_database)
        snapshot = database.execute(
            """SELECT price_per_night, cleaning_fee_snapshot,
            service_fee_snapshot, total_price, total
            FROM bookings WHERE id=?""",
            (booking_id,),
        ).fetchone()
        database.execute("UPDATE listings SET price=999 WHERE id=1")
        database.commit()
        database.close()

        assert snapshot == (185, 55, 42, 1022, 1022)
        trip = next(item for item in client.get("/trips").json() if item["id"] == booking_id)
        assert trip["total"] == 1022
        assert trip["price_per_night"] == 185


def test_soft_deleted_listing_remains_available_to_past_trips():
    check_in = date.today() + timedelta(days=700)
    with client:
        created = client.post("/host/listings", json=listing_payload("Historic garden studio"))
        listing_id = created.json()["id"]
        booking = client.post(
            "/bookings",
            json={
                "listing_id": listing_id,
                "check_in": check_in.isoformat(),
                "check_out": (check_in + timedelta(days=2)).isoformat(),
                "guests": 1,
            },
        )
        assert booking.status_code == 201

        assert client.delete(f"/host/listings/{listing_id}").status_code == 204
        search = client.get("/listings?location=Pune").json()
        assert all(item["id"] != listing_id for item in search["items"])
        assert client.get(f"/listings/{listing_id}").status_code == 200
        assert any(item["listing_id"] == listing_id for item in client.get("/trips").json())


def test_review_rating_is_aggregated_from_review_rows(isolated_database):
    with client:
        database = sqlite3.connect(isolated_database)
        database.execute("DELETE FROM reviews WHERE listing_id=1")
        database.executemany(
            """INSERT INTO reviews(
                listing_id,user_name,avatar,rating,body,created_at
            ) VALUES (1,?,?,?,?,?)""",
            [
                ("One", "https://i.pravatar.cc/80?img=1", 4, "Good stay", "2026-01-01"),
                ("Two", "https://i.pravatar.cc/80?img=2", 5, "Great stay", "2026-01-02"),
            ],
        )
        database.execute("UPDATE listings SET rating=1, review_count=999 WHERE id=1")
        database.commit()
        database.close()

        detail = client.get("/listings/1").json()
        assert detail["rating"] == 4.5
        assert detail["review_count"] == 2


def test_completed_stay_can_be_reviewed_once_and_updates_aggregates():
    with client:
        completed_trip = next(
            trip
            for trip in client.get("/trips?user_id=1").json()
            if date.fromisoformat(trip["check_out"]) < date.today() and not trip["review_id"]
        )
        before = client.get(f"/listings/{completed_trip['listing_id']}").json()

        created = client.post(
            f"/bookings/{completed_trip['booking_uuid']}/review?user_id=1",
            json={"rating": 5, "body": "A beautiful completed stay with a thoughtful host."},
        )
        duplicate = client.post(
            f"/bookings/{completed_trip['booking_uuid']}/review?user_id=1",
            json={"rating": 4, "body": "Trying to review the same reservation twice."},
        )
        after = client.get(f"/listings/{completed_trip['listing_id']}").json()
        reviewed_trip = next(
            trip for trip in client.get("/trips?user_id=1").json() if trip["id"] == completed_trip["id"]
        )

    assert created.status_code == 201
    assert duplicate.status_code == 409
    assert after["review_count"] == before["review_count"] + 1
    assert reviewed_trip["review_id"] == created.json()["id"]


def test_future_stay_cannot_be_reviewed():
    with client:
        future_trip = next(
            trip
            for trip in client.get("/trips?user_id=1").json()
            if date.fromisoformat(trip["check_out"]) >= date.today()
        )
        response = client.post(
            f"/bookings/{future_trip['booking_uuid']}/review?user_id=1",
            json={"rating": 5, "body": "This review should not be accepted before checkout."},
        )

    assert response.status_code == 422


def test_search_pagination_is_stable_when_a_listing_is_added():
    with client:
        first_page = client.get("/listings?page=1&page_size=8").json()["items"]
        second_page = client.get("/listings?page=2&page_size=8").json()["items"]
        client.post("/host/listings", json=listing_payload("Newest stable pagination home"))
        second_page_after_insert = client.get("/listings?page=2&page_size=8").json()["items"]

    assert {item["id"] for item in first_page}.isdisjoint(item["id"] for item in second_page)
    assert [item["id"] for item in second_page_after_insert] == [item["id"] for item in second_page]


def test_listing_fields_are_read_directly_from_database(isolated_database):
    with client:
        database = sqlite3.connect(isolated_database)
        database.execute(
            """UPDATE listings
            SET title=?, price=?, images=?, amenities=?
            WHERE id=1""",
            (
                "Database-driven title",
                333,
                json.dumps(["https://images.unsplash.com/dynamic-image.jpg"]),
                json.dumps(["Wifi", "Pool", "Kitchen"]),
            ),
        )
        database.commit()
        database.close()

        detail = client.get("/listings/1").json()
        assert detail["title"] == "Database-driven title"
        assert detail["price"] == 333
        assert detail["images"] == ["https://images.unsplash.com/dynamic-image.jpg"]
        assert detail["amenities"] == ["Wifi", "Pool", "Kitchen"]

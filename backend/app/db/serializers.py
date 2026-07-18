import json
import sqlite3
from typing import Any


def serialize_listing(row: sqlite3.Row, is_favorite: bool | None = None) -> dict[str, Any]:
    listing = dict(row)
    computed_rating = listing.pop("computed_rating", None)
    computed_review_count = listing.pop("computed_review_count", None)
    if computed_rating is not None:
        listing["rating"] = round(float(computed_rating), 2)
    if computed_review_count is not None:
        listing["review_count"] = int(computed_review_count)
    listing["amenities"] = json.loads(listing["amenities"])
    listing["images"] = json.loads(listing["images"])
    favorite = listing.pop("favorite", is_favorite or False)
    listing["is_favorite"] = bool(favorite)
    return listing


def serialize_listing_payload(payload: dict[str, Any]) -> dict[str, Any]:
    values = payload.copy()
    values["amenities"] = json.dumps(values["amenities"])
    values["images"] = json.dumps(values["images"])
    return values

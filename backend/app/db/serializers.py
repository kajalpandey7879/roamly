import json
import sqlite3
from typing import Any


def serialize_listing(row: sqlite3.Row, is_favorite: bool | None = None) -> dict[str, Any]:
    listing = dict(row)
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

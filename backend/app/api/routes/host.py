from fastapi import APIRouter, Response

from backend.app.core.config import settings
from backend.app.schemas.listing import ListingCreate
from backend.app.services.host_service import host_service

router = APIRouter(prefix="/host", tags=["host"])


@router.get("/listings")
def get_host_listings(host_id: int = settings.active_host_id):
    return host_service.listings(host_id)


@router.get("/bookings")
def get_host_bookings(host_id: int = settings.active_host_id):
    return host_service.bookings(host_id)


@router.post("/listings", status_code=201)
def create_listing(payload: ListingCreate, host_id: int = settings.active_host_id):
    return host_service.create(host_id, payload)


@router.put("/listings/{listing_id}")
def update_listing(listing_id: int, payload: ListingCreate, host_id: int = settings.active_host_id):
    return host_service.update(listing_id, host_id, payload)


@router.delete("/listings/{listing_id}", status_code=204)
def delete_listing(listing_id: int, host_id: int = settings.active_host_id):
    host_service.delete(listing_id, host_id)
    return Response(status_code=204)

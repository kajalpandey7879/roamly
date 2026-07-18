from fastapi import APIRouter

from backend.app.api.routes import bookings, favorites, health, host, listings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(listings.router)
api_router.include_router(bookings.router)
api_router.include_router(favorites.router)
api_router.include_router(host.router)

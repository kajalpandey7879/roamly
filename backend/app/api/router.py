from fastapi import APIRouter

from backend.app.api.routes import auth, bookings, favorites, health, host, listings, reviews, uploads

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(listings.router)
api_router.include_router(bookings.router)
api_router.include_router(favorites.router)
api_router.include_router(host.router)
api_router.include_router(reviews.router)
api_router.include_router(uploads.router)

from backend.app.db import connection, transaction
from backend.app.repositories.favorite_repository import favorite_repository


class FavoriteService:
    def toggle(self, user_id: int, listing_id: int) -> dict:
        with transaction() as database:
            active = favorite_repository.toggle(database, user_id, listing_id)
        return {"is_favorite": active}

    def list(self, user_id: int) -> list[dict]:
        with connection() as database:
            return favorite_repository.for_user(database, user_id)


favorite_service = FavoriteService()

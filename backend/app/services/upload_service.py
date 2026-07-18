import hashlib
import time

from backend.app.core.config import settings


class UploadService:
    folder = "roamly/listings"

    def signature(self) -> dict:
        configured = all(
            (
                settings.cloudinary_cloud_name,
                settings.cloudinary_api_key,
                settings.cloudinary_api_secret,
            )
        )
        if not configured:
            return {"configured": False}

        timestamp = int(time.time())
        signed_value = f"folder={self.folder}&timestamp={timestamp}{settings.cloudinary_api_secret}"
        signature = hashlib.sha1(signed_value.encode("utf-8")).hexdigest()
        return {
            "configured": True,
            "cloud_name": settings.cloudinary_cloud_name,
            "api_key": settings.cloudinary_api_key,
            "timestamp": timestamp,
            "folder": self.folder,
            "signature": signature,
        }


upload_service = UploadService()

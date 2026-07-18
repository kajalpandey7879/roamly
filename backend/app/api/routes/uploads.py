from fastapi import APIRouter

from backend.app.services.upload_service import upload_service

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.get("/signature")
def get_upload_signature():
    return upload_service.signature()

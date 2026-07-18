from fastapi import APIRouter, Header, HTTPException, Response

from backend.app.core.config import settings
from backend.app.schemas.auth import (
    AuthResult,
    EmailCodeChallenge,
    EmailCodeRequest,
    EmailCodeVerify,
    MockUser,
)
from backend.app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/mock-user", response_model=MockUser)
def get_mock_user(user_id: int = settings.active_guest_id):
    return auth_service.mock_user(user_id)


@router.post("/email/request-code", response_model=EmailCodeChallenge, status_code=201)
def request_email_code(payload: EmailCodeRequest):
    return auth_service.request_email_code(payload)


@router.post("/email/verify", response_model=AuthResult)
def verify_email_code(payload: EmailCodeVerify):
    return auth_service.verify_email_code(payload)


@router.get("/me", response_model=MockUser)
def authenticated_user(authorization: str | None = Header(None)):
    return auth_service.authenticated_user(_bearer_token(authorization))


@router.post("/logout", status_code=204)
def logout(authorization: str | None = Header(None)):
    auth_service.logout(_bearer_token(authorization))
    return Response(status_code=204)


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication is required")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication is required")
    return token

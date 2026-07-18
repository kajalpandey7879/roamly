import hashlib
import hmac
import re
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import quote_plus
from uuid import uuid4

from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.db import connection, transaction
from backend.app.repositories.auth_repository import auth_repository
from backend.app.schemas.auth import EmailCodeRequest, EmailCodeVerify
from backend.app.services.email_service import EmailDeliveryError, email_service


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
OTP_LIFETIME = timedelta(minutes=10)
SESSION_LIFETIME = timedelta(days=30)


class AuthService:
    def mock_user(self, user_id: int) -> dict:
        with connection() as database:
            user = auth_repository.get_user(database, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Mock user not found")
        return dict(user)

    def request_email_code(self, payload: EmailCodeRequest) -> dict:
        email = self._normalize_email(payload.email)
        now = datetime.now(UTC)
        challenge_id = str(uuid4())
        code = f"{secrets.randbelow(1_000_000):06d}"
        expires_at = now + OTP_LIFETIME
        with transaction() as database:
            if auth_repository.recent_code_count(
                database, email, (now - timedelta(minutes=10)).isoformat()
            ) >= 3:
                raise HTTPException(
                    status_code=429,
                    detail="Too many verification codes requested. Try again in 10 minutes.",
                )
            auth_repository.create_challenge(
                database,
                challenge_id,
                email,
                self._otp_hash(email, code),
                expires_at.isoformat(),
            )
        try:
            email_service.send_verification_code(email, code)
        except EmailDeliveryError as error:
            with transaction() as database:
                auth_repository.delete_challenge(database, challenge_id)
            raise HTTPException(status_code=503, detail=str(error)) from error
        return {
            "challenge_id": challenge_id,
            "expires_in": int(OTP_LIFETIME.total_seconds()),
            "delivery_hint": self._mask_email(email),
        }

    def verify_email_code(self, payload: EmailCodeVerify) -> dict:
        email = self._normalize_email(payload.email)
        now = datetime.now(UTC)
        failure: HTTPException | None = None
        result: dict | None = None
        with transaction() as database:
            challenge = auth_repository.get_challenge(database, payload.challenge_id, email)
            if not challenge or challenge["consumed_at"]:
                raise HTTPException(status_code=422, detail="This verification code is invalid")
            if datetime.fromisoformat(challenge["expires_at"]) <= now:
                raise HTTPException(status_code=422, detail="This verification code has expired")
            if challenge["attempts"] >= challenge["max_attempts"]:
                raise HTTPException(
                    status_code=429, detail="Too many incorrect attempts. Request a new code."
                )
            auth_repository.record_attempt(database, payload.challenge_id)
            if not hmac.compare_digest(
                challenge["code_hash"], self._otp_hash(email, payload.code)
            ):
                failure = HTTPException(status_code=422, detail="The verification code is incorrect")
            else:
                auth_repository.consume_challenge(database, payload.challenge_id, now.isoformat())
                user = auth_repository.get_user_by_email(database, email)
                if user:
                    user_id = user["id"]
                    auth_repository.mark_email_login(database, user_id)
                else:
                    name = self._name_from_email(email)
                    user_id = auth_repository.create_email_user(
                        database,
                        email,
                        name,
                        "https://ui-avatars.com/api/"
                        f"?name={quote_plus(name)}&background=E51D55&color=fff",
                        now.year,
                    )
                token = secrets.token_urlsafe(32)
                auth_repository.create_session(
                    database,
                    user_id,
                    self._token_hash(token),
                    (now + SESSION_LIFETIME).isoformat(),
                )
                result = {
                    "user": dict(auth_repository.get_user(database, user_id)),
                    "access_token": token,
                    "token_type": "bearer",
                    "expires_in": int(SESSION_LIFETIME.total_seconds()),
                }
        if failure:
            raise failure
        if not result:
            raise HTTPException(status_code=500, detail="Could not create the user session")
        return result

    def authenticated_user(self, token: str) -> dict:
        with connection() as database:
            user = auth_repository.user_for_session(
                database, self._token_hash(token), datetime.now(UTC).isoformat()
            )
        if not user:
            raise HTTPException(status_code=401, detail="Your session is invalid or expired")
        return dict(user)

    def logout(self, token: str) -> None:
        with transaction() as database:
            auth_repository.revoke_session(
                database, self._token_hash(token), datetime.now(UTC).isoformat()
            )

    @staticmethod
    def _normalize_email(value: str) -> str:
        email = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(email):
            raise HTTPException(status_code=422, detail="Enter a valid email address")
        return email

    @staticmethod
    def _name_from_email(email: str) -> str:
        local_part = re.sub(r"[._-]+", " ", email.split("@", 1)[0]).strip()
        return local_part.title() or "Roamly Guest"

    @staticmethod
    def _mask_email(email: str) -> str:
        local, domain = email.split("@", 1)
        return f"{local[:2]}{'*' * max(2, len(local) - 2)}@{domain}"

    @staticmethod
    def _otp_hash(email: str, code: str) -> str:
        return hmac.new(
            settings.auth_otp_secret.encode(),
            f"{email}:{code}".encode(),
            hashlib.sha256,
        ).hexdigest()

    @staticmethod
    def _token_hash(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()


auth_service = AuthService()

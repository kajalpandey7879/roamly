from typing import Literal

from pydantic import BaseModel, Field


class MockUser(BaseModel):
    id: int
    name: str
    avatar: str
    role: Literal["guest", "host"]
    joined_year: int
    is_superhost: int
    email: str | None = None
    email_verified: int = 0
    auth_provider: str = "demo"


class EmailCodeRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)


class EmailCodeChallenge(BaseModel):
    challenge_id: str
    expires_in: int
    delivery_hint: str


class EmailCodeVerify(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    challenge_id: str = Field(min_length=20, max_length=100)
    code: str = Field(pattern=r"^\d{6}$")


class AuthResult(BaseModel):
    user: MockUser
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int

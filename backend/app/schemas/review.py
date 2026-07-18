from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str = Field(min_length=10, max_length=1000)


class ReviewResult(BaseModel):
    id: int
    booking_id: int
    listing_id: int
    user_id: int
    user_name: str
    avatar: str
    rating: int
    body: str
    created_at: str
    listing_rating: float
    listing_review_count: int
    host_is_superhost: int

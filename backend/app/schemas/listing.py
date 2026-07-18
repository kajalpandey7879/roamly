from dataclasses import dataclass

from pydantic import BaseModel, Field


@dataclass(frozen=True)
class ListingFilters:
    location: str = ""
    category: str = ""
    property_type: str = ""
    min_price: float = 0
    max_price: float = 10_000
    guests: int = 1
    page: int = 1
    page_size: int = 8


class ListingCreate(BaseModel):
    title: str = Field(min_length=5)
    description: str = Field(min_length=20)
    city: str
    country: str
    property_type: str
    category: str = "Design"
    price: float = Field(gt=0)
    max_guests: int = Field(gt=0)
    bedrooms: int = Field(ge=0)
    beds: int = Field(ge=1)
    baths: float = Field(gt=0)
    amenities: list[str]
    images: list[str] = Field(min_length=1)
    latitude: float = 0
    longitude: float = 0

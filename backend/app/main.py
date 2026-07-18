from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.router import api_router
from backend.app.core.config import settings
from backend.app.db.seed import initialize_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


def create_app() -> FastAPI:
    application = FastAPI(title=settings.app_name, version=settings.api_version, lifespan=lifespan)
    application.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
    application.include_router(api_router)
    return application


app = create_app()

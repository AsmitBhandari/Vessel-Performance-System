import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text

from app.database.connection import engine
from app.api.health import router as health_router
from app.api.upload import router as upload_router
from app.api.parser import router as parser_router
from app.api.ingestion import router as ingestion_router
from app.api.reports import router as reports_router
from app.api.analytics import router as analytics_router
from app.api.routes import router as routes_router
from app.api.route_planner import router as route_planner_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: verify database connection on startup."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection verified")
    except Exception as e:
        print(f"Database connection failed: {e}")
        print("  The application will start, but database features will be unavailable.")
    yield


app = FastAPI(
    title="Vessel Optimization Tool API",
    version="1.0.0",
    description="Backend API for Vessel Optimization Tool",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "https://vessel-frontend-8feo.onrender.com/").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(upload_router)
app.include_router(parser_router)
app.include_router(ingestion_router)
app.include_router(reports_router)
app.include_router(analytics_router)
app.include_router(routes_router)
app.include_router(route_planner_router)


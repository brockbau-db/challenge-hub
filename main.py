from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routes import challenges, events, gameplay, teams

app = FastAPI(
    title="Challenge Hub",
    description="Gamification platform for Databricks learning competitions",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


app.include_router(challenges.router)
app.include_router(events.router)
app.include_router(gameplay.router)
app.include_router(teams.router)

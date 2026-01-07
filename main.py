from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

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


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

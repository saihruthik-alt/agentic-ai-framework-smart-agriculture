from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    init_db()
    yield
    # Shutdown tasks (if any)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Agriculture Agentic AI Orchestrator API"}

@app.get(f"{settings.API_V1_STR}/health")
def health_check(db: Session = Depends(get_db)):
    status = {
        "status": "UP",
        "service": "backend-ai",
        "database": "UNKNOWN",
        "redis": "UNKNOWN"
    }
    
    # Test DB
    try:
        db.execute(text("SELECT 1"))
        status["database"] = "UP"
    except Exception as e:
        status["database"] = f"DOWN ({str(e)})"
        status["status"] = "DEGRADED"

    # Test Redis
    try:
        r = redis.from_url(settings.REDIS_URL, socket_timeout=3)
        if r.ping():
            status["redis"] = "UP"
        else:
            status["redis"] = "DOWN"
            status["status"] = "DEGRADED"
    except Exception as e:
        status["redis"] = f"DOWN ({str(e)})"
        status["status"] = "DEGRADED"
        
    return status

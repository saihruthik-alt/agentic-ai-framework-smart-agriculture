from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, get_db
from app.api.websocket import router as ws_router
from app.api.disease import router as cv_router
from app.api.rag import router as rag_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    init_db()
    
    # Auto-ingest manuals on startup for local SQLite development
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.rag.vector_service import ingest_crop_manuals
        ingest_crop_manuals(db)
    except Exception as e:
        print(f"Startup manuals ingestion failed: {e}")
    finally:
        db.close()
        
    yield
    # Shutdown tasks (if any)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Register routers
app.include_router(ws_router, prefix=settings.API_V1_STR)
app.include_router(cv_router, prefix=settings.API_V1_STR)
app.include_router(rag_router, prefix=settings.API_V1_STR)

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

# Pydantic schemas for Carbon & Yield models
from pydantic import BaseModel

class CarbonEstimateRequest(BaseModel):
    pump_hours: float
    nitrogen_fertilizer_bags: float
    diesel_liters: float

class YieldPredictionRequest(BaseModel):
    crop_name: str
    rainfall_mm: float
    temperature_c: float
    avg_moisture: float
    hectares: float

@app.post(f"{settings.API_V1_STR}/carbon-estimator")
def estimate_carbon_footprint(req: CarbonEstimateRequest):
    from app.services.models import estimate_carbon
    return estimate_carbon(req.pump_hours, req.nitrogen_fertilizer_bags, req.diesel_liters)

@app.post(f"{settings.API_V1_STR}/yield-predictor")
def predict_crop_yield(req: YieldPredictionRequest):
    from app.services.models import predict_yield
    return predict_yield(req.crop_name, req.rainfall_mm, req.temperature_c, req.avg_moisture, req.hectares)

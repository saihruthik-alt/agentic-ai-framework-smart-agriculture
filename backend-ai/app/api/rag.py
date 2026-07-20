from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.rag.vector_service import ingest_crop_manuals, search_crop_manuals
from pydantic import BaseModel

router = APIRouter()

class SearchRequest(BaseModel):
    crop: str
    query: str
    limit: int = 2

@router.post("/rag/ingest")
def trigger_ingestion(db: Session = Depends(get_db)):
    result = ingest_crop_manuals(db)
    return result

@router.post("/rag/search")
def search_manuals(req: SearchRequest, db: Session = Depends(get_db)):
    results = search_crop_manuals(db, req.crop, req.query, req.limit)
    return {"crop": req.crop, "query": req.query, "results": results}

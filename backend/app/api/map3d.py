from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.database.session import get_db
from app.services.map3d_generator import map3d_service

router = APIRouter(prefix="/map3d", tags=["AI 3D Map Generation"])

class Map3DGenerateRequest(BaseModel):
    min_lat: float
    min_lng: float
    max_lat: float
    max_lng: float
    force_regenerate: Optional[bool] = False

@router.post("/generate")
def generate_3d_environment(
    payload: Map3DGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generates or retrieves cached 3D digital twin for the given map viewport,
    extracting real roads, flyovers, and building footprints, while seamlessly
    attaching registered cadastral buildings with their vertical floor alignments.
    """
    return map3d_service.generate_or_get_cached(
        min_lat=payload.min_lat,
        min_lng=payload.min_lng,
        max_lat=payload.max_lat,
        max_lng=payload.max_lng,
        db=db,
        force_regenerate=payload.force_regenerate or False
    )

@router.get("/cached-regions")
def get_cached_regions():
    """Returns a list of all persistently stored 3D regions in the database cache."""
    return map3d_service.list_cached_regions()

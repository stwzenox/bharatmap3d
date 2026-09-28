from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.entities import Floor, VerticalParcel
from app.schemas.pydantic_models import FloorResponse, VerticalParcelResponse

router = APIRouter(tags=["Floors & Vertical Parcels"])

@router.get("/floors", response_model=List[FloorResponse])
def get_all_floors(building_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Floor)
    if building_id:
        query = query.filter(Floor.building_id == building_id)
    return query.order_by(Floor.floor_number).all()

@router.get("/floors/{floor_id}", response_model=FloorResponse)
def get_floor(floor_id: str, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.floor_id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail=f"Floor {floor_id} not found")
    return floor

@router.get("/vertical-properties", response_model=List[VerticalParcelResponse])
def get_vertical_properties(
    building_id: Optional[str] = Query(None),
    floor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(VerticalParcel)
    if building_id:
        query = query.filter(VerticalParcel.building_id == building_id)
    if floor_id:
        query = query.filter(VerticalParcel.floor_id == floor_id)
    return query.all()

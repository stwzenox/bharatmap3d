from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.entities import Property, VerticalParcel
from app.schemas.pydantic_models import PropertyResponse

router = APIRouter(prefix="/properties", tags=["Properties"])

@router.get("", response_model=List[PropertyResponse])
def get_properties(
    ulpin: Optional[str] = Query(None),
    vertical_parcel_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Property)
    if ulpin:
        query = query.filter(Property.ulpin.ilike(f"%{ulpin}%"))
    if vertical_parcel_id:
        query = query.filter(Property.vertical_parcel_id == vertical_parcel_id)
    return query.all()

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.property_id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail=f"Property {property_id} not found")
    return prop

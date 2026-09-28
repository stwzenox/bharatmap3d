from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Property, VerticalParcel, Floor, Building, Parcel
from app.schemas.pydantic_models import UlpinGenerateRequest, UlpinGenerateResponse
from app.ulpin.generator import ulpin_generator

router = APIRouter(prefix="/ulpin", tags=["ULPIN"])

@router.get("/{ulpin}")
def search_ulpin(ulpin: str, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.ulpin == ulpin).first()
    if not prop:
        # Also try partial matching or checking by property_id / building_id / parcel_id
        prop = db.query(Property).filter(Property.property_id == ulpin).first()
        
    if not prop:
        raise HTTPException(status_code=404, detail=f"ULPIN '{ulpin}' not found")
        
    vert = db.query(VerticalParcel).filter(VerticalParcel.vertical_parcel_id == prop.vertical_parcel_id).first()
    building = db.query(Building).filter(Building.building_id == vert.building_id).first() if vert else None
    parcel = db.query(Parcel).filter(Parcel.parcel_id == vert.parcel_id).first() if vert else None
    floor = db.query(Floor).filter(Floor.floor_id == vert.floor_id).first() if vert else None
    
    return {
        "ulpin": prop.ulpin,
        "property_id": prop.property_id,
        "owner_name": prop.owner_name,
        "property_type": prop.property_type,
        "status": prop.status,
        "verification_status": prop.verification_status,
        "vertical_parcel": {
            "vertical_parcel_id": vert.vertical_parcel_id if vert else None,
            "z_min": vert.z_min if vert else None,
            "z_max": vert.z_max if vert else None,
            "area": vert.area if vert else None,
            "volume": vert.volume if vert else None,
            "geometry": vert.geometry if vert else None,
        } if vert else None,
        "building": {
            "building_id": building.building_id,
            "building_type": building.building_type,
            "height": building.height,
            "ground_elevation": building.ground_elevation
        } if building else None,
        "parcel": {
            "parcel_id": parcel.parcel_id,
            "survey_number": parcel.survey_number,
            "land_use": parcel.land_use
        } if parcel else None,
        "floor": {
            "floor_id": floor.floor_id,
            "floor_number": floor.floor_number
        } if floor else None
    }

@router.post("/generate", response_model=UlpinGenerateResponse)
def generate_ulpin(payload: UlpinGenerateRequest, db: Session = Depends(get_db)):
    ulpin_str, is_unique, msg = ulpin_generator.generate_and_verify(
        db,
        building_id=payload.building_id,
        floor_id=payload.floor_id,
        property_id=payload.property_id
    )

    if not is_unique:
        return UlpinGenerateResponse(
            ulpin=ulpin_str,
            property_id=payload.property_id,
            vertical_parcel_id=f"{payload.floor_id}-{payload.property_id}",
            message=msg,
            created=False
        )

    # Check or create vertical parcel
    vp_id = f"{payload.floor_id}-{payload.property_id}"
    vert = db.query(VerticalParcel).filter(VerticalParcel.vertical_parcel_id == vp_id).first()
    
    if not vert:
        floor = db.query(Floor).filter(Floor.floor_id == payload.floor_id).first()
        building = db.query(Building).filter(Building.building_id == payload.building_id).first()
        if not floor or not building:
            raise HTTPException(status_code=400, detail="Invalid building_id or floor_id provided")
            
        vert = VerticalParcel(
            vertical_parcel_id=vp_id,
            parcel_id=building.parcel_id,
            building_id=building.building_id,
            floor_id=floor.floor_id,
            geometry=floor.geometry,
            z_min=floor.z_min,
            z_max=floor.z_max,
            area=floor.area,
            volume=floor.area * (floor.z_max - floor.z_min),
            property_type=payload.property_type or "Residential Unit"
        )
        db.add(vert)
        db.flush()

    # Create Property record
    new_prop = Property(
        property_id=f"PROP-{payload.property_id}",
        ulpin=ulpin_str,
        vertical_parcel_id=vp_id,
        owner_name=payload.owner_name or "Govt Allocated Citizen",
        property_type=payload.property_type or "Residential Unit",
        status="Registered",
        verification_status="Verified Cadastral Record"
    )
    db.add(new_prop)
    db.commit()

    return UlpinGenerateResponse(
        ulpin=ulpin_str,
        property_id=new_prop.property_id,
        vertical_parcel_id=vp_id,
        message=f"Successfully generated and assigned 3D ULPIN: {ulpin_str}",
        created=True
    )

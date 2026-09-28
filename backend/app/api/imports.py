import io
import csv
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any
from shapely.geometry import shape
from app.database.session import get_db
from app.models.entities import Parcel, Building, Floor, VerticalParcel, Property
from app.geospatial.terrain import terrain_service
from app.ulpin.generator import ulpin_generator

router = APIRouter(prefix="/import", tags=["Data Import"])

@router.post("/geojson")
async def import_geojson(
    file: UploadFile = File(...),
    layer_type: str = Form("parcel"),  # "parcel" or "building"
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        data = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON file: {str(e)}")

    features = []
    if data.get("type") == "FeatureCollection":
        features = data.get("features", [])
    elif data.get("type") == "Feature":
        features = [data]
    else:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid GeoJSON FeatureCollection or Feature")

    imported_count = 0
    errors = []

    for idx, feat in enumerate(features):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        if not geom:
            errors.append(f"Feature #{idx}: Missing geometry")
            continue

        try:
            poly = shape(geom)
            calc_area = round(poly.area * 111319.9 * 111319.9, 2) if poly.area < 1.0 else round(poly.area, 2)
        except Exception as e:
            errors.append(f"Feature #{idx}: Invalid polygon ({str(e)})")
            continue

        if layer_type.lower() == "parcel":
            pid = props.get("parcel_id") or f"P-IMP-{idx + 100:03d}"
            survey = props.get("survey_number") or f"SURV-IMP-{idx + 100}"
            use = props.get("land_use") or "Imported Land Use"
            
            existing = db.query(Parcel).filter(Parcel.parcel_id == pid).first()
            if existing:
                existing.geometry = geom
                existing.area = calc_area
                existing.land_use = use
                existing.survey_number = survey
            else:
                p = Parcel(
                    parcel_id=pid,
                    geometry=geom,
                    area=calc_area,
                    land_use=use,
                    survey_number=survey,
                    status="Imported"
                )
                db.add(p)
            imported_count += 1

        elif layer_type.lower() == "building":
            bid = props.get("building_id") or f"B-IMP-{idx + 100:03d}"
            pid = props.get("parcel_id") or "P001"
            h = float(props.get("height", 15.0))
            floors = int(props.get("floor_count", 5))
            btype = props.get("building_type", "Imported Structure")
            
            # Ground elevation from terrain
            cx, cz = poly.centroid.x, poly.centroid.y
            ground_elev = terrain_service.get_elevation_at(0, 0)
            roof_elev = ground_elev + h

            existing = db.query(Building).filter(Building.building_id == bid).first()
            if existing:
                existing.geometry = geom
                existing.parcel_id = pid
                existing.height = h
                existing.floor_count = floors
                existing.ground_elevation = ground_elev
                existing.roof_elevation = roof_elev
                existing.building_type = btype
            else:
                b = Building(
                    building_id=bid,
                    parcel_id=pid,
                    geometry=geom,
                    ground_elevation=ground_elev,
                    roof_elevation=roof_elev,
                    height=h,
                    floor_count=floors,
                    building_type=btype
                )
                db.add(b)
            imported_count += 1

    db.commit()

    return {
        "success": True,
        "imported_features": imported_count,
        "layer_type": layer_type,
        "errors": errors
    }

@router.post("/building-heights")
async def import_building_heights(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts CSV: building_id,height,floors
    Updates matching building heights and regenerates floor divisions.
    """
    try:
        content = await file.read()
        stream = io.StringIO(content.decode("utf-8"))
        reader = csv.DictReader(stream)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")

    updated_count = 0
    for row in reader:
        bid = row.get("building_id", "").strip()
        if not bid:
            continue
        try:
            h = float(row.get("height", 15.0))
            fc = int(row.get("floors", 5))
        except ValueError:
            continue

        bldg = db.query(Building).filter(Building.building_id == bid).first()
        if bldg:
            bldg.height = h
            bldg.floor_count = fc
            bldg.roof_elevation = round(bldg.ground_elevation + h, 2)
            
            # Update or regenerate floors
            db.query(Floor).filter(Floor.building_id == bid).delete()
            floor_h = h / fc
            for i in range(fc):
                f_num = i + 1
                fl_id = f"{bid}-F{f_num:02d}"
                z_min = round(bldg.ground_elevation + i * floor_h, 2)
                z_max = round(bldg.ground_elevation + (i + 1) * floor_h, 2)
                new_fl = Floor(
                    floor_id=fl_id,
                    building_id=bid,
                    floor_number=f_num,
                    z_min=z_min,
                    z_max=z_max,
                    area=1000.0,
                    geometry=bldg.geometry
                )
                db.add(new_fl)
            updated_count += 1

    db.commit()
    return {
        "success": True,
        "updated_buildings": updated_count,
        "message": f"Updated height & floor parameters for {updated_count} buildings."
    }

@router.post("/dem")
async def import_dem_csv(file: UploadFile = File(...)):
    """
    Accepts CSV: x,z,elevation
    """
    try:
        content = await file.read()
        stream = io.StringIO(content.decode("utf-8"))
        reader = csv.DictReader(stream)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read DEM CSV: {str(e)}")

    points = []
    for row in reader:
        try:
            points.append({
                "x": float(row.get("x", 0)),
                "z": float(row.get("z", row.get("y", 0))),
                "elevation": float(row.get("elevation", 100))
            })
        except ValueError:
            continue

    return {
        "success": True,
        "points_received": len(points),
        "message": f"Successfully parsed {len(points)} DEM elevation points."
    }

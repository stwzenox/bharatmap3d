from typing import List, Dict, Any
from sqlalchemy.orm import Session
from shapely.geometry import shape, Polygon, MultiPolygon
from app.models.entities import Parcel, Building, Floor, VerticalParcel, Property, ValidationResult

class TopologyValidator:
    """
    Cadastral and Vertical Topology Validation Engine.
    Evaluates 2D planar consistency, 3D vertical stacking, and database uniqueness.
    """

    def run_all_validations(self, db: Session) -> List[Dict[str, Any]]:
        # Clear previous validation run
        db.query(ValidationResult).delete()
        results: List[ValidationResult] = []

        parcels = db.query(Parcel).all()
        buildings = db.query(Building).all()
        floors = db.query(Floor).all()
        vert_parcels = db.query(VerticalParcel).all()
        properties = db.query(Property).all()

        # 1. Parcel Polygon Validity & Self-Intersection Check
        parcel_shapes: Dict[str, Any] = {}
        seen_surveys = set()
        for p in parcels:
            # Check duplicate survey number
            if p.survey_number in seen_surveys:
                results.append(ValidationResult(
                    object_id=p.parcel_id,
                    object_type="Parcel",
                    validation_type="DuplicateSurveyNumber",
                    severity="WARNING",
                    message=f"Duplicate survey number '{p.survey_number}' detected in Parcel {p.parcel_id}."
                ))
            seen_surveys.add(p.survey_number)

            try:
                poly = shape(p.geometry)
                if not poly.is_valid:
                    results.append(ValidationResult(
                        object_id=p.parcel_id,
                        object_type="Parcel",
                        validation_type="InvalidGeometry",
                        severity="ERROR",
                        message=f"Parcel {p.parcel_id} has invalid polygon geometry (self-intersection or bowtie)."
                    ))
                else:
                    parcel_shapes[p.parcel_id] = poly
            except Exception as e:
                results.append(ValidationResult(
                    object_id=p.parcel_id,
                    object_type="Parcel",
                    validation_type="MalformedGeometry",
                    severity="ERROR",
                    message=f"Failed to parse geometry for Parcel {p.parcel_id}: {str(e)}"
                ))

        # 2. Building within Parcel Containment Check
        bldg_shapes: Dict[str, Any] = {}
        for b in buildings:
            # Height and elevation sanity
            if b.height <= 0:
                results.append(ValidationResult(
                    object_id=b.building_id,
                    object_type="Building",
                    validation_type="NegativeHeight",
                    severity="ERROR",
                    message=f"Building {b.building_id} has non-positive height ({b.height}m)."
                ))
            if b.roof_elevation <= b.ground_elevation:
                results.append(ValidationResult(
                    object_id=b.building_id,
                    object_type="Building",
                    validation_type="InvalidElevationBounds",
                    severity="ERROR",
                    message=f"Building {b.building_id} roof elevation ({b.roof_elevation}m) <= ground elevation ({b.ground_elevation}m)."
                ))

            try:
                b_poly = shape(b.geometry)
                if not b_poly.is_valid:
                    results.append(ValidationResult(
                        object_id=b.building_id,
                        object_type="Building",
                        validation_type="InvalidGeometry",
                        severity="ERROR",
                        message=f"Building {b.building_id} footprint has self-intersections or invalid geometry."
                    ))
                bldg_shapes[b.building_id] = b_poly

                # Check if building is inside its parcel
                parcel_poly = parcel_shapes.get(b.parcel_id)
                if parcel_poly:
                    # Allow a tiny 0.05m tolerance for floating point boundary coincidence
                    buffered_parcel = parcel_poly.buffer(0.05)
                    if not buffered_parcel.contains(b_poly):
                        # Calculate overflow area
                        diff = b_poly.difference(parcel_poly)
                        results.append(ValidationResult(
                            object_id=b.building_id,
                            object_type="Building",
                            validation_type="BoundaryOverflow",
                            severity="ERROR",
                            message=f"Building {b.building_id} extends outside parent Parcel {b.parcel_id} (Overflow: ~{round(diff.area, 2)} m²)."
                        ))
                else:
                    results.append(ValidationResult(
                        object_id=b.building_id,
                        object_type="Building",
                        validation_type="OrphanBuilding",
                        severity="ERROR",
                        message=f"Building {b.building_id} references missing Parcel {b.parcel_id}."
                    ))
            except Exception as e:
                results.append(ValidationResult(
                    object_id=b.building_id,
                    object_type="Building",
                    validation_type="MalformedGeometry",
                    severity="ERROR",
                    message=f"Building {b.building_id} error: {str(e)}"
                ))

        # Check for planar building-to-building overlaps
        b_ids = list(bldg_shapes.keys())
        for i in range(len(b_ids)):
            for j in range(i + 1, len(b_ids)):
                b1_id, b2_id = b_ids[i], b_ids[j]
                poly1, poly2 = bldg_shapes[b1_id], bldg_shapes[b2_id]
                if poly1.intersects(poly2):
                    inter = poly1.intersection(poly2)
                    if inter.area > 1e-5:
                        results.append(ValidationResult(
                            object_id=f"{b1_id}/{b2_id}",
                            object_type="Building",
                            validation_type="BuildingOverlap",
                            severity="ERROR",
                            message=f"Buildings {b1_id} and {b2_id} overlap spatially on the 2D/3D map plane."
                        ))

        # 3. Floor Segmentation & Vertical Stacking Validation
        bldg_floors: Dict[str, List[Floor]] = {}
        for f in floors:
            bldg_floors.setdefault(f.building_id, []).append(f)
            if f.z_max <= f.z_min:
                results.append(ValidationResult(
                    object_id=f.floor_id,
                    object_type="Floor",
                    validation_type="InvalidZRange",
                    severity="ERROR",
                    message=f"Floor {f.floor_id} has invalid vertical bounds: z_min={f.z_min}m >= z_max={f.z_max}m."
                ))

        # Check for vertical overlaps between floors in each building
        for b_id, fl_list in bldg_floors.items():
            fl_sorted = sorted(fl_list, key=lambda x: x.floor_number)
            for i in range(len(fl_sorted) - 1):
                f_curr = fl_sorted[i]
                f_next = fl_sorted[i + 1]
                if f_curr.z_max > f_next.z_min + 0.01:
                    results.append(ValidationResult(
                        object_id=f_curr.floor_id,
                        object_type="Floor",
                        validation_type="VerticalOverlap",
                        severity="ERROR",
                        message=f"Floor {f_curr.floor_id} (z_max={f_curr.z_max}m) overlaps with Floor {f_next.floor_id} (z_min={f_next.z_min}m)."
                    ))

        # 4. Duplicate ULPIN & Property Integrity
        seen_ulpins = set()
        for prop in properties:
            if prop.ulpin in seen_ulpins:
                results.append(ValidationResult(
                    object_id=prop.property_id,
                    object_type="Property",
                    validation_type="DuplicateULPIN",
                    severity="ERROR",
                    message=f"Duplicate ULPIN detected: {prop.ulpin} for Property {prop.property_id}."
                ))
            seen_ulpins.add(prop.ulpin)

        # If clean, record passing summary
        if not any(r.severity == "ERROR" for r in results):
            results.append(ValidationResult(
                object_id="GLOBAL_SYSTEM",
                object_type="Cadastre",
                validation_type="TopologyIntegrity",
                severity="VALID",
                message="All 2D parcel polygons, 3D extruded footprints, vertical floor stacks, and ULPIN keys satisfy cadastral topology standards."
            ))

        # Persist results
        for r in results:
            db.add(r)
        db.commit()

        return [
            {
                "id": r.id or idx + 1,
                "object_id": r.object_id,
                "object_type": r.object_type,
                "validation_type": r.validation_type,
                "severity": r.severity,
                "message": r.message,
                "status": r.status
            }
            for idx, r in enumerate(results)
        ]

topology_validator = TopologyValidator()

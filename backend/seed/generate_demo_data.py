import os
import sys
import json
import math
from pathlib import Path
from shapely.geometry import Polygon, box, shape

# Add parent directory to sys.path to allow imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import engine, SessionLocal, Base
from app.models.entities import (
    Parcel, Building, Floor, VerticalParcel, Property,
    UndergroundAsset, GnssStation, ValidationResult, User
)
from app.geospatial.projection import local_to_geographic, geographic_to_local
from app.geospatial.terrain import terrain_service
from app.ulpin.generator import ulpin_generator
from app.services.lidar_service import lidar_service
from app.config import settings
import hashlib

def generate_all_demo_data():
    print("Initializing Database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed Default Users
    print("Seeding Super Admin, Admins, and Citizens...")
    def h(pwd: str) -> str:
        return hashlib.sha256(pwd.strip().encode('utf-8')).hexdigest()

    seeded_users = [
        User(
            user_id="SUPER-001",
            email="superadmin@cadastre.gov.in",
            name="Dr. Arvind Sharma (Chief Cadastral Commissioner)",
            hashed_password=h("SuperAdmin@2026"),
            role="superadmin",
            status="active",
            organization="UP Revenue & Cadastral Mapping Directorate",
            created_at="2026-09-01 09:00:00 UTC"
        ),
        User(
            user_id="ADM-001",
            email="officer.verma@cadastre.gov.in",
            name="Aditya Verma (Authorized Cadastral Officer)",
            hashed_password=h("Admin@2026"),
            role="admin",
            status="approved",
            organization="Prayagraj Municipal Cadastre Division",
            created_at="2026-09-02 10:15:00 UTC"
        ),
        User(
            user_id="ADM-002",
            email="sharma.admin@gmail.com",
            name="Rajesh Sharma (Assistant Surveyor)",
            hashed_password=h("Pending@2026"),
            role="admin",
            status="pending",
            organization="Civil Lines Land Records Office",
            created_at="2026-09-10 14:20:00 UTC"
        ),
        User(
            user_id="CIT-001",
            email="citizen.shukla@gmail.com",
            name="Amit Shukla (Property Holder)",
            hashed_password=h("Citizen@2026"),
            role="citizen",
            status="active",
            organization="Public Citizen",
            created_at="2026-09-05 11:30:00 UTC"
        )
    ]
    for u in seeded_users:
        db.add(u)
    db.commit()

    workspace_root = Path(__file__).resolve().parent.parent.parent
    data_dir = workspace_root / "data"
    (data_dir / "parcels").mkdir(parents=True, exist_ok=True)
    (data_dir / "buildings").mkdir(parents=True, exist_ok=True)
    (data_dir / "elevation").mkdir(parents=True, exist_ok=True)
    (data_dir / "utilities").mkdir(parents=True, exist_ok=True)
    (data_dir / "demo").mkdir(parents=True, exist_ok=True)

    # Load real OSM-aligned cadastre
    aligned_json_path = workspace_root / "aligned_cadastre.json"
    if not aligned_json_path.exists():
        raise FileNotFoundError(f"Missing {aligned_json_path}")

    with open(aligned_json_path, "r") as f:
        cadastre_items = json.load(f)

    print(f"Loaded {len(cadastre_items)} map-aligned cadastral records.")

    land_uses = [
        "Commercial High-Rise Complex",
        "Civic Administrative Center",
        "Healthcare / Hospital Wing",
        "Corporate Technology Hub",
        "Public Transit Terminal",
        "Diagnostic Health Center",
        "Commercial Retail Arcade",
        "Mixed Retail Plaza",
        "Residential Gated Enclave",
        "Educational Institute",
        "Institutional Research Center",
        "Eye Care Specialty Center",
        "Urban Commercial Plaza",
        "Multi-family Residential",
        "City Park & Green Amenity"
    ]

    building_types = [
        "Commercial High-Rise Complex",
        "Civic Administrative Center",
        "Healthcare / Hospital Wing",
        "Corporate Technology Hub",
        "Public Transit Terminal",
        "Diagnostic Health Center",
        "Commercial Retail Arcade",
        "Mixed Retail Plaza"
    ]

    building_heights = [18.0, 15.0, 21.0, 15.0, 15.0, 18.0, 15.0, 24.0]
    building_floors = [6, 5, 7, 5, 5, 6, 5, 8]

    # 1. Create 15 Parcels from real map building footprints + plot buffers
    print("Creating 15 Map-Aligned Parcels...")
    geojson_parcels = []
    for i, item in enumerate(cadastre_items):
        pid = item["parcel_id"]
        coords = item["parcel_coords"]
        area = item["parcel_area"]
        use = land_uses[i % len(land_uses)]
        surv = f"SURV-{(i + 1) * 101}/UP"

        geom = {
            "type": "Polygon",
            "coordinates": [coords]
        }

        p_entity = Parcel(
            parcel_id=pid,
            geometry=geom,
            area=area,
            land_use=use,
            survey_number=surv,
            status="Active"
        )
        db.add(p_entity)

        geojson_parcels.append({
            "type": "Feature",
            "properties": {
                "parcel_id": pid,
                "land_use": use,
                "area": area,
                "survey_number": surv,
                "status": "Active"
            },
            "geometry": geom
        })

    # 2. Create 8 3D Buildings seated on the actual map footprints
    print("Creating 8 Map-Aligned 3D Buildings...")
    geojson_buildings = []
    total_floor_count = 0
    total_vertical_properties = 0
    building_centers_for_lidar = []

    for i in range(8):
        item = cadastre_items[i]
        bid = f"B{i + 1:03d}"
        pid = item["parcel_id"]
        bldg_coords = item["building_coords"]
        h = building_heights[i]
        fc = building_floors[i]
        btype = building_types[i]
        area = item["building_area"]
        lng, lat = item["centroid"]

        # Calculate local metric X and Z
        local_x, _, local_z = geographic_to_local(lat, lng, 0)
        ground_elev = terrain_service.get_elevation_at(local_x, local_z)
        roof_elev = round(ground_elev + h, 2)

        building_centers_for_lidar.append({
            "x": local_x,
            "z": local_z,
            "ground": ground_elev,
            "height": h,
            "radius": math.sqrt(area) / 2.0
        })

        bldg_geom = {
            "type": "Polygon",
            "coordinates": [bldg_coords]
        }

        b_entity = Building(
            building_id=bid,
            parcel_id=pid,
            geometry=bldg_geom,
            ground_elevation=ground_elev,
            roof_elevation=roof_elev,
            height=h,
            floor_count=fc,
            building_type=btype
        )
        db.add(b_entity)

        geojson_buildings.append({
            "type": "Feature",
            "properties": {
                "building_id": bid,
                "parcel_id": pid,
                "ground_elevation": ground_elev,
                "roof_elevation": roof_elev,
                "height": h,
                "floor_count": fc,
                "building_type": btype
            },
            "geometry": bldg_geom
        })

        # Generate Floor volumes & Vertical Parcels
        floor_h = h / fc
        bldg_poly = Polygon(bldg_coords)

        for f_idx in range(fc):
            f_num = f_idx + 1
            floor_id = f"{bid}-F{f_num:02d}"
            z_min = round(ground_elev + f_idx * floor_h, 2)
            z_max = round(ground_elev + (f_idx + 1) * floor_h, 2)

            f_entity = Floor(
                floor_id=floor_id,
                building_id=bid,
                floor_number=f_num,
                z_min=z_min,
                z_max=z_max,
                area=area,
                geometry=bldg_geom
            )
            db.add(f_entity)
            total_floor_count += 1

            # SPECIAL REQUIREMENT: Apartment Subdivision for Building B001, Floor 3
            if bid == "B001" and f_num == 3:
                # Subdivide B001's actual polygon into 3 longitudinal slices (Apartment A, B, C)
                minx, miny, maxx, maxy = bldg_poly.bounds
                dx = (maxx - minx) / 3.0

                apt_slices = [
                    ("APT-A", minx, minx + dx, "Aditya Verma", "2BHK Luxury"),
                    ("APT-B", minx + dx, minx + 2 * dx, "Priya Sharma", "3BHK Executive"),
                    ("APT-C", minx + 2 * dx, maxx, "Rajesh Kumar", "2BHK Luxury"),
                ]

                for sub_code, x0, x1, owner, apt_type in apt_slices:
                    slice_box = box(x0, miny, x1, maxy)
                    apt_geom_poly = bldg_poly.intersection(slice_box)

                    if apt_geom_poly.is_empty:
                        apt_geom_coords = bldg_coords
                    elif apt_geom_poly.geom_type == 'Polygon':
                        apt_geom_coords = list(apt_geom_poly.exterior.coords)
                    else:
                        # MultiPolygon - take largest
                        largest = max(apt_geom_poly.geoms, key=lambda p: p.area)
                        apt_geom_coords = list(largest.exterior.coords)

                    apt_geo_dict = {
                        "type": "Polygon",
                        "coordinates": [[[round(c[0], 7), round(c[1], 7)] for c in apt_geom_coords]]
                    }

                    vp_id = f"{floor_id}-{sub_code}"
                    vp_area = round(area / 3.0, 1)
                    vp_vol = round(vp_area * (z_max - z_min), 1)

                    vp_entity = VerticalParcel(
                        vertical_parcel_id=vp_id,
                        parcel_id=pid,
                        building_id=bid,
                        floor_id=floor_id,
                        geometry=apt_geo_dict,
                        z_min=z_min,
                        z_max=z_max,
                        area=vp_area,
                        volume=vp_vol,
                        property_type=apt_type
                    )
                    db.add(vp_entity)

                    # ULPIN
                    prop_id = f"PROP-{total_vertical_properties + 101:04d}"
                    ulpin = ulpin_generator.format_ulpin(bid, f"F{f_num:02d}", sub_code)
                    prop_entity = Property(
                        property_id=prop_id,
                        ulpin=ulpin,
                        vertical_parcel_id=vp_id,
                        owner_name=owner,
                        property_type=apt_type,
                        status="Registered",
                        verification_status="Verified Cadastral Record"
                    )
                    db.add(prop_entity)
                    total_vertical_properties += 1
            else:
                # Whole floor single vertical parcel
                vp_id = f"{floor_id}-P01"
                vp_vol = round(area * (z_max - z_min), 1)
                vp_entity = VerticalParcel(
                    vertical_parcel_id=vp_id,
                    parcel_id=pid,
                    building_id=bid,
                    floor_id=floor_id,
                    geometry=bldg_geom,
                    z_min=z_min,
                    z_max=z_max,
                    area=area,
                    volume=vp_vol,
                    property_type="Commercial Suite" if "Commercial" in btype else "Apartment Suite"
                )
                db.add(vp_entity)

                prop_id = f"PROP-{total_vertical_properties + 101:04d}"
                ulpin = ulpin_generator.format_ulpin(bid, f"F{f_num:02d}", "P01")
                owners = [
                    "Ananya Roy", "Kavita Rao", "Vikram Joshi", "Suresh Patel",
                    "Sunita Nair", "Arjun Reddy", "Meera Gupta", "Rohan Mehta"
                ]
                prop_entity = Property(
                    property_id=prop_id,
                    ulpin=ulpin,
                    vertical_parcel_id=vp_id,
                    owner_name=owners[total_floor_count % len(owners)],
                    property_type="Commercial Suite" if "Commercial" in btype else "Apartment Suite",
                    status="Registered",
                    verification_status="Verified Cadastral Record"
                )
                db.add(prop_entity)
                total_vertical_properties += 1

    # 3. Underground Infrastructure
    print("Generating Map-Aligned Underground Infrastructure...")
    # Basement under Building B001 footprint
    b1_item = cadastre_items[0]
    b1_centroid = b1_item["centroid"]
    b1_x, _, b1_z = geographic_to_local(b1_centroid[1], b1_centroid[0], 0)
    b1_ground = terrain_service.get_elevation_at(b1_x, b1_z)

    basement = UndergroundAsset(
        asset_id="UG-BASEMENT-01",
        asset_type="Underground Parking Basement",
        geometry={"type": "Polygon", "coordinates": [b1_item["building_coords"]]},
        z_min=round(b1_ground - 4.5, 2),
        z_max=round(b1_ground, 2),
        owner="Prayagraj Municipal Urban Dev",
        status="Active"
    )
    db.add(basement)

    # Subterranean Gas / Water Pipeline running along Grand Trunk Road corridor
    gt_pipe_coords = [
        [81.84360, 25.43630],
        [81.84475, 25.43610],
        [81.84563, 25.43593],
        [81.84636, 25.43585],
        [81.84750, 25.43560],
        [81.84850, 25.43540]
    ]
    pipeline = UndergroundAsset(
        asset_id="UG-PIPE-WATER-09",
        asset_type="Subterranean High-Pressure Water Conduit",
        geometry={"type": "LineString", "coordinates": gt_pipe_coords},
        z_min=92.0,
        z_max=94.0,
        owner="Jal Sansthan Prayagraj",
        status="Active"
    )
    db.add(pipeline)

    # 4. Elevated Structure (Grand Trunk Road Flyover Overbridge)
    # Follows the actual curvature of Grand Trunk Road bridging over the railway lines
    print("Generating Map-Aligned Elevated Flyover along Grand Trunk Road...")
    gt_flyover_coords = [
        [81.84350, 25.43635],
        [81.84475, 25.43612],
        [81.84563, 25.43595],
        [81.84636, 25.43586],
        [81.84750, 25.43562],
        [81.84850, 25.43542]
    ]
    flyover = UndergroundAsset(
        asset_id="ELEV-FLYOVER-01",
        asset_type="Grand Trunk Road Elevated Flyover",
        geometry={"type": "LineString", "coordinates": gt_flyover_coords},
        z_min=108.0,
        z_max=114.0,
        owner="UP State Highway Authority",
        status="Active Operational"
    )
    db.add(flyover)

    # 5. GNSS / CORS Reference Stations
    print("Generating GNSS/CORS Reference Stations...")
    gnss_stations_data = [
        {"id": "CORS-UP-001", "lat": 25.4372, "lng": 81.8445, "elev": 99.4, "acc": 0.02},
        {"id": "CORS-UP-002", "lat": 25.4370, "lng": 81.8480, "elev": 101.1, "acc": 0.03},
        {"id": "CORS-UP-003", "lat": 25.4342, "lng": 81.8448, "elev": 98.7, "acc": 0.025},
        {"id": "CORS-UP-004", "lat": 25.4340, "lng": 81.8482, "elev": 100.8, "acc": 0.03},
    ]
    for g in gnss_stations_data:
        st = GnssStation(
            station_id=g["id"],
            latitude=g["lat"],
            longitude=g["lng"],
            elevation=g["elev"],
            accuracy=g["acc"]
        )
        db.add(st)

    # Commit all database transactions
    db.commit()

    # 6. Save GeoJSON and CSV artifacts to data/
    print("Writing updated GeoJSON and CSV files to data/ folder...")
    with open(data_dir / "parcels" / "parcels_demo.geojson", "w") as f:
        json.dump({"type": "FeatureCollection", "features": geojson_parcels}, f, indent=2)

    with open(data_dir / "buildings" / "buildings_demo.geojson", "w") as f:
        json.dump({"type": "FeatureCollection", "features": geojson_buildings}, f, indent=2)

    grid_data = terrain_service.get_grid_data()
    with open(data_dir / "elevation" / "dem_grid.csv", "w") as f:
        f.write("x,z,elevation\n")
        for pt in grid_data["points"]:
            f.write(f"{pt['x']},{pt['z']},{pt['elevation']}\n")

    with open(data_dir / "buildings" / "building_heights.csv", "w") as f:
        f.write("building_id,height,floors\n")
        for i in range(8):
            f.write(f"B{i + 1:03d},{building_heights[i]},{building_floors[i]}\n")

    lidar_pts = lidar_service.generate_synthetic_point_cloud(building_centers=building_centers_for_lidar)
    with open(data_dir / "demo" / "synthetic_lidar.json", "w") as f:
        json.dump(lidar_pts, f, indent=1)

    print(f"Map-Aligned Seed complete! Generated:")
    print(f"  - 15 Parcels perfectly aligned with real OpenStreetMap plots")
    print(f"  - 8 Buildings extruded from exact real-world OSM building polygons")
    print(f"  - {total_floor_count} Floors")
    print(f"  - {total_vertical_properties} 3D Vertical Properties & ULPINs")
    print(f"  - Grand Trunk Road Flyover & Pipeline aligned with the actual highway vector")
    print(f"  - 4 GNSS Reference Stations")
    print(f"  - Synthetic LiDAR Point Cloud ({len(lidar_pts)} points)")

    db.close()

if __name__ == "__main__":
    generate_all_demo_data()

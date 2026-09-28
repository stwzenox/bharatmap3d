# Walkthrough — 3D ULPIN & Vertical Property Mapping System (VPMS)

A complete, production-grade working prototype for **Smart India Hackathon 2026 Problem Statement 11: "3D ULPIN & Vertical Property Mapping System"**, extending the architectural and visual concepts of the reference VPMS into a functional end-to-end 2D + 3D geospatial cadastral platform.

---

## 🎯 What Was Built

```
2D GIS Parcel (Leaflet)
        +
Building Footprint
        +
DEM Ground Elevation (20x20 Grid)
        +
Floor Information (46 Floors across 8 Buildings)
        ↓
3D Building Extrusion (Three.js / React Three Fiber)
        ↓
Vertical Property Volumes (Footprint × [Zmin, Zmax])
        ↓
Topology Validation Engine (Shapely Planar & Vertical Stacking)
        ↓
3D ULPIN Generation (IN-UP-DEMO-B001-F03-APTA)
        ↓
Synchronized 2D + 3D Geospatial Command Center
```

### 1. Backend Service & Cadastral Engine
- **Framework**: Python 3.11 + FastAPI + Uvicorn + SQLAlchemy + SQLite (PostGIS-ready schema).
- **Coordinate Reference System**: Local metric ENU (East-North-Up) tangent plane projection centered at Prayagraj, UP (`lat: 25.4358°N`, `lng: 81.8463°E`, `elev: 98.0m`), with $1\text{ unit} = 1\text{ meter}$.
- **Synthetic Demonstration Area**: Approx. $500\text{m} \times 500\text{m}$ urban environment containing:
  - **15 Land Parcels** (`P001` - `P015`) with survey numbers, land uses, and polygons.
  - **8 3D Buildings** (`B001` - `B008`) with varied heights ($12\text{m} - 24\text{m}$), floor counts ($4 - 8$), and shapes (rectangular, L-shaped).
  - **46 Individual Floors** with explicit $Z_{\text{min}}$ and $Z_{\text{max}}$ vertical boundaries.
  - **48 3D Vertical Properties & ULPINs**.
  - **Apartment Subdivision**: Building `B001`, Floor 3 subdivided into Apartment A (`2BHK Luxury`), Apartment B (`3BHK Executive`), and Apartment C (`2BHK Luxury`), each with distinct volumes and unique ULPINs.
  - **Underground Infrastructure**: Subterranean parking basement ($Z = 95\text{m} - 98\text{m}$) and high-pressure utility water pipeline ($Z = 92\text{m} - 94\text{m}$).
  - **Elevated Rapid Transit Flyover**: Overpass bridge spanning at $Z = 108\text{m} - 114\text{m}$ with supporting concrete pylons.
  - **4 GNSS/CORS Reference Stations**: Accurate reference points with simulated survey-grade precision ($\pm 0.02 - 0.03\text{m}$).
  - **20×20 Terrain DEM**: Smooth undulating ground mesh ($98\text{m} - 103\text{m}$).
  - **Synthetic LiDAR Point Cloud**: 1,496 points with ASPRS classifications (Ground, Building Roof/Wall, Vegetation) and automated height calculation.
- **Topology Validation Engine**: Shapely-powered rule engine checking planar polygon validity, building-in-parcel containment, vertical overlap between adjacent floors, and ULPIN uniqueness.
- **Data Import Service**: REST endpoints for importing GeoJSON parcels/buildings, CSV building heights, and CSV DEM points.

### 2. Frontend 2D + 3D Command Center
- **Framework**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons.
- **2D GIS View**: React-Leaflet with CartoDB Dark Matter tiles, rendering parcels, footprints, subsurface utility lines, and GNSS markers.
- **3D Geospatial Engine**: Three.js + React Three Fiber + `@react-three/drei`, with true polygon extrusion (BufferGeometry), terrain heightmap mesh, and shadows.
- **Bidirectional 2D/3D Synchronization**: Clicking any parcel, building, floor, or underground asset in either view synchronizes selection, information card, and camera position.
- **Exploded Floor Mode**: Interactive slider separating stacked floor slabs vertically to inspect internal vertical cadastral slices.
- **Vertical Z-Clipping Slider**: Real-time slider filtering objects between $Z_{\text{min}}$ and $Z_{\text{max}}$ ($80\text{m} - 150\text{m}$).
- **Global ULPIN Search**: Quick search by ULPIN, building, parcel, or floor with instant camera fly-to.
- **3D Cadastral Property Certificate**: Printable report modal with QR code, spatial & volumetric metrics, survey hierarchy, and validation stamp.

### 3. Role-Based Building Management & Cascading Deletion
- **Admin & Super Admin Authority**:
  - Both `admin` and `superadmin` users can add new buildings through the 5-step 3D Cadastre Pipeline Modal and delete existing buildings.
- **Cascading Deletion**:
  - Deleting a building permanently removes:
    1. The 3D extruded mesh and floor slices from the Three.js viewport (`Scene3D.tsx`).
    2. The 2D polygon footprint and markers from the Leaflet GIS map (`LeafletMap.tsx`).
    3. All associated floor records (`Floor`).
    4. All subdivided vertical parcels (`VerticalParcel`).
    5. All associated 14-digit Bhu-Aadhaar ULPIN property deeds (`Property`).
    6. Recalculates real-time dashboard metrics (active structures, registered ULPINs, coverage area).
- **Dual Access Points**:
  - **3D Map Place Sheet (`GooglePlaceSheet.tsx`)**: An "Admin Actions" bar with `+ Add Building` and `Delete Building` appears for privileged users when inspecting any building.
  - **Super Admin Dashboard (`SuperAdminPage.tsx`)**: The 3D Building Asset Registry view includes `+ Add 3D Building` in the table header and a dedicated `Delete` button on each building row.
- **Building Overlap Prevention & Deduplication**:
  - Automatically deduplicates and sanitizes buildings per parcel, preventing multi-building visual collisions.
  - In `AddBuildingPipelineModal`, unoccupied parcels (`P009`–`P015`) are prioritized and recommended, with occupied parcels disabled to avoid accidental overlap.
  - Added `BuildingOverlap` automated rule check in `topology_checker.py`.

---

## 📸 Verification & Screenshots

### Command Center in Action
![VPMS 3D & 2D Command Center](C:\Users\LOTUS\.gemini\antigravity-ide\brain\bf15d8c8-4766-46dd-872e-6c6b8c76aeb6\vpms_command_center_1788701802632.png)

*The screenshot above demonstrates the Command Center with the 2D GIS Cadastre on the left, the 3D Three.js extruded scene on the right, the Cadastral Layer Control sidebar with the active Exploded View slider (2.5m vertical separation), and bottom Z-clipping and camera controls.*

---

## 🧪 Test Results

### 1. Backend Automated Tests (Pytest)
```
backend/tests/test_cadastral.py::test_root PASSED                        [ 12%]
backend/tests/test_cadastral.py::test_parcels_endpoint PASSED            [ 25%]
backend/tests/test_cadastral.py::test_buildings_endpoint PASSED          [ 37%]
backend/tests/test_cadastral.py::test_apartment_subdivision PASSED       [ 50%]
backend/tests/test_cadastral.py::test_coordinate_conversion_roundtrip PASSED [ 62%]
backend/tests/test_cadastral.py::test_ulpin_format PASSED                [ 75%]
backend/tests/test_cadastral.py::test_topology_validation PASSED         [ 87%]
backend/tests/test_cadastral.py::test_dashboard_metrics PASSED           [100%]

======================= 8 passed in 3.59s =======================
```

### 2. Frontend Production Build Check
```
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 2211 modules transformed.
rendering chunks...
dist/index.html                     1.26 kB
dist/assets/index-M2axlHQU.css     39.39 kB
dist/assets/index-CqE-mFwg.js   1,256.08 kB
✓ built in 1m 41s
```

---

## 🚀 How to Run Locally

### Terminal 1: Backend
```powershell
cd "c:\Users\LOTUS\Desktop\3d lddr"
python backend/seed/generate_demo_data.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`

### Terminal 2: Frontend
```powershell
cd "c:\Users\LOTUS\Desktop\3d lddr\frontend"
npm run dev
```
- Web Application: `http://localhost:5173/`

# BharatMap3D
### 3D ULPIN & Vertical Property Mapping System (VPMS) — SIH 2026 PS-11 Prototype

> [!IMPORTANT]
> **DISCLAIMER**: This application is a research and hackathon demonstration prototype. The generated 3D ULPIN identifiers, geometric boundaries, and cadastral property records are synthetic demo data created for demonstration and research purposes. This system does not constitute legal determination of land ownership or official government records.

---

## 🏛️ Project Overview

Traditional cadastral and land management systems (like 2D GIS and standard Land Record Information Systems) record property strictly in two dimensions ($X, Y$). However, modern built environments exhibit dense 3D spatial complexity:
- Multi-floor high-rise buildings where hundreds of property owners share the same land parcel footprint.
- Subterranean assets (basements, underground pipelines, metro transit tunnels) operating beneath surface land.
- Elevated civil infrastructure (rapid transit flyovers, skywalks) suspended above roads and land plots.

**3D ULPIN & VPMS** extends the concept of India's **Bhu-Aadhaar (Unique Land Parcel Identification Number)** into the vertical and subsurface dimension ($X, Y, Z$), delivering an end-to-end operational pipeline that takes 2D parcel boundaries, building footprints, DEM ground elevations, and floor heights to reconstruct interactive 3D vertical property volumes.

---

## ✨ Key Features & Capabilities

1. **Synchronized 2D & 3D Command Center**:
   - **2D Leaflet Map**: CartoDB dark GIS map rendering 15 parcels, building footprints, underground pipelines, and GNSS CORS reference stations.
   - **3D Three.js / React Three Fiber**: True footprint polygon extrusion, 20x20 terrain DEM heightmap, transparent x-ray modes, and scale grid.
   - **Bidirectional Selection Sync**: Clicking an object in either view instantly highlights and zooms both representations.

2. **Exploded Floor View**:
   - Vertical separation slider allows the user to dynamically expand stacked building floor slabs, providing immediate visibility into interior floors and unit boundaries.

3. **Apartment Subdivision**:
   - Floor 3 of Building `B001` is subdivided into 3 distinct units:
     - **Apartment A**: Luxury 2BHK
     - **Apartment B**: Executive 3BHK
     - **Apartment C**: Luxury 2BHK
   - Each apartment holds independent volume ($m^3$), area ($m^2$), owner records, and unique 3D ULPINs.

4. **Subsurface & Elevated Infrastructure**:
   - Subterranean basement ($Z = 95\text{m} - 98\text{m}$) and high-pressure water pipeline ($Z = 92\text{m} - 94\text{m}$) with `Underground ON/OFF` toggle.
   - Elevated transit flyover ($Z = 108\text{m} - 114\text{m}$) supported on concrete pylons.

5. **Vertical Z-Axis Clipping Slider**:
   - Filter objects vertically between $Z_{\text{min}}$ and $Z_{\text{max}}$ ($80\text{m} - 150\text{m}$) to inspect subterranean, surface, or high-rise elevation slices.

6. **3D ULPIN Generation Engine**:
   - Format: `IN-UP-DEMO-{BUILDING}-{FLOOR}-{PROP}` (e.g., `IN-UP-DEMO-B001-F03-APTA`).
   - Verifies database uniqueness before issuing new identifiers.

7. **Topology Validation Engine**:
   - Shapely-based geometry checks for self-intersections, building boundary overhang outside parcels, vertical overlaps between adjacent floor slabs, and duplicate survey/ULPIN keys.
   - Includes "View Object" button to instantly zoom to detected anomalies.

8. **Synthetic LiDAR & AI Architecture**:
   - Synthetic point cloud with ASPRS classifications (Ground, Building, Vegetation).
   - Automated building height estimation algorithm ($H = \text{Roof}_{95} - \text{Ground}$).
   - Abstract interfaces for `BuildingExtractionService` (SAM / YOLO), `FloorSegmentationService`, and `PointCloudClassificationService`.

9. **Printable Cadastral Certificate**:
   - Clean printable report modal with QR code, 3D volumetric metrics, parent cadastral hierarchy, and validation stamp.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite |
| **3D Graphics Engine** | Three.js, React Three Fiber (R3F), @react-three/drei |
| **2D Mapping** | Leaflet, React Leaflet |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS (Dark Geospatial Command Center Theme) |
| **Backend Framework** | Python 3.11, FastAPI, Uvicorn |
| **Database** | SQLite + SQLAlchemy (PostGIS migration ready) |
| **Geospatial Processing** | Shapely, PyProj |
| **Testing** | Pytest (Backend), TypeScript / Vite Build (Frontend) |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
# Navigate to project root
cd "c:\Users\LOTUS\Desktop\3d lddr"

# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Seed synthetic demo dataset (15 parcels, 8 buildings, 46 floors, underground & elevated infrastructure)
python backend/seed/generate_demo_data.py

# Run FastAPI backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be live at `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

In a new terminal:
```bash
cd "c:\Users\LOTUS\Desktop\3d lddr\frontend"

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

Run backend unit tests:
```bash
python -m pytest backend/tests/test_cadastral.py -v
```

Run frontend build check:
```bash
cd frontend
npm run build
```

---

## 📡 REST API Summary

- `GET /api/parcels`: Retrieve all 2D cadastral parcels.
- `GET /api/buildings`: Retrieve 3D building specifications.
- `GET /api/floors`: Retrieve floor slices (optional query `building_id`).
- `GET /api/vertical-properties`: Retrieve vertical parcels & apartment units.
- `GET /api/properties`: Retrieve registered 3D property records.
- `GET /api/ulpin/{ulpin}`: Global search for ULPIN / property details.
- `POST /api/ulpin/generate`: Generate unique 3D ULPIN.
- `GET /api/validation`: Retrieve topology validation results.
- `POST /api/validation/run`: Execute planar & vertical topology checks.
- `GET /api/underground-assets`: Retrieve basements & pipelines.
- `GET /api/gnss`: Retrieve GNSS CORS reference stations.
- `GET /api/terrain`: Retrieve 20x20 DEM height grid.
- `GET /api/lidar`: Retrieve synthetic LiDAR point cloud.
- `POST /api/lidar/estimate-height`: Calculate building height from LiDAR points.
- `GET /api/dashboard`: Summary KPIs and statistics.
- `POST /api/import/geojson`: Upload custom parcel / building GeoJSON.
- `POST /api/import/building-heights`: Upload CSV building heights.
- `POST /api/import/dem`: Upload CSV DEM points.

---

## 📋 Hackathon Step-by-Step Demonstration Flow

1. **Dashboard & KPIs**: Open app; inspect the 15 parcels in 2D and initial metrics.
2. **3D View**: Switch to 3D or Split View; observe buildings seated accurately on the undulating 20x20 terrain mesh.
3. **Inspect Building B001**: Click Building `B001` to view its height (18m), 6 floors, and ground elevation.
4. **Segmented Floor View**: Enable "Segmented" floor mode; click Floor 3 to observe its 3 distinct subdivided apartments (A, B, C).
5. **Exploded Floor View**: Enable Exploded View and slide the vertical separation slider to see floors float apart.
6. **Generate 3D ULPIN**: Click "Generate 3D ULPIN" in the right panel to assign a new unique ULPIN record.
7. **Underground Assets**: Toggle "Underground Infrastructure" in the left sidebar to reveal the subterranean parking basement and high-pressure water pipeline.
8. **Z-Clipping Slider**: Move Z-MIN and Z-MAX sliders to isolate underground infrastructure or upper penthouse levels.
9. **Topology Validation**: Click "Topology" in the header; observe passed checks and inspect any warnings using "View Object".
10. **Global Search**: Type `IN-UP-DEMO-B001-F03-APTA` in the top search bar to automatically focus the property in both 2D and 3D.
11. **Printable Report**: Click "Print Cadastral Report" to preview and print the official 3D property certificate.

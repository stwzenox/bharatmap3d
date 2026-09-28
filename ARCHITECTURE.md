# System Architecture & Technical Specifications
## 3D ULPIN & Vertical Property Mapping System (VPMS)
*Prototype for Smart India Hackathon 2026 — Problem Statement 11*

---

## 1. Executive Summary & Problem Context

Traditional land administration systems represent property rights in two dimensions (X, Y). However, modern urban environments increasingly stack rights, restrictions, and responsibilities vertically:
- Multi-storey residential apartment complexes where hundreds of individual owners share the identical ground footprint.
- Subterranean assets (basements, underground transit tunnels, high-pressure utility pipes) beneath surface property.
- Elevated civil infrastructure (rapid transit flyovers, skywalks, elevated highways) passing over land parcels.

**3D ULPIN (Unique Land Parcel Identification Number)** extends India's Bhu-Aadhaar initiative into the vertical and volumetric dimension, ensuring that every 3D spatial volume has an unambiguous, legally verifiable identifier.

```
+-----------------------------------------------------------------------------+
|                                  WORKFLOW                                   |
|                                                                             |
|  2D GIS Parcel  +  Building Footprint  +  DEM Ground Elev  +  Floor Height  |
|                                      |                                      |
|                                      v                                      |
|                              3D Extrusion Mesh                              |
|                                      |                                      |
|                                      v                                      |
|                          Vertical Property Volumes                          |
|                                      |                                      |
|                                      v                                      |
|                             Topology Validation                             |
|                                      |                                      |
|                                      v                                      |
|                            3D ULPIN Code Engine                             |
|                                      |                                      |
|                                      v                                      |
|                 Synchronized 2D (Leaflet) & 3D (Three.js) HUD               |
+-----------------------------------------------------------------------------+
```

---

## 2. Coordinate Reference System (CRS) & Projection

Three.js graphics engines operate in local metric coordinates, whereas GIS cadastral systems operate in geographic coordinates (WGS84, EPSG:4326).

### Tangent Plane ENU (East-North-Up) Formulation
We define a local metric reference origin centered at Prayagraj, Uttar Pradesh:
$$\text{Origin Lat} = 25.4358^\circ\text{ N}, \quad \text{Origin Lng} = 81.8463^\circ\text{ E}, \quad \text{Datum Elev} = 98.0\text{ m}$$

For any coordinate $(\phi, \lambda, h)$:
$$\Delta \phi = \text{radians}(\phi - \phi_0), \quad \Delta \lambda = \text{radians}(\lambda - \lambda_0)$$
$$\text{Easting } (X) = \Delta \lambda \cdot R \cdot \cos(\phi_0)$$
$$\text{Northing } (Y_{\text{geo}}) = \Delta \phi \cdot R$$
$$\text{Elevation } (Z) = h$$

In Three.js coordinate space ($Y$-Up, $X$-East, $Z$-South):
$$x = \text{Easting}, \quad y = \text{Elevation}, \quad z = -\text{Northing}$$

This allows direct $1\text{ unit} = 1\text{ meter}$ scale fidelity, making volumetric calculations ($m^3$) exact.

---

## 3. 3D Volumetric Extrusion & Cadastral Slicing

### A. True Footprint Extrusion
Unlike naive bounding-box viewers, VPMS constructs real polygonal meshes using Three.js `ShapeGeometry` and `ExtrudeGeometry`:
1. The 2D GeoJSON polygon exterior ring $[(lng_1, lat_1), \dots]$ is converted into local metric 2D coordinates $[(x_1, z_1), \dots]$.
2. The polygon is triangulated to produce bottom and top cap faces.
3. Quad side faces are generated between bottom vertices ($y = Z_{\text{min}}$) and top vertices ($y = Z_{\text{max}}$).

### B. Vertical Floor Stacking & Exploded View
For a building with height $H$, floor count $N$, and ground elevation $Z_{\text{ground}}$:
$$\text{Floor Height } h_f = \frac{H}{N}$$
$$\text{Floor } k \text{ bounds: } Z_{\text{min}} = Z_{\text{ground}} + (k-1)h_f, \quad Z_{\text{max}} = Z_{\text{ground}} + k \cdot h_f$$

When **Exploded Floor Mode** is activated with separation factor $\delta$:
$$Y_{\text{render}}(k) = Y_{\text{actual}}(k) + (k-1) \cdot \delta$$
This visually separates stacked floor slabs vertically, allowing instantaneous visual inspection of individual floors and apartment subdivisions.

### C. Apartment Subdivision
A single floor slab can be partitioned horizontally into distinct apartment units ($A, B, C$). Each unit inherits the vertical bounds $[Z_{\text{min}}, Z_{\text{max}}]$ but occupies its own subset polygon footprint, volume, and distinct 3D ULPIN.

---

## 4. Subsurface & Elevated Infrastructure

VPMS proves that the same $X, Y$ footprint can hold 4 simultaneous property rights at different elevation bands:
1. **Underground Conduit / Pipeline**: $Z = 92\text{m} - 94\text{m}$ (Municipal Water Utility).
2. **Subterranean Parking Basement**: $Z = 95\text{m} - 98\text{m}$ (Building Developer).
3. **Surface Land Parcel & Building Ground Floor**: $Z = 98\text{m} - 101\text{m}$ (Commercial Shop).
4. **Elevated Rapid Transit Flyover**: $Z = 108\text{m} - 114\text{m}$ (State Highway Authority).

The interactive **Z-Clipping Slider** allows surveyors to isolate any elevation slice $[Z_{\text{clip-min}}, Z_{\text{clip-max}}]$.

---

## 5. 3D ULPIN Identifier Standard (Prototype Scheme)

The ULPIN generator constructs deterministic, collision-free vertical identifiers:
```
IN - UP - DEMO - {BUILDING_ID} - {FLOOR_ID} - {PROPERTY_UNIT}
Example: IN-UP-DEMO-B001-F03-APTA
```
- **IN**: Country ISO Code (India)
- **UP**: State Code (Uttar Pradesh)
- **DEMO**: Prototype demarcation
- **B001**: Unique Building Identifier
- **F03**: Floor Level 3
- **APTA**: Apartment Unit A

Before assignment, the database verifies uniqueness.

---

## 6. Topology Validation Engine

The backend validation engine executes rigorous geometric and database rules via **Shapely**:
1. **Planar Polygon Validity**: Detects self-intersections, bowties, and collinear degeneracies.
2. **Parcel Enclosure**: Verifies that building footprints do not spill over parcel boundaries:
   $$\text{Difference}(B_{\text{geom}}, P_{\text{geom}}) = \emptyset$$
3. **Vertical Overlap Detection**: Verifies that adjacent floor slabs in the same building do not intersect in the vertical interval:
   $$Z_{\text{max}}(k) \le Z_{\text{min}}(k+1)$$
4. **ULPIN & Survey Uniqueness**: Enforces non-duplicate survey numbers and global ULPIN uniqueness.

---

## 7. AI & LiDAR Processing Architecture

### Abstract Interfaces
- `BuildingExtractionService`: Interface for SAM (Segment Anything Model) and YOLOv8-OBB aerial footprint extraction.
- `FloorSegmentationService`: Facade analysis and floor boundary estimation.
- `PointCloudClassificationService`: Point cloud segmentation into ASPRS standard classes:
  - Class 2: Ground
  - Class 5: Vegetation
  - Class 6: Building Roof & Facade

### Automated Building Height Algorithm
$$\text{Ground Elevation} = \text{mean}(Z_{\text{ground-points}})$$
$$\text{Roof Elevation} = P_{95}(Z_{\text{building-points}})$$
$$\text{Estimated Height} = \text{Roof Elevation} - \text{Ground Elevation}$$
$$\text{Confidence} = \min(0.98, 0.70 + 0.28 \cdot \frac{N_{\text{samples}}}{100})$$

---

## 8. Database Architecture & PostGIS Migration Path

Current MVP utilizes **SQLite** with SQLAlchemy:
- Geometries stored as WGS84 GeoJSON structures.
- Spatial operations executed via Shapely in Python.

**Migration to PostgreSQL + PostGIS**:
The models are structured with standard entity relationships (`Parcel` $\rightarrow$ `Building` $\rightarrow$ `Floor` $\rightarrow$ `VerticalParcel` $\rightarrow$ `Property`). In PostGIS:
1. Replace `JSON` columns with `Geometry(PolygonZ, 4326)` or `Geometry(PolyhedralSurfaceZ, 4326)`.
2. Replace Shapely containment checks with native SQL `ST_Contains` and `ST_3DIntersects`.

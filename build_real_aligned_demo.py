import json
from shapely.geometry import Polygon, mapping
from shapely.affinity import scale
import math

with open('osm_elements.json', 'r') as f:
    data = json.load(f)

buildings = data['buildings']

# Convert valid buildings into shapely polygons
parsed = []
for b in buildings:
    pts = b.get('geometry', [])
    if len(pts) >= 4:
        coords = [[p['lon'], p['lat']] for p in pts]
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        try:
            poly = Polygon(coords)
            if poly.is_valid and poly.area > 0.00000002: # at least ~250m2
                area_m2 = poly.area * (111319.9 ** 2) * math.cos(math.radians(25.4358))
                parsed.append({
                    "osm_id": b['id'],
                    "poly": poly,
                    "coords": coords,
                    "area_m2": round(area_m2, 1),
                    "centroid": [poly.centroid.x, poly.centroid.y]
                })
        except Exception:
            pass

# Sort by area descending
parsed.sort(key=lambda x: x['area_m2'], reverse=True)

# Select 15 distinct, well-spaced buildings across the map
selected = []
for candidate in parsed:
    # Check distance from already selected buildings to avoid crowding
    c_pt = candidate['poly'].centroid
    too_close = False
    for s in selected:
        dist_deg = c_pt.distance(s['poly'].centroid)
        # roughly 35 meters in degrees (~0.00032)
        if dist_deg < 0.00032:
            too_close = True
            break
    if not too_close:
        selected.append(candidate)
    if len(selected) == 15:
        break

print(f"Selected {len(selected)} real OSM buildings with optimal spatial distribution!")
for i, s in enumerate(selected):
    print(f"  P{i+1:03d} (OSM {s['osm_id']}): {s['area_m2']} m2 at ({s['centroid'][1]:.6f}, {s['centroid'][0]:.6f})")

# Write to a JSON file for generate_demo_data.py to use
output_data = []
for i, s in enumerate(selected):
    # Parcel is a slightly expanded buffer (3.5 meters ~ 0.000035 deg) around the building footprint
    parcel_poly = s['poly'].buffer(0.000038, join_style=2)
    parcel_coords = [[round(p[0], 7), round(p[1], 7)] for p in list(parcel_poly.exterior.coords)]
    bldg_coords = [[round(p[0], 7), round(p[1], 7)] for p in s['coords']]
    
    parcel_area = round(parcel_poly.area * (111319.9 ** 2) * math.cos(math.radians(25.4358)), 1)
    
    output_data.append({
        "parcel_id": f"P{i+1:03d}",
        "building_id": f"B{i+1:03d}" if i < 8 else None, # First 8 have 3D buildings
        "osm_id": s['osm_id'],
        "parcel_coords": parcel_coords,
        "building_coords": bldg_coords,
        "parcel_area": parcel_area,
        "building_area": s['area_m2'],
        "centroid": s['centroid']
    })

with open('aligned_cadastre.json', 'w') as f:
    json.dump(output_data, f, indent=2)
print("Saved aligned cadastre to aligned_cadastre.json")

import json
from shapely.geometry import Polygon, MultiPolygon, shape
import math

with open('osm_elements.json', 'r') as f:
    data = json.load(f)

buildings = data['buildings']
highways = data['highways']

print(f"Loaded {len(buildings)} buildings and {len(highways)} highways.")

# Find buildings with names or interesting tags
named_bldgs = []
for b in buildings:
    name = b.get('tags', {}).get('name')
    if name:
        named_bldgs.append((b['id'], name, len(b.get('geometry', []))))

print("Named buildings:", named_bldgs)

# Filter buildings that are valid polygons with good area (e.g. > 100 m2)
valid_bldgs = []
for b in buildings:
    geom_pts = b.get('geometry', [])
    if len(geom_pts) >= 4:
        # [lng, lat]
        coords = [[p['lon'], p['lat']] for p in geom_pts]
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        try:
            poly = Polygon(coords)
            if poly.is_valid and poly.area > 0.00000001:  # ~100m2
                # Calculate approximate area in m2
                area_m2 = poly.area * (111319.9 ** 2) * math.cos(math.radians(25.4358))
                valid_bldgs.append({
                    "id": b['id'],
                    "name": b.get('tags', {}).get('name', f"Building-{b['id']}"),
                    "coords": coords,
                    "area_m2": round(area_m2, 1),
                    "centroid": [poly.centroid.x, poly.centroid.y]
                })
        except Exception as e:
            pass

# Sort by area descending
valid_bldgs.sort(key=lambda x: x['area_m2'], reverse=True)
print(f"Total valid polygons: {len(valid_bldgs)}")
print("Top 15 largest real buildings in this area:")
for idx, b in enumerate(valid_bldgs[:15]):
    print(f"  {idx+1}. ID: {b['id']}, Name: {b['name']}, Area: {b['area_m2']} m2, Centroid: ({b['centroid'][1]:.6f}, {b['centroid'][0]:.6f})")

# Print Highway names
hw_names = set(h.get('tags', {}).get('name') for h in highways if h.get('tags', {}).get('name'))
print("Highways in area:", hw_names)

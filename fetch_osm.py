import urllib.request
import urllib.parse
import json

q = """[out:json][timeout:25];
(
  way["building"](25.4340,81.8440,25.4375,81.8485);
  way["highway"](25.4340,81.8440,25.4375,81.8485);
);
out geom;
"""

data = urllib.parse.urlencode({'data': q}).encode('utf-8')
req = urllib.request.Request(
    'https://overpass-api.de/api/interpreter',
    data=data,
    headers={'User-Agent': 'VPMS-Cadastre-SIH/1.0'}
)

try:
    print("Sending query to Overpass API...")
    with urllib.request.urlopen(req, timeout=20) as r:
        res = json.loads(r.read())
        elements = res.get('elements', [])
        buildings = [e for e in elements if 'building' in e.get('tags', {})]
        highways = [e for e in elements if 'highway' in e.get('tags', {})]
        print(f"Total elements: {len(elements)}")
        print(f"Real buildings found: {len(buildings)}")
        print(f"Highways found: {len(highways)}")
        
        with open('osm_elements.json', 'w') as f:
            json.dump({'buildings': buildings, 'highways': highways}, f, indent=2)
        print("Saved to osm_elements.json")
except Exception as e:
    print(f"Error fetching from Overpass: {e}")

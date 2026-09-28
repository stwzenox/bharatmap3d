import math
from typing import Tuple, List
from app.config import settings

EARTH_RADIUS = 6378137.0  # WGS84 major radius in meters

def geographic_to_local(lat: float, lng: float, elev: float = 0.0) -> Tuple[float, float, float]:
    """
    Convert (lat, lng, elev) to local metric ENU coordinates relative to settings.ORIGIN.
    x = Easting (meters)
    y = Elevation / Height (meters above origin)
    z = -Northing (meters, Three.js coordinates where -Z points North)
    """
    origin_lat_rad = math.radians(settings.ORIGIN_LAT)
    origin_lng_rad = math.radians(settings.ORIGIN_LNG)
    
    lat_rad = math.radians(lat)
    lng_rad = math.radians(lng)
    
    # Delta calculations
    d_lat = lat_rad - origin_lat_rad
    d_lng = lng_rad - origin_lng_rad
    
    easting = d_lng * EARTH_RADIUS * math.cos(origin_lat_rad)
    northing = d_lat * EARTH_RADIUS
    height = elev  # We preserve absolute elevation for accurate vertical clipping
    
    return round(easting, 3), round(height, 3), round(-northing, 3)

def local_to_geographic(x: float, y: float, z: float) -> Tuple[float, float, float]:
    """
    Convert local metric (x, y, z) back to geographic (lat, lng, elev).
    """
    origin_lat_rad = math.radians(settings.ORIGIN_LAT)
    
    easting = x
    northing = -z
    elev = y
    
    d_lat = northing / EARTH_RADIUS
    d_lng = easting / (EARTH_RADIUS * math.cos(origin_lat_rad))
    
    lat = settings.ORIGIN_LAT + math.degrees(d_lat)
    lng = settings.ORIGIN_LNG + math.degrees(d_lng)
    
    return round(lat, 7), round(lng, 7), round(elev, 2)

def transform_geojson_coordinates(coordinates: List, to_local: bool = True) -> List:
    """
    Recursively transform GeoJSON coordinates array between [lng, lat] and [x, z].
    """
    if not coordinates:
        return []
    
    if isinstance(coordinates[0], (int, float)):
        # Point [lng, lat]
        lng, lat = coordinates[0], coordinates[1]
        elev = coordinates[2] if len(coordinates) > 2 else settings.ORIGIN_ELEVATION
        if to_local:
            x, _, z = geographic_to_local(lat, lng, elev)
            return [x, z]
        else:
            lat_out, lng_out, _ = local_to_geographic(coordinates[0], settings.ORIGIN_ELEVATION, coordinates[1])
            return [lng_out, lat_out]
            
    return [transform_geojson_coordinates(c, to_local) for c in coordinates]

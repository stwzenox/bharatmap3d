import * as THREE from 'three';

export const ORIGIN_LAT = 25.4358;
export const ORIGIN_LNG = 81.8463;
export const ORIGIN_ELEVATION = 98.0;
const EARTH_RADIUS = 6378137.0;

export function geographicToLocal(lat: number, lng: number, elev: number = 0): [number, number, number] {
  const originLatRad = (ORIGIN_LAT * Math.PI) / 180;
  const originLngRad = (ORIGIN_LNG * Math.PI) / 180;

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const dLat = latRad - originLatRad;
  const dLng = lngRad - originLngRad;

  const easting = dLng * EARTH_RADIUS * Math.cos(originLatRad);
  const northing = dLat * EARTH_RADIUS;

  // In Three.js: X = Easting, Y = Height/Elevation, Z = -Northing (South/North)
  return [Number(easting.toFixed(2)), Number(elev.toFixed(2)), Number((-northing).toFixed(2))];
}

export function localToGeographic(x: number, y: number, z: number): [number, number, number] {
  const originLatRad = (ORIGIN_LAT * Math.PI) / 180;
  const northing = -z;
  const easting = x;

  const dLat = northing / EARTH_RADIUS;
  const dLng = easting / (EARTH_RADIUS * Math.cos(originLatRad));

  const lat = ORIGIN_LAT + (dLat * 180) / Math.PI;
  const lng = ORIGIN_LNG + (dLng * 180) / Math.PI;

  return [Number(lat.toFixed(6)), Number(lng.toFixed(6)), Number(y.toFixed(2))];
}

/**
 * Converts GeoJSON polygon coordinates [[lng, lat], ...] to a Three.js Shape
 * on the local metric XZ plane.
 */
export function geojsonToThreeShape(ring: number[][]): THREE.Shape | null {
  if (!ring || ring.length < 3) return null;

  const shape = new THREE.Shape();
  const [firstLng, firstLat] = ring[0];
  const [x0, , z0] = geographicToLocal(firstLat, firstLng, 0);

  shape.moveTo(x0, z0);

  for (let i = 1; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    const [x, , z] = geographicToLocal(lat, lng, 0);
    shape.lineTo(x, z);
  }

  shape.closePath();
  return shape;
}

/**
 * Creates an extruded 3D BufferGeometry from a 2D polygon footprint.
 * Footprint vertices are transformed to metric (X, Z).
 * The mesh is extruded along the Y (elevation) axis from zMin to zMax.
 */
export function createExtrudedFootprintGeometry(
  ring: number[][],
  zMin: number,
  zMax: number
): THREE.BufferGeometry | null {
  if (!ring || ring.length < 3) return null;

  // Convert points to 2D local (x, z)
  const pts2D: THREE.Vector2[] = ring.map(([lng, lat]) => {
    const [x, , z] = geographicToLocal(lat, lng, 0);
    return new THREE.Vector2(x, z);
  });

  // Remove duplicate closing point if present
  if (pts2D.length > 3 && pts2D[0].distanceTo(pts2D[pts2D.length - 1]) < 0.001) {
    pts2D.pop();
  }

  const shape = new THREE.Shape(pts2D);
  const height = Math.max(0.5, zMax - zMin);

  // ExtrudeGeometry extrudes along +Z by default
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    steps: 1
  });

  // Rotate so that extrusion goes along Y (Up) axis:
  // ExtrudeGeometry builds in XY plane and extrudes along +Z.
  // We want original Shape in XZ plane and extrusion along +Y.
  geom.rotateX(Math.PI / 2);
  geom.translate(0, zMax, 0); // Or translate to sit on zMin

  geom.computeVertexNormals();
  return geom;
}

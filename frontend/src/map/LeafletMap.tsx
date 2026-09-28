import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCadastralStore } from '../state/useCadastralStore';
import { useAuthStore } from '../state/useAuthStore';
import { ORIGIN_LAT, ORIGIN_LNG } from '../utils/coordinates';

// Map updater to pan/zoom when selection changes & synchronize with 3D map
const MapController: React.FC = () => {
  const {
    selectedParcelId,
    parcels,
    buildings,
    selectedBuildingId,
    mapCenter,
    mapZoom,
    syncSource,
    syncMapViewport
  } = useCadastralStore();
  const map = useMap();
  const isInternalSyncRef = React.useRef(false);

  // Broadcast 2D map movements to 3D OpenFreeMap
  useMapEvents({
    move() {
      if (isInternalSyncRef.current) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      syncMapViewport([center.lat, center.lng], zoom, '2d');
    }
  });

  // Follow 3D OpenFreeMap movements in real-time
  useEffect(() => {
    if (syncSource !== '3d') return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const dLat = Math.abs(center.lat - mapCenter[0]);
    const dLng = Math.abs(center.lng - mapCenter[1]);
    const dZoom = Math.abs(zoom - mapZoom);

    if (dLat > 0.000005 || dLng > 0.000005 || dZoom > 0.04) {
      isInternalSyncRef.current = true;
      map.setView([mapCenter[0], mapCenter[1]], mapZoom, { animate: false });
      setTimeout(() => {
        isInternalSyncRef.current = false;
      }, 50);
    }
  }, [mapCenter, mapZoom, syncSource, map]);

  useEffect(() => {
    const handleZoom = (e: any) => {
      const delta = e.detail ?? 1;
      if (delta > 0) {
        map.zoomIn();
      } else {
        map.zoomOut();
      }
    };

    const handleCenter = () => {
      map.flyTo([ORIGIN_LAT, ORIGIN_LNG], 17.5, { duration: 1.0 });
    };

    window.addEventListener('cadastre:leaflet-zoom', handleZoom);
    window.addEventListener('cadastre:leaflet-center', handleCenter);
    return () => {
      window.removeEventListener('cadastre:leaflet-zoom', handleZoom);
      window.removeEventListener('cadastre:leaflet-center', handleCenter);
    };
  }, [map]);

  useEffect(() => {
    if (selectedBuildingId) {
      const bldg = buildings.find(b => b.building_id === selectedBuildingId);
      if (bldg && bldg.geometry.coordinates[0]) {
        const ring = bldg.geometry.coordinates[0];
        const lat = ring[0][1];
        const lng = ring[0][0];
        map.flyTo([lat, lng], 17.5, { duration: 1.2 });
        return;
      }
    }

    if (selectedParcelId) {
      const parcel = parcels.find(p => p.parcel_id === selectedParcelId);
      if (parcel && parcel.geometry.coordinates[0]) {
        const ring = parcel.geometry.coordinates[0];
        const lat = ring[0][1];
        const lng = ring[0][0];
        map.flyTo([lat, lng], 17.5, { duration: 1.2 });
      }
    }
  }, [selectedParcelId, selectedBuildingId, parcels, buildings, map]);

  return null;
};

// Google Earth style polygon drawer overlay with live yellow vertex pins & area
const GoogleEarthMeasureOverlay: React.FC = () => {
  const {
    isMeasuringPolygon,
    measurePolygonPoints,
    addMeasurePolygonPoint,
  } = useCadastralStore();

  const [mousePos, setMousePos] = React.useState<[number, number] | null>(null);

  const map = useMapEvents({
    click(e) {
      if (!isMeasuringPolygon) return;
      addMeasurePolygonPoint([e.latlng.lat, e.latlng.lng]);
    },
    mousemove(e) {
      if (isMeasuringPolygon) {
        setMousePos([e.latlng.lat, e.latlng.lng]);
      }
    }
  });

  useEffect(() => {
    if (isMeasuringPolygon) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [isMeasuringPolygon, map]);

  if (!isMeasuringPolygon && measurePolygonPoints.length === 0) {
    return null;
  }

  const isClosed = measurePolygonPoints.length >= 3;

  return (
    <>
      {/* Active polygon area */}
      {isClosed && (
        <Polygon
          positions={measurePolygonPoints}
          pathOptions={{
            color: '#f59e0b',
            weight: 2.5,
            fillColor: '#94a3b8',
            fillOpacity: 0.35,
            dashArray: '5, 5',
          }}
        />
      )}

      {/* Polyline connections */}
      {measurePolygonPoints.length >= 2 && (
        <Polyline
          positions={isClosed ? [...measurePolygonPoints, measurePolygonPoints[0]] : measurePolygonPoints}
          pathOptions={{
            color: '#f59e0b',
            weight: 3,
          }}
        />
      )}

      {/* Rubber-band dynamic line to mouse position */}
      {isMeasuringPolygon && measurePolygonPoints.length > 0 && mousePos && (
        <Polyline
          positions={[measurePolygonPoints[measurePolygonPoints.length - 1], mousePos]}
          pathOptions={{
            color: '#f59e0b',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.65,
          }}
        />
      )}

      {/* Yellow vertex pins (matching Google Earth circular yellow outline & white fill) */}
      {measurePolygonPoints.map((pt, idx) => (
        <CircleMarker
          key={`measure-pt-${idx}`}
          center={pt}
          radius={6}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          {idx === 0 && measurePolygonPoints.length >= 3 && (
            <Tooltip permanent={false} direction="top">
              <span className="text-[10px] font-bold text-amber-700">Click first point to close shape</span>
            </Tooltip>
          )}
        </CircleMarker>
      ))}
    </>
  );
};

export const LeafletMap: React.FC = () => {
  const {
    parcels,
    buildings,
    undergroundAssets,
    gnssStations,
    layers,
    selectedParcelId,
    selectedBuildingId,
    selectParcel,
    selectBuilding,
    selectProperty,
    openBuilding3DModal,
    mapTheme,
    isMeasuringPolygon,
    measurePolygonPoints,
  } = useCadastralStore();

  const { role } = useAuthStore();
  const isAdminOrSuperAdmin = role === 'admin' || role === 'superadmin';
  const isLight = mapTheme === 'light';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[ORIGIN_LAT, ORIGIN_LNG]}
        zoom={17}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController />

        {/* Global OpenStreetMap (Clean Google style or Dark GIS theme) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={isLight ? '' : 'dark-tiles'}
          maxZoom={19}
          maxNativeZoom={18}
        />

        {/* 1. Cadastral Parcels Layer */}
        {layers.parcels &&
          parcels.map((p) => {
            const coords: [number, number][] = p.geometry.coordinates[0].map(
              ([lng, lat]) => [lat, lng]
            );
            const isSelected = selectedParcelId === p.parcel_id;

            return (
              <Polygon
                key={p.parcel_id}
                positions={coords}
                pathOptions={{
                  color: isSelected ? (isLight ? '#1a73e8' : '#00f0ff') : (isLight ? '#3b82f6' : '#0284c7'),
                  weight: isSelected ? 3 : 1.5,
                  fillColor: isSelected ? (isLight ? '#60a5fa' : '#0ea5e9') : (isLight ? '#bfdbfe' : '#0f172a'),
                  fillOpacity: isSelected ? 0.4 : (isLight ? 0.2 : 0.2),
                  dashArray: '5, 4',
                }}
                eventHandlers={{
                  click: () => selectParcel(p.parcel_id),
                }}
              >
                <Tooltip direction="center" permanent={false}>
                  <div className="text-xs font-sans font-medium">
                    <div className="font-bold text-blue-600">{p.parcel_id}</div>
                    <div>{p.survey_number}</div>
                    <div>{p.land_use} ({p.area} m²)</div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* 2. Building Footprints Layer */}
        {layers.buildings &&
          buildings.map((b) => {
            const coords: [number, number][] = b.geometry.coordinates[0].map(
              ([lng, lat]) => [lat, lng]
            );
            const isSelected = selectedBuildingId === b.building_id;

            return (
              <Polygon
                key={b.building_id}
                positions={coords}
                pathOptions={{
                  color: isSelected ? (isLight ? '#1d4ed8' : '#38bdf8') : (isLight ? '#475569' : '#64748b'),
                  weight: isSelected ? 3 : 2,
                  fillColor: isSelected ? (isLight ? '#2563eb' : '#0284c7') : (isLight ? '#64748b' : '#334155'),
                  fillOpacity: isSelected ? 0.85 : (isLight ? 0.6 : 0.6),
                }}
                eventHandlers={{
                  click: () => selectBuilding(b.building_id),
                  dblclick: (e) => {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    openBuilding3DModal(b.building_id);
                  },
                }}
              >
                <Tooltip direction="center">
                  <div className="text-xs font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">{b.building_id}</span>
                    <div>{b.height}m ({b.floor_count} Floors)</div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* 3. Underground Assets (Basements and Pipelines) */}
        {layers.underground &&
          undergroundAssets.map((u) => {
            if (u.geometry.type === 'LineString') {
              const coords: [number, number][] = u.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
              );
              return (
                <Polyline
                  key={u.asset_id}
                  positions={coords}
                  pathOptions={{
                    color: '#00f0ff',
                    weight: 4,
                    dashArray: '8, 6',
                    opacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () =>
                      selectProperty({
                        type: 'Underground Asset',
                        id: u.asset_id,
                        asset_type: u.asset_type,
                        z_range: `${u.z_min}m - ${u.z_max}m`,
                        owner: u.owner,
                      }),
                  }}
                >
                  <Tooltip>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {u.asset_type} (Z: {u.z_min}m to {u.z_max}m)
                    </span>
                  </Tooltip>
                </Polyline>
              );
            }
            return null;
          })}

        {/* 4. Elevated Flyover Path */}
        {layers.elevated &&
          undergroundAssets
            .filter((u) => u.asset_id.includes('ELEV') || u.asset_type.includes('Flyover'))
            .map((e) => {
              const coords: [number, number][] = e.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
              );
              return (
                <Polyline
                  key={e.asset_id}
                  positions={coords}
                  pathOptions={{
                    color: '#ec4899',
                    weight: 6,
                    opacity: 0.85,
                  }}
                >
                  <Tooltip>
                    <span className="text-xs font-mono font-bold text-pink-400">
                      Elevated Flyover (Z: {e.z_min}m to {e.z_max}m)
                    </span>
                  </Tooltip>
                </Polyline>
              );
            })}

        {/* 5. GNSS CORS Stations */}
        {layers.gnss &&
          gnssStations.map((g) => (
            <CircleMarker
              key={g.station_id}
              center={[g.latitude, g.longitude]}
              radius={8}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#fbbf24',
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{
                click: () =>
                  selectProperty({
                    type: 'GNSS Reference Station',
                    id: g.station_id,
                    elevation: `${g.elevation}m`,
                    accuracy: `±${g.accuracy}m`,
                  }),
              }}
            >
              <Tooltip direction="top">
                <div className="text-xs font-mono font-bold text-amber-300">
                  {g.station_id} (Elev: {g.elevation}m, Acc: ±{g.accuracy}m)
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        {/* 6. Google Earth Interactive Measure Tool Overlay (Admin & Super Admin only) */}
        {isAdminOrSuperAdmin && <GoogleEarthMeasureOverlay />}
      </MapContainer>

      {/* Google Earth Style Guidance Badge on Map (Admin & Super Admin only) */}
      {isAdminOrSuperAdmin && isMeasuringPolygon && measurePolygonPoints.length === 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all animate-in fade-in">
          <div className="bg-[#fde047] text-slate-950 font-semibold text-xs px-3.5 py-1.5 rounded-md shadow-xl border border-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
            <span>Add first point</span>
          </div>
        </div>
      )}

      {isAdminOrSuperAdmin && isMeasuringPolygon && measurePolygonPoints.length > 0 && measurePolygonPoints.length < 3 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all animate-in fade-in">
          <div className="bg-white/95 text-slate-800 font-medium text-xs px-3.5 py-1.5 rounded-full shadow-xl border border-slate-200 backdrop-blur-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Click next corner ({measurePolygonPoints.length} points placed)</span>
          </div>
        </div>
      )}
    </div>
  );
};

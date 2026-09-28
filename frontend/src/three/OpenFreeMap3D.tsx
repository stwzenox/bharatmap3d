import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCadastralStore } from '../state/useCadastralStore';

export const OpenFreeMap3D: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isInternalMoveRef = useRef(false);

  const {
    mapCenter,
    mapZoom,
    mapBearing,
    mapPitch,
    cameraPreset,
    syncSource,
    syncMapViewport,
    buildings,
    floors,
    verticalProperties,
    selectedBuildingId,
    selectedFloorId,
    selectBuilding,
    selectFloor,
    selectProperty,
    openBuilding3DModal,
    mapTheme,
    setMapTheme,
    isMeasuringPolygon,
    setIsMeasuringPolygon,
    measurePolygonPoints,
    addMeasurePolygonPoint,
    removeLastMeasurePolygonPoint,
    clearMeasurePolygon
  } = useCadastralStore();

  const isDark = mapTheme === 'dark';
  const [styleMode, setStyleMode] = useState<'liberty' | 'dark' | 'bright' | 'positron'>(
    isDark ? 'dark' : 'liberty'
  );

  // Sync styleMode with global theme
  useEffect(() => {
    setStyleMode(isDark ? 'dark' : 'liberty');
  }, [isDark]);

  // Helper function to scale polygon inwards towards centroid for rooftop penthouse core
  const scaleFootprintTowardsCentroid = (geom: any, factor: number = 0.42): any => {
    if (!geom || !geom.coordinates || !geom.coordinates[0]) return geom;
    try {
      const ring = geom.coordinates[0];
      if (ring.length < 3) return geom;
      let sumX = 0, sumY = 0;
      for (let i = 0; i < ring.length; i++) {
        sumX += ring[i][0];
        sumY += ring[i][1];
      }
      const cx = sumX / ring.length;
      const cy = sumY / ring.length;
      const insetRing = ring.map(([x, y]: [number, number]) => [
        cx + (x - cx) * factor,
        cy + (y - cy) * factor,
      ]);
      return {
        type: 'Polygon',
        coordinates: [insetRing],
      };
    } catch {
      return geom;
    }
  };

  // Construct High-Fidelity GeoJSON for Registered Cadastral Building Architecture
  const registeredFloorsGeoJson = useMemo(() => {
    const features: any[] = [];

    buildings.forEach((bldg) => {
      if (!bldg.geometry?.coordinates) return;

      const isBldgSelected = selectedBuildingId === bldg.building_id;
      const bldgName = bldg.building_name || bldg.building_type || `Building ${bldg.building_id}`;
      const primaryUlpin = bldg.primary_ulpin || `3D-ULPIN-${bldg.building_id}`;
      const groundElev = typeof bldg.ground_elevation === 'number' ? bldg.ground_elevation : 100.0;

      let bldgFloors = floors
        .filter((f) => f.building_id === bldg.building_id)
        .sort((a, b) => a.floor_number - b.floor_number);

      // Synthesize authentic floor strata if building does not have floor records yet
      if (bldgFloors.length === 0) {
        const count = Math.max(1, bldg.floor_count || Math.round((bldg.height || 18) / 3));
        const floorH = (bldg.height || 18.0) / count;
        bldgFloors = Array.from({ length: count }, (_, idx) => ({
          id: idx + 1,
          floor_id: `${bldg.building_id}-F${String(idx + 1).padStart(2, '0')}`,
          building_id: bldg.building_id,
          floor_number: idx + 1,
          z_min: groundElev + idx * floorH,
          z_max: groundElev + (idx + 1) * floorH,
          area: 1200,
          geometry: bldg.geometry,
        }));
      }

      // 1. SOLID GROUND FOUNDATION PLINTH (Anchors building to street & covers OSM footings)
      features.push({
        type: 'Feature',
        properties: {
          building_id: bldg.building_id,
          building_name: bldgName,
          primary_ulpin: primaryUlpin,
          floor_number: 0,
          feature_type: 'foundation',
          base_height: 0.0,
          top_height: 0.45,
          color: isBldgSelected ? '#0369a1' : (isDark ? '#0f172a' : '#1e293b'),
          opacity: 1.0,
          is_selected: isBldgSelected,
        },
        geometry: bldg.geometry,
      });

      // 2. MULTI-TIER FLOORS: STRUCTURAL SLABS + ARCHITECTURAL GLASS FACADES
      bldgFloors.forEach((fl) => {
        const isFloorSelected = selectedFloorId === fl.floor_id;
        const floorBase = Math.max(0.45, fl.z_min - groundElev);
        const floorTop = Math.max(floorBase + 2.8, fl.z_max - groundElev);
        const slabThickness = 0.35;

        // A. Reinforced Concrete Inter-Floor Structural Slab (Horizontal Floor Beam)
        const slabColor = isFloorSelected
          ? '#38bdf8'
          : isBldgSelected
          ? '#0c4a6e'
          : (isDark ? '#090d16' : '#1e293b');

        features.push({
          type: 'Feature',
          properties: {
            building_id: bldg.building_id,
            floor_id: fl.floor_id,
            floor_number: fl.floor_number,
            building_name: bldgName,
            primary_ulpin: primaryUlpin,
            feature_type: 'slab',
            base_height: floorBase,
            top_height: floorBase + slabThickness,
            color: slabColor,
            opacity: 1.0,
            is_selected: isFloorSelected || isBldgSelected,
          },
          geometry: fl.geometry || bldg.geometry,
        });

        // B. Architectural Glass Facade & Living Strata Volume
        const apts = verticalProperties.filter((vp) => vp.floor_id === fl.floor_id);
        if (apts.length > 1) {
          // Multi-unit Apartment Subdivisions (Strata Units)
          const jewelPalette = ['#059669', '#2563eb', '#d97706', '#7c3aed'];
          const selectedPalette = ['#10b981', '#38bdf8', '#f59e0b', '#a855f7'];

          apts.forEach((apt, idx) => {
            const aptColor = isFloorSelected
              ? '#00f0ff'
              : isBldgSelected
              ? selectedPalette[idx % 4]
              : jewelPalette[idx % 4];

            features.push({
              type: 'Feature',
              properties: {
                building_id: bldg.building_id,
                floor_id: fl.floor_id,
                floor_number: fl.floor_number,
                vertical_parcel_id: apt.vertical_parcel_id,
                building_name: bldgName,
                primary_ulpin: apt.vertical_parcel_id || primaryUlpin,
                feature_type: 'subdivision',
                base_height: floorBase + slabThickness,
                top_height: floorTop,
                color: aptColor,
                opacity: isFloorSelected ? 0.96 : (isBldgSelected ? 0.90 : 0.86),
                is_selected: isFloorSelected || isBldgSelected,
                is_subdivision: true,
              },
              geometry: apt.geometry || fl.geometry || bldg.geometry,
            });
          });
        } else {
          // Standard Single-Floor Architectural Glass
          let glassColor: string;
          if (isFloorSelected) {
            glassColor = '#00f0ff';
          } else if (isBldgSelected) {
            glassColor = fl.floor_number % 2 === 0 ? '#0284c7' : '#0ea5e9';
          } else {
            // High visual fidelity: Grand ground-level lobby + alternating upper floor glass
            if (fl.floor_number === 1) {
              glassColor = isDark ? '#0284c7' : '#0369a1';
            } else {
              glassColor = fl.floor_number % 2 === 0 ? '#1d4ed8' : '#2563eb';
            }
          }

          features.push({
            type: 'Feature',
            properties: {
              building_id: bldg.building_id,
              floor_id: fl.floor_id,
              floor_number: fl.floor_number,
              building_name: bldgName,
              primary_ulpin: primaryUlpin,
              feature_type: 'facade',
              base_height: floorBase + slabThickness,
              top_height: floorTop,
              color: glassColor,
              opacity: isFloorSelected ? 0.96 : (isBldgSelected ? 0.86 : 0.82),
              is_selected: isFloorSelected || isBldgSelected,
              is_subdivision: false,
            },
            geometry: fl.geometry || bldg.geometry,
          });
        }
      });

      // 3. ROOFTOP CROWN: CEILING SLAB + PARAPET WALL + ELEVATOR SERVICE CORE (MUMTY)
      if (bldgFloors.length > 0) {
        const roofHeight = Math.max(...bldgFloors.map((f) => Math.max(0.45, f.z_max - groundElev)));

        // A. Rooftop Structural Ceiling Slab
        features.push({
          type: 'Feature',
          properties: {
            building_id: bldg.building_id,
            building_name: bldgName,
            primary_ulpin: primaryUlpin,
            feature_type: 'roof_slab',
            base_height: roofHeight,
            top_height: roofHeight + 0.35,
            color: isBldgSelected ? '#0284c7' : (isDark ? '#0f172a' : '#1e293b'),
            opacity: 1.0,
            is_selected: isBldgSelected,
          },
          geometry: bldg.geometry,
        });

        // B. Rooftop Perimeter Parapet Barrier Wall (0.9m high)
        features.push({
          type: 'Feature',
          properties: {
            building_id: bldg.building_id,
            building_name: bldgName,
            primary_ulpin: primaryUlpin,
            feature_type: 'parapet',
            base_height: roofHeight + 0.35,
            top_height: roofHeight + 1.25,
            color: isBldgSelected ? '#38bdf8' : (isDark ? '#1e293b' : '#334155'),
            opacity: 0.92,
            is_selected: isBldgSelected,
          },
          geometry: bldg.geometry,
        });

        // C. Rooftop Elevator Penthouse / Stair Mumty Core (scaled inset)
        const penthouseGeom = scaleFootprintTowardsCentroid(bldg.geometry, 0.42);
        features.push({
          type: 'Feature',
          properties: {
            building_id: bldg.building_id,
            building_name: bldgName,
            primary_ulpin: primaryUlpin,
            feature_type: 'penthouse',
            base_height: roofHeight + 0.35,
            top_height: roofHeight + 2.85,
            color: isBldgSelected ? '#0369a1' : (isDark ? '#334155' : '#475569'),
            opacity: 0.96,
            is_selected: isBldgSelected,
          },
          geometry: penthouseGeom,
        });

        // D. Penthouse Top Cap
        features.push({
          type: 'Feature',
          properties: {
            building_id: bldg.building_id,
            building_name: bldgName,
            primary_ulpin: primaryUlpin,
            feature_type: 'penthouse_cap',
            base_height: roofHeight + 2.85,
            top_height: roofHeight + 3.10,
            color: isBldgSelected ? '#00f0ff' : (isDark ? '#0f172a' : '#1e293b'),
            opacity: 1.0,
            is_selected: isBldgSelected,
          },
          geometry: penthouseGeom,
        });
      }
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [buildings, floors, verticalProperties, selectedBuildingId, selectedFloorId, isDark]);

  // Initialize MapLibre GL 3D Map connected to OpenFreeMap with overzoom support
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isDisposed = false;
    let map: maplibregl.Map | null = null;
    let hoverPopup: maplibregl.Popup | null = null;

    const setupMap = async () => {
      try {
        const ml = (typeof window !== 'undefined' && (window as any).maplibregl) ? (window as any).maplibregl : maplibregl;

        const styleUrl = `https://tiles.openfreemap.org/styles/${styleMode}`;
        const response = await fetch(styleUrl);
        const styleJson = await response.json();

        if (isDisposed || !mapContainerRef.current) return;

        // Ensure source has explicit maxzoom: 14 so MapLibre overzooms up to zoom 20+
        if (styleJson.sources && styleJson.sources.openmaptiles) {
          styleJson.sources.openmaptiles.maxzoom = 14;
        }

        const activeMap: maplibregl.Map = new ml.Map({
          container: mapContainerRef.current,
          style: styleJson,
          center: [mapCenter[1], mapCenter[0]], // [lng, lat]
          zoom: mapZoom || 16.5,
          pitch: mapPitch || 58,
          bearing: mapBearing || 0,
          maxPitch: 82,
          maxZoom: 20,
        });

        map = activeMap;
        mapRef.current = activeMap;
        (window as any).map3d = activeMap;

        activeMap.on('error', (e) => {
          console.warn('[OpenFreeMap3D] MapLibre warning/error:', e.error?.message || e);
        });

        // Attach registered cadastral building floors when style is ready
        const onStyleReady = () => {
          if (isDisposed) return;

          // Configure directional sun lighting for realistic 3D wall shading and depth
          try {
            if ((activeMap as any).setLight) {
              (activeMap as any).setLight({
                anchor: 'map',
                color: '#ffffff',
                intensity: 0.45,
                position: [1.5, 90, 45],
              });
            }
          } catch {
            // Optional light setup
          }

          // 1. Ensure OSM 3D buildings act as an elegant, subdued backdrop
          if (activeMap.getLayer('building-3d')) {
            activeMap.setPaintProperty(
              'building-3d',
              'fill-extrusion-color',
              styleMode === 'dark' ? '#1e293b' : '#94a3b8'
            );
            activeMap.setPaintProperty('building-3d', 'fill-extrusion-opacity', 0.65);
            activeMap.setPaintProperty('building-3d', 'fill-extrusion-vertical-gradient', true);
          }

          // 2. Create interactive hover tooltip popup
          hoverPopup = new ml.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 14,
            className: 'cadastral-floor-popup',
          });

          // 3. Registered Cadastral Buildings Floor Strata Source & 3D Layer
          if (!activeMap.getSource('cadastral-registered-floors')) {
            activeMap.addSource('cadastral-registered-floors', {
              type: 'geojson',
              data: registeredFloorsGeoJson as any,
            });

            activeMap.addLayer({
              id: 'cadastral-registered-floors-3d',
              type: 'fill-extrusion',
              source: 'cadastral-registered-floors',
              paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-base': ['get', 'base_height'],
                'fill-extrusion-height': ['get', 'top_height'],
                'fill-extrusion-opacity': 0.94,
                'fill-extrusion-vertical-gradient': true,
              },
            });

            // Interactive Hover Tooltip Card
            activeMap.on('mousemove', 'cadastral-registered-floors-3d', (e: any) => {
              if (useCadastralStore.getState().isMeasuringPolygon) {
                activeMap.getCanvas().style.cursor = 'crosshair';
                hoverPopup?.remove();
                return;
              }
              if (e.features && e.features.length > 0) {
                const feat = e.features[0];
                const props = feat.properties as any;
                activeMap.getCanvas().style.cursor = 'pointer';

                const typeLabel =
                  props.feature_type === 'penthouse'
                    ? 'Rooftop Core / Mumty'
                    : props.feature_type === 'parapet'
                    ? 'Roof Parapet Wall'
                    : props.feature_type === 'slab'
                    ? 'Structural Floor Slab'
                    : props.is_subdivision
                    ? 'Apartment Strata Unit'
                    : `Floor ${props.floor_number}`;

                const heightDiff = (props.top_height - props.base_height).toFixed(1);

                hoverPopup
                  ?.setLngLat(e.lngLat)
                  .setHTML(`
                    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 6px 8px; color: #0f172a; line-height: 1.35;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 8px;">
                        <span style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">${typeLabel}</span>
                        ${props.floor_number > 0 ? `<span style="font-size: 10px; padding: 1px 6px; border-radius: 9999px; background: #e0f2fe; color: #0369a1; font-weight: 700;">L${props.floor_number}</span>` : ''}
                      </div>
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                        ${props.building_name || `Building ${props.building_id}`}
                      </div>
                      <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-bottom: 6px;">
                        ${props.primary_ulpin || props.building_id}
                      </div>
                      <div style="display: flex; gap: 8px; font-size: 10px; color: #475569; background: #f1f5f9; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
                        <span>Height: <strong>${heightDiff}m</strong></span>
                        <span>Elev: <strong>${props.base_height.toFixed(1)}m</strong></span>
                      </div>
                      <div style="font-size: 9px; color: #94a3b8; text-align: center; margin-top: 5px;">
                        Click to select • Double-click for 3D Twin
                      </div>
                    </div>
                  `)
                  .addTo(activeMap);
              }
            });

            activeMap.on('mouseleave', 'cadastral-registered-floors-3d', () => {
              activeMap.getCanvas().style.cursor = useCadastralStore.getState().isMeasuringPolygon ? 'crosshair' : '';
              hoverPopup?.remove();
            });

            // Click on registered building floor
            activeMap.on('click', 'cadastral-registered-floors-3d', (e: any) => {
              // If in measurement mode, let the global map click capture the point
              if (useCadastralStore.getState().isMeasuringPolygon) {
                return;
              }
              if (e.features && e.features.length > 0) {
                const feat = e.features[0];
                const props = feat.properties as any;
                if (props.building_id) {
                  selectBuilding(props.building_id);
                  if (props.floor_id) selectFloor(props.floor_id);
                  selectProperty({
                    type: 'Building',
                    id: props.building_id,
                    ulpin_id: props.primary_ulpin,
                    name: props.building_name,
                    floor_number: props.floor_number,
                    base_height: props.base_height,
                    top_height: props.top_height,
                  });
                }
              }
            });

            activeMap.on('dblclick', 'cadastral-registered-floors-3d', (e: any) => {
              if (e.features && e.features.length > 0) {
                const props = e.features[0].properties as any;
                if (props.building_id) {
                  openBuilding3DModal(props.building_id);
                }
              }
            });
          }

          // 4. Cadastral Measurement Polygon Source & Layers (Google Earth Style)
          if (!activeMap.getSource('cadastral-measure-polygon')) {
            activeMap.addSource('cadastral-measure-polygon', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
            });

            // Active Footprint Fill
            activeMap.addLayer({
              id: 'cadastral-measure-fill',
              type: 'fill',
              source: 'cadastral-measure-polygon',
              filter: ['==', '$type', 'Polygon'],
              paint: {
                'fill-color': '#f59e0b',
                'fill-opacity': 0.35,
              },
            });

            // Boundary Perimeter Line
            activeMap.addLayer({
              id: 'cadastral-measure-line',
              type: 'line',
              source: 'cadastral-measure-polygon',
              paint: {
                'line-color': '#f59e0b',
                'line-width': 3,
                'line-dasharray': [2, 1],
              },
            });

            // Vertex Markers (Yellow circular rings with white fill)
            activeMap.addLayer({
              id: 'cadastral-measure-points',
              type: 'circle',
              source: 'cadastral-measure-polygon',
              filter: ['==', '$type', 'Point'],
              paint: {
                'circle-radius': 6.5,
                'circle-color': '#ffffff',
                'circle-stroke-color': '#f59e0b',
                'circle-stroke-width': 2.5,
              },
            });
          }
        };

        if (activeMap.isStyleLoaded()) {
          onStyleReady();
        } else {
          activeMap.on('style.load', onStyleReady);
        }
        activeMap.on('load', onStyleReady);

        // Global Map Click Handler for 3D Polygon Measurement
        activeMap.on('click', (e) => {
          const store = useCadastralStore.getState();
          if (store.isMeasuringPolygon) {
            store.addMeasurePolygonPoint([e.lngLat.lat, e.lngLat.lng]);
          }
        });

        // Global Mousemove for crosshair cursor in measurement mode
        activeMap.on('mousemove', () => {
          if (useCadastralStore.getState().isMeasuringPolygon) {
            activeMap.getCanvas().style.cursor = 'crosshair';
          }
        });

        // 3. Bidirectional Camera Sync: 3D -> 2D
        const handleMove = () => {
          if (isInternalMoveRef.current) return;
          const center = activeMap.getCenter();
          const zoom = activeMap.getZoom();
          const bearing = activeMap.getBearing();
          const pitch = activeMap.getPitch();

          syncMapViewport([center.lat, center.lng], zoom, '3d', bearing, pitch);
        };

        activeMap.on('move', handleMove);

        // Resize map after layout settling
        setTimeout(() => {
          activeMap.resize();
        }, 150);

      } catch (err) {
        console.error('[OpenFreeMap3D] Failed to load OpenFreeMap style:', err);
      }
    };

    setupMap();

    // ResizeObserver to automatically resize map when split pane adjusts
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      if (hoverPopup) {
        hoverPopup.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [styleMode]);

  // Update Registered Floors GeoJSON whenever store data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('cadastral-registered-floors') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(registeredFloorsGeoJson as any);
    }
  }, [registeredFloorsGeoJson]);

  // Construct GeoJSON FeatureCollection for Live 3D Polygon Measurement
  const measureGeoJson = useMemo(() => {
    if (!isMeasuringPolygon && measurePolygonPoints.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    const features: any[] = [];

    // Vertex points
    measurePolygonPoints.forEach(([lat, lng], idx) => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          index: idx + 1,
        },
      });
    });

    // Connecting line string
    if (measurePolygonPoints.length >= 2) {
      const lineCoords = measurePolygonPoints.map(([lat, lng]) => [lng, lat]);
      if (measurePolygonPoints.length >= 3) {
        lineCoords.push([measurePolygonPoints[0][1], measurePolygonPoints[0][0]]);
      }
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: lineCoords,
        },
        properties: {},
      });
    }

    // Filled polygon (when 3 or more vertices)
    if (measurePolygonPoints.length >= 3) {
      const ring = [
        ...measurePolygonPoints.map(([lat, lng]) => [lng, lat]),
        [measurePolygonPoints[0][1], measurePolygonPoints[0][0]],
      ];
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
        properties: {},
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [measurePolygonPoints, isMeasuringPolygon]);

  // Sync measurement polygon to MapLibre source
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('cadastral-measure-polygon') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(measureGeoJson as any);
    }
  }, [measureGeoJson]);

  // Sync cursor style with measuring mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.getCanvas().style.cursor = isMeasuringPolygon ? 'crosshair' : '';
    } catch {}
  }, [isMeasuringPolygon]);

  // 4. Bidirectional Camera Sync: 2D -> 3D
  useEffect(() => {
    const map = mapRef.current;
    if (!map || syncSource !== '2d') return;

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    const dLat = Math.abs(currentCenter.lat - mapCenter[0]);
    const dLng = Math.abs(currentCenter.lng - mapCenter[1]);
    const dZoom = Math.abs(currentZoom - mapZoom);

    if (dLat > 0.000005 || dLng > 0.000005 || dZoom > 0.04) {
      isInternalMoveRef.current = true;
      map.jumpTo({
        center: [mapCenter[1], mapCenter[0]],
        zoom: mapZoom,
      });
      setTimeout(() => {
        isInternalMoveRef.current = false;
      }, 50);
    }
  }, [mapCenter, mapZoom, syncSource]);

  // 5. Camera Preset Quick Angles (3D, 2D Top, Side, Iso)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (cameraPreset === 'top') {
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    } else if (cameraPreset === 'side') {
      map.easeTo({ pitch: 75, bearing: 90, duration: 600 });
    } else if (cameraPreset === 'isometric') {
      map.easeTo({ pitch: 60, bearing: 45, duration: 600 });
    } else {
      map.easeTo({ pitch: 58, bearing: 0, duration: 600 });
    }
  }, [cameraPreset]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-900">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Interactive 3D Measurement Guidance HUD Overlay */}
      {isMeasuringPolygon && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-amber-500/50 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="font-semibold text-amber-300">
            {measurePolygonPoints.length === 0
              ? 'Click anywhere on the 3D map to place the 1st building footprint corner'
              : measurePolygonPoints.length < 3
              ? `Outlining footprint: ${measurePolygonPoints.length} corner(s) placed (click ≥ 3 corners to enclose)`
              : `Footprint enclosed: ${measurePolygonPoints.length} vertices. Click "Save to project / Register 3D Building"`}
          </span>
          {measurePolygonPoints.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-2 shrink-0">
              <button
                type="button"
                onClick={removeLastMeasurePolygonPoint}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                title="Undo last point"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={clearMeasurePolygon}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                title="Clear all points"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

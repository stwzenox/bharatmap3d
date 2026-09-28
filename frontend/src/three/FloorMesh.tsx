import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Floor, VerticalParcel } from '../types';
import { createExtrudedFootprintGeometry } from '../utils/coordinates';
import { useCadastralStore } from '../state/useCadastralStore';

interface FloorMeshProps {
  floor: Floor;
  verticalParcels: VerticalParcel[];
  isParentSelected: boolean;
}

export const FloorMesh: React.FC<FloorMeshProps> = ({
  floor,
  verticalParcels,
  isParentSelected
}) => {
  const {
    selectedFloorId,
    selectedVerticalParcelId,
    hoveredId,
    selectFloor,
    selectVerticalParcel,
    openBuilding3DModal,
    setHoveredId,
    isExplodedView,
    explodeAmount,
    zMinClip,
    zMaxClip,
    isWireframe,
    isTransparent
  } = useCadastralStore();

  // Vertical explode offset
  const explodeY = isExplodedView ? (floor.floor_number - 1) * explodeAmount : 0;

  // Check Z-Clipping
  const isClipped = floor.z_max < zMinClip || floor.z_min > zMaxClip;

  // Check if this floor has apartment subdivisions (e.g. B001 Floor 3)
  const floorApartments = useMemo(() => {
    return verticalParcels.filter(vp => vp.floor_id === floor.floor_id);
  }, [verticalParcels, floor.floor_id]);

  const isSubdivided = floorApartments.length > 1;

  // Base floor geometry and crisp edge outline
  const { baseGeometry, edgeGeometry } = useMemo(() => {
    if (isSubdivided) return { baseGeometry: null, edgeGeometry: null };
    const ring = floor.geometry.coordinates[0];
    const geom = createExtrudedFootprintGeometry(ring, floor.z_min, floor.z_max);
    const edges = geom ? new THREE.EdgesGeometry(geom, 22) : null;
    return { baseGeometry: geom, edgeGeometry: edges };
  }, [floor, isSubdivided]);

  // Subdivided apartment geometries
  const aptGeometries = useMemo(() => {
    if (!isSubdivided) return [];
    return floorApartments.map(apt => {
      const ring = apt.geometry.coordinates[0];
      const geom = createExtrudedFootprintGeometry(ring, apt.z_min, apt.z_max);
      const edges = geom ? new THREE.EdgesGeometry(geom, 22) : null;
      return {
        apt,
        geom,
        edges
      };
    });
  }, [floorApartments, isSubdivided]);

  if (isClipped) return null;

  const isFloorSelected = selectedFloorId === floor.floor_id;
  const isFloorHovered = hoveredId === floor.floor_id;

  // Premium jewel-tone palette for apartment subdivisions (Emerald, Sapphire, Amber, Amethyst)
  const getAptColor = (index: number, isSelected: boolean) => {
    if (isSelected) return '#00f0ff';
    const colors = ['#059669', '#2563eb', '#d97706', '#7c3aed'];
    return colors[index % colors.length];
  };

  // Alternating architectural floor tone for high visual fidelity
  const getFloorBaseColor = () => {
    if (isFloorSelected) return '#00f0ff';
    if (isParentSelected) return '#0284c7';
    if (isFloorHovered) return '#38bdf8';
    // Subtle alternating tones per floor level
    return floor.floor_number % 2 === 0 ? '#334e68' : '#486581';
  };

  return (
    <group position={[0, explodeY, 0]}>
      {isSubdivided ? (
        // Render 3D Apartment Subdivisions (B001 Floor 3)
        aptGeometries.map(({ apt, geom, edges }, idx) => {
          if (!geom) return null;
          const isAptSelected = selectedVerticalParcelId === apt.vertical_parcel_id;
          const isAptHovered = hoveredId === apt.vertical_parcel_id;

          return (
            <group key={apt.vertical_parcel_id}>
              {/* Solid Mesh */}
              <mesh
                geometry={geom}
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  selectVerticalParcel(apt.vertical_parcel_id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredId(apt.vertical_parcel_id);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredId(null);
                }}
              >
                <meshStandardMaterial
                  color={getAptColor(idx, isAptSelected)}
                  emissive={isAptSelected ? '#00f0ff' : isAptHovered ? '#38bdf8' : getAptColor(idx, false)}
                  emissiveIntensity={isAptSelected ? 0.75 : isAptHovered ? 0.45 : 0.2}
                  roughness={0.2}
                  metalness={0.4}
                  wireframe={isWireframe}
                  transparent={isTransparent}
                  opacity={isTransparent ? 0.45 : 0.95}
                />
              </mesh>

              {/* Crisp Glowing Architectural Edges */}
              {edges && (
                <lineSegments geometry={edges}>
                  <lineBasicMaterial
                    color={isAptSelected ? '#ffffff' : '#00f0ff'}
                    linewidth={1.8}
                    transparent={true}
                    opacity={isAptSelected ? 1.0 : 0.8}
                  />
                </lineSegments>
              )}
            </group>
          );
        })
      ) : (
        // Render Whole Floor Slab with Crisp Architectural Facade
        baseGeometry && (
          <group>
            {/* Solid Floor Volume */}
            <mesh
              geometry={baseGeometry}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                selectFloor(floor.floor_id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openBuilding3DModal(floor.building_id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredId(floor.floor_id);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredId(null);
              }}
            >
              <meshStandardMaterial
                color={getFloorBaseColor()}
                emissive={isFloorSelected ? '#0284c7' : isFloorHovered ? '#0ea5e9' : isParentSelected ? '#0369a1' : '#1e293b'}
                emissiveIntensity={isFloorSelected ? 0.65 : isFloorHovered ? 0.45 : isParentSelected ? 0.3 : 0.15}
                roughness={0.25}
                metalness={0.45}
                wireframe={isWireframe}
                transparent={isTransparent}
                opacity={isTransparent ? 0.35 : 0.95}
              />
            </mesh>

            {/* Architectural Floor Edge Lines */}
            {edgeGeometry && (
              <lineSegments geometry={edgeGeometry}>
                <lineBasicMaterial
                  color={isFloorSelected ? '#ffffff' : isParentSelected ? '#38bdf8' : '#7dd3fc'}
                  linewidth={1.5}
                  transparent={true}
                  opacity={isFloorSelected ? 1.0 : isParentSelected ? 0.85 : 0.5}
                />
              </lineSegments>
            )}
          </group>
        )
      )}
    </group>
  );
};

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Building } from '../types';
import { createExtrudedFootprintGeometry, geographicToLocal } from '../utils/coordinates';
import { useCadastralStore } from '../state/useCadastralStore';
import { FloorMesh } from './FloorMesh';
import { IndianRooftopProps } from './IndianArchitecture';
import { UlpinBadge3D } from './UlpinBadge3D';

interface BuildingMeshProps {
  building: Building;
}

export const BuildingMesh: React.FC<BuildingMeshProps> = ({ building }) => {
  const {
    floors,
    verticalProperties,
    selectedBuildingId,
    hoveredId,
    selectBuilding,
    openBuilding3DModal,
    setHoveredId,
    isFloorView,
    zMinClip,
    zMaxClip,
    isWireframe,
    isTransparent
  } = useCadastralStore();

  const isSelected = selectedBuildingId === building.building_id;
  const isHovered = hoveredId === building.building_id;

  // Filter building's floors
  const buildingFloors = useMemo(() => {
    return floors
      .filter(f => f.building_id === building.building_id)
      .sort((a, b) => a.floor_number - b.floor_number);
  }, [floors, building.building_id]);

  // Unified solid geometry and crisp architectural edge outlines
  const { solidGeometry, edgeGeometry } = useMemo(() => {
    if (isFloorView) return { solidGeometry: null, edgeGeometry: null };
    const ring = building.geometry.coordinates[0];
    const geom = createExtrudedFootprintGeometry(ring, building.ground_elevation, building.roof_elevation);
    const edges = geom ? new THREE.EdgesGeometry(geom, 22) : null;
    return { solidGeometry: geom, edgeGeometry: edges };
  }, [building, isFloorView]);

  // Rooftop metadata for Indian urban props (Sintex tanks, mumty)
  const rooftopMeta = useMemo(() => {
    const ring = building.geometry.coordinates[0];
    if (!ring || ring.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    ring.forEach(([lng, lat]) => {
      const [x, , z] = geographicToLocal(lat, lng, 0);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });
    return {
      centroid: [(minX + maxX) / 2, building.roof_elevation, (minZ + maxZ) / 2] as [number, number, number],
      width: Math.max(maxX - minX, 12),
      depth: Math.max(maxZ - minZ, 12)
    };
  }, [building]);

  // Z-Clipping test
  if (building.roof_elevation < zMinClip || building.ground_elevation > zMaxClip) {
    return null;
  }

  return (
    <group>
      {isFloorView ? (
        // Segmented Floor Mode
        <group
          onDoubleClick={(e) => {
            e.stopPropagation();
            openBuilding3DModal(building.building_id);
          }}
        >
          {buildingFloors.map((fl) => (
            <FloorMesh
              key={fl.floor_id}
              floor={fl}
              verticalParcels={verticalProperties}
              isParentSelected={isSelected}
            />
          ))}
        </group>
      ) : (
        // Solid Monolithic Building Mode with Architectural Shading & Edges
        solidGeometry && (
          <group>
            <mesh
              geometry={solidGeometry}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                selectBuilding(building.building_id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openBuilding3DModal(building.building_id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredId(building.building_id);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredId(null);
              }}
            >
              <meshStandardMaterial
                color={isSelected ? '#0284c7' : isHovered ? '#38bdf8' : '#27384e'}
                emissive={isSelected ? '#00f0ff' : isHovered ? '#0ea5e9' : '#0c1a29'}
                emissiveIntensity={isSelected ? 0.65 : isHovered ? 0.4 : 0.18}
                roughness={0.25}
                metalness={0.45}
                wireframe={isWireframe}
                transparent={isTransparent}
                opacity={isTransparent ? 0.35 : 0.96}
              />
            </mesh>

            {/* Crisp Architectural Outlines */}
            {edgeGeometry && (
              <lineSegments geometry={edgeGeometry}>
                <lineBasicMaterial
                  color={isSelected ? '#ffffff' : isHovered ? '#00f0ff' : '#7dd3fc'}
                  linewidth={1.5}
                  transparent={true}
                  opacity={isSelected ? 1.0 : isHovered ? 0.95 : 0.55}
                />
              </lineSegments>
            )}

            {/* Indian Rooftop Architecture (Water Tanks, Mumty, Antennas) */}
            {rooftopMeta && !isWireframe && (
              <IndianRooftopProps
                centroid={rooftopMeta.centroid}
                width={rooftopMeta.width}
                depth={rooftopMeta.depth}
                buildingId={building.building_id}
              />
            )}

            {/* 3D Holographic ULPIN Identification Badge */}
            {isSelected && rooftopMeta && (
              <UlpinBadge3D
                building={building}
                position={[rooftopMeta.centroid[0], rooftopMeta.centroid[1] + 3.8, rooftopMeta.centroid[2]]}
              />
            )}
          </group>
        )
      )}
    </group>
  );
};


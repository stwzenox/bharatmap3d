import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ORIGIN_ELEVATION } from '../utils/coordinates';
import { useCadastralStore } from '../state/useCadastralStore';
import { AutoRickshaw, BescomTransformer, UrbanTree, StreetLamp } from './IndianStreetProps';

interface RoadSegment {
  x: number;
  z: number;
  width: number;
  length: number;
  isVertical?: boolean;
}

const ROAD_SEGMENTS: RoadSegment[] = [
  // Arterial East-West Avenues
  { x: 0, z: -140, width: 14, length: 340 },
  { x: 0, z: -40, width: 12, length: 340 },
  { x: 0, z: 60, width: 12, length: 340 },
  { x: 0, z: 150, width: 16, length: 340 },

  // Cross North-South Streets
  { x: -110, z: 5, width: 10, length: 330, isVertical: true },
  { x: -20, z: 5, width: 10, length: 330, isVertical: true },
  { x: 70, z: 5, width: 10, length: 330, isVertical: true },
  { x: 140, z: 5, width: 10, length: 330, isVertical: true },
];

export const RoadNetwork: React.FC = () => {
  const { layers, mapTheme } = useCadastralStore();
  const isLight = mapTheme === 'light';
  const roadY = ORIGIN_ELEVATION + 0.18;

  // Road asphalt & curb materials
  const asphaltColor = isLight ? '#334155' : '#0f172a';
  const curbColor = isLight ? '#94a3b8' : '#334155';
  const markingsColor = '#f8fafc';

  if (!layers.terrain) return null;

  return (
    <group position={[0, roadY, 0]}>
      {/* 1. Asphalt Road Surfaces & Curbs */}
      {ROAD_SEGMENTS.map((seg, idx) => {
        const geomW = seg.isVertical ? seg.width : seg.length;
        const geomL = seg.isVertical ? seg.length : seg.width;

        return (
          <group key={idx} position={[seg.x, 0, seg.z]}>
            {/* Main Asphalt Surface */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[geomW, geomL]} />
              <meshStandardMaterial
                color={asphaltColor}
                roughness={0.85}
                metalness={0.15}
              />
            </mesh>

            {/* Curbs / Sidewalk Borders */}
            {seg.isVertical ? (
              <>
                <mesh position={[-geomW / 2 - 0.4, 0.08, 0]}>
                  <boxGeometry args={[0.8, 0.16, geomL]} />
                  <meshStandardMaterial color={curbColor} roughness={0.9} />
                </mesh>
                <mesh position={[geomW / 2 + 0.4, 0.08, 0]}>
                  <boxGeometry args={[0.8, 0.16, geomL]} />
                  <meshStandardMaterial color={curbColor} roughness={0.9} />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[0, 0.08, -geomL / 2 - 0.4]}>
                  <boxGeometry args={[geomW, 0.16, 0.8]} />
                  <meshStandardMaterial color={curbColor} roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.08, geomL / 2 + 0.4]}>
                  <boxGeometry args={[geomW, 0.16, 0.8]} />
                  <meshStandardMaterial color={curbColor} roughness={0.9} />
                </mesh>
              </>
            )}

            {/* White Center Dashes */}
            {Array.from({ length: 12 }).map((_, di) => {
              const step = (di - 5.5) * 26;
              const posX = seg.isVertical ? 0 : step;
              const posZ = seg.isVertical ? step : 0;
              const dashW = seg.isVertical ? 0.35 : 4.0;
              const dashL = seg.isVertical ? 4.0 : 0.35;

              return (
                <mesh
                  key={di}
                  position={[posX, 0.02, posZ]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <planeGeometry args={[dashW, dashL]} />
                  <meshBasicMaterial color={markingsColor} transparent opacity={0.8} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* 2. Indian Street Trees (Gulmohar, Neem, Palm along sidewalks) */}
      <UrbanTree position={[-125, 0, -148]} type="gulmohar" />
      <UrbanTree position={[-75, 0, -148]} type="neem" />
      <UrbanTree position={[-10, 0, -148]} type="palm" />
      <UrbanTree position={[45, 0, -148]} type="gulmohar" />
      <UrbanTree position={[105, 0, -148]} type="neem" />

      <UrbanTree position={[-125, 0, -32]} type="neem" />
      <UrbanTree position={[-60, 0, -32]} type="palm" />
      <UrbanTree position={[15, 0, -32]} type="gulmohar" />
      <UrbanTree position={[90, 0, -32]} type="neem" />

      <UrbanTree position={[-125, 0, 68]} type="palm" />
      <UrbanTree position={[-45, 0, 68]} type="gulmohar" />
      <UrbanTree position={[25, 0, 68]} type="neem" />
      <UrbanTree position={[110, 0, 68]} type="palm" />

      {/* 3. Modern Roadside Street Lamps */}
      <StreetLamp position={[-100, 0, -148]} rotationY={0} />
      <StreetLamp position={[-30, 0, -148]} rotationY={0} />
      <StreetLamp position={[40, 0, -148]} rotationY={0} />
      <StreetLamp position={[-100, 0, -32]} rotationY={Math.PI} />
      <StreetLamp position={[-30, 0, -32]} rotationY={Math.PI} />
      <StreetLamp position={[40, 0, -32]} rotationY={Math.PI} />
      <StreetLamp position={[-100, 0, 68]} rotationY={0} />
      <StreetLamp position={[40, 0, 68]} rotationY={0} />

      {/* 4. Iconic Indian Auto-Rickshaws on Roadside */}
      <AutoRickshaw position={[-35, 0, -36]} rotationY={0.4} />
      <AutoRickshaw position={[55, 0, 64]} rotationY={-Math.PI / 2} />
      <AutoRickshaw position={[-85, 0, -136]} rotationY={Math.PI / 2} />

      {/* 5. Indian Roadside BESCOM Electricity Transformers */}
      <BescomTransformer position={[-118, 0, -28]} rotationY={0} />
      <BescomTransformer position={[132, 0, 72]} rotationY={Math.PI / 2} />
    </group>
  );
};

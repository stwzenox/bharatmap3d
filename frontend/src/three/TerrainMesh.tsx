import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';

export const TerrainMesh: React.FC = () => {
  const { terrainData, layers, zMinClip, mapTheme } = useCadastralStore();
  const isLight = mapTheme === 'light';

  const geometry = useMemo(() => {
    const size = terrainData?.size || 2500;
    const res = terrainData?.resolution || 40;
    const planeGeom = new THREE.PlaneGeometry(size, size, res - 1, res - 1);
    
    // PlaneGeometry is on XY plane, rotate to XZ plane
    planeGeom.rotateX(-Math.PI / 2);

    const pos = planeGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (terrainData?.points && terrainData.points[i]) {
        pos.setY(i, terrainData.points[i].elevation);
      } else {
        // Fallback smooth regional topography (base 98.0m with gentle undulating relief)
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const elev = 98.0 + 3.0 * Math.sin(x / 400.0) + 2.0 * Math.cos(z / 450.0);
        pos.setY(i, elev);
      }
    }

    planeGeom.computeVertexNormals();
    return planeGeom;
  }, [terrainData]);

  if (!layers.terrain || zMinClip > 105) return null;

  return (
    <group>
      {/* 1. Base Regional Terrain Mesh (2.5km x 2.5km) */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color={isLight ? '#e2e8f0' : '#0c1322'}
          roughness={0.88}
          metalness={0.08}
          wireframe={false}
          flatShading={true}
        />
      </mesh>

      {/* 2. Topographic Wireframe Overlay */}
      <mesh geometry={geometry} position={[0, 0.05, 0]}>
        <meshBasicMaterial
          color={isLight ? '#94a3b8' : '#0284c7'}
          wireframe={true}
          transparent={true}
          opacity={isLight ? 0.22 : 0.15}
        />
      </mesh>

      {/* 3. Extended Regional Horizon Skirt (5km x 5km) to eliminate void edges */}
      <mesh position={[0, 97.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial
          color={isLight ? '#edf2f7' : '#070b14'}
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
};

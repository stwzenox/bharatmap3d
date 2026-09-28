import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';
import { geographicToLocal } from '../utils/coordinates';

interface ParcelItemProps {
  id: string;
  fillGeom: THREE.BufferGeometry;
  lineGeom: THREE.BufferGeometry;
  isSelected: boolean;
  onSelect: () => void;
}

const ParcelItem: React.FC<ParcelItemProps> = ({ id, fillGeom, lineGeom, isSelected, onSelect }) => {
  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: isSelected ? '#00f0ff' : '#0284c7',
      linewidth: isSelected ? 2 : 1,
      transparent: true,
      opacity: isSelected ? 0.95 : 0.45,
    });
    return new THREE.LineLoop(lineGeom, mat);
  }, [lineGeom, isSelected]);

  return (
    <group>
      {/* Parcel Surface Footprint */}
      <mesh
        geometry={fillGeom}
        position={[0, 98.1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshBasicMaterial
          color={isSelected ? '#0ea5e9' : '#0284c7'}
          transparent={true}
          opacity={isSelected ? 0.25 : 0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Glowing Parcel Boundary Line */}
      <primitive object={lineObj} />
    </group>
  );
};

export const ParcelGroundMesh: React.FC = () => {
  const { parcels, layers, selectedParcelId, selectParcel } = useCadastralStore();

  const parcelGeometries = useMemo(() => {
    return parcels.map((p) => {
      const ring = p.geometry.coordinates[0];
      if (!ring || ring.length < 3) return null;

      // Convert [lng, lat] to local metric (x, z)
      const pts2D: THREE.Vector2[] = ring.map(([lng, lat]) => {
        const [x, , z] = geographicToLocal(lat, lng, 0);
        return new THREE.Vector2(x, z);
      });

      if (pts2D.length > 3 && pts2D[0].distanceTo(pts2D[pts2D.length - 1]) < 0.001) {
        pts2D.pop();
      }

      const shape = new THREE.Shape(pts2D);
      const geom = new THREE.ShapeGeometry(shape);
      geom.rotateX(Math.PI / 2); // Lay flat on XZ plane

      // Line outline
      const linePts = ring.map(([lng, lat]) => {
        const [x, , z] = geographicToLocal(lat, lng, 0);
        return new THREE.Vector3(x, 98.15, z);
      });
      const lineGeom = new THREE.BufferGeometry().setFromPoints(linePts);

      return {
        id: p.parcel_id,
        fillGeom: geom,
        lineGeom: lineGeom,
      };
    }).filter(Boolean);
  }, [parcels]);

  if (!layers.parcels) return null;

  return (
    <group position={[0, 0, 0]}>
      {parcelGeometries.map((p) => {
        if (!p) return null;
        return (
          <ParcelItem
            key={p.id}
            id={p.id}
            fillGeom={p.fillGeom}
            lineGeom={p.lineGeom}
            isSelected={selectedParcelId === p.id}
            onSelect={() => selectParcel(p.id)}
          />
        );
      })}
    </group>
  );
};

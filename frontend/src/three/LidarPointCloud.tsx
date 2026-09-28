import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';

export const LidarPointCloud: React.FC = () => {
  const { lidarPoints, layers, zMinClip, zMaxClip } = useCadastralStore();

  const { geometry } = useMemo(() => {
    if (!lidarPoints || lidarPoints.length === 0) {
      return { geometry: null };
    }

    const filtered = lidarPoints.filter(p => p.y >= zMinClip && p.y <= zMaxClip);
    const count = filtered.length;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cGround = new THREE.Color('#78716c');
    const cVeg = new THREE.Color('#22c55e');
    const cBldg = new THREE.Color('#00f0ff');
    const cOther = new THREE.Color('#f59e0b');

    filtered.forEach((pt, i) => {
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;

      let c = cOther;
      if (pt.class_code === 2 || pt.classification === 'ground') c = cGround;
      else if (pt.class_code === 5 || pt.classification === 'vegetation') c = cVeg;
      else if (pt.class_code === 6 || pt.classification === 'building') c = cBldg;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry: geom };
  }, [lidarPoints, zMinClip, zMaxClip]);

  if (!layers.lidar || !geometry) return null;

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={1.6}
        vertexColors={true}
        transparent={true}
        opacity={0.85}
        sizeAttenuation={true}
      />
    </points>
  );
};

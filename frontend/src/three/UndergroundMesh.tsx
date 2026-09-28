import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';
import { createExtrudedFootprintGeometry, geographicToLocal } from '../utils/coordinates';
import { createPipelineGlowTexture } from './pipelineTextures';

export const UndergroundMesh: React.FC = () => {
  const { undergroundAssets, layers, zMinClip, zMaxClip, selectProperty } = useCadastralStore();

  const pipeline = useMemo(() => {
    return undergroundAssets.find(u => u.asset_type.includes('Water') || u.asset_type.includes('Conduit') || u.asset_type.includes('Pipe'));
  }, [undergroundAssets]);

  const basement = useMemo(() => {
    return undergroundAssets.find(u => u.asset_type.includes('Basement'));
  }, [undergroundAssets]);

  // Basement solid & edge geometry
  const { basementGeometry, basementEdges } = useMemo(() => {
    if (!basement || !basement.geometry || !basement.geometry.coordinates) {
      return { basementGeometry: null, basementEdges: null };
    }
    const ring = basement.geometry.coordinates[0];
    const geom = createExtrudedFootprintGeometry(ring, basement.z_min, basement.z_max);
    const edges = geom ? new THREE.EdgesGeometry(geom, 25) : null;
    return { basementGeometry: geom, basementEdges: edges };
  }, [basement]);

  // Pipeline tube geometry & clearance buffer tube
  const { pipeGeometry, bufferGeometry, junctionPoints } = useMemo(() => {
    if (!pipeline || !pipeline.geometry || !pipeline.geometry.coordinates) {
      return { pipeGeometry: null, bufferGeometry: null, junctionPoints: [] };
    }
    const coords: number[][] = pipeline.geometry.coordinates;
    const pts: THREE.Vector3[] = coords.map(([lng, lat]) => {
      const [x, , z] = geographicToLocal(lat, lng, 0);
      const elev = (pipeline.z_min + pipeline.z_max) / 2.0;
      return new THREE.Vector3(x, elev, z);
    });

    if (pts.length < 2) return { pipeGeometry: null, bufferGeometry: null, junctionPoints: [] };
    const curve = new THREE.CatmullRomCurve3(pts);
    const pipeGeom = new THREE.TubeGeometry(curve, 48, 1.4, 16, false);
    // Statutory clearance buffer envelope (4.5m safety radius)
    const bufferGeom = new THREE.TubeGeometry(curve, 32, 4.2, 12, false);

    return { pipeGeometry: pipeGeom, bufferGeometry: bufferGeom, junctionPoints: pts };
  }, [pipeline]);

  const pipelineTexture = useMemo(() => createPipelineGlowTexture('#00f0ff', '#0369a1'), []);

  if (!layers.underground) return null;

  return (
    <group>
      {/* 1. Statutory Subterranean Clearance Buffer Tube (Municipal Easement) */}
      {bufferGeometry && pipeline && (
        <mesh geometry={bufferGeometry}>
          <meshStandardMaterial
            color="#00f0ff"
            transparent
            opacity={0.12}
            roughness={0.9}
            wireframe={false}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 2. Subterranean Water / Drainage Utility Pipeline */}
      {pipeGeometry && pipeline && pipeline.z_max >= zMinClip && pipeline.z_min <= zMaxClip && (
        <group>
          <mesh
            geometry={pipeGeometry}
            onClick={(e) => {
              e.stopPropagation();
              selectProperty({
                type: 'Underground Pipeline',
                id: pipeline.asset_id,
                asset_type: pipeline.asset_type,
                z_min: pipeline.z_min,
                z_max: pipeline.z_max,
                owner: pipeline.owner,
                status: pipeline.status
              });
            }}
          >
            <meshStandardMaterial
              map={pipelineTexture}
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* Glowing Junction Marker Rings */}
          {junctionPoints.map((pt, idx) => (
            <mesh key={idx} position={pt}>
              <sphereGeometry args={[2.0, 16, 16]} />
              <meshStandardMaterial
                color="#00f0ff"
                emissive="#00f0ff"
                emissiveIntensity={1.2}
                transparent
                opacity={0.7}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 3. Subterranean Parking Basement */}
      {basementGeometry && basement && basement.z_max >= zMinClip && basement.z_min <= zMaxClip && (
        <group>
          <mesh
            geometry={basementGeometry}
            onClick={(e) => {
              e.stopPropagation();
              selectProperty({
                type: 'Subterranean Basement',
                id: basement.asset_id,
                asset_type: basement.asset_type,
                z_min: basement.z_min,
                z_max: basement.z_max,
                owner: basement.owner,
                status: basement.status
              });
            }}
          >
            <meshStandardMaterial
              color="#334155"
              emissive="#1e293b"
              emissiveIntensity={0.3}
              roughness={0.4}
              metalness={0.6}
              transparent={true}
              opacity={0.85}
            />
          </mesh>
          {/* Luminous Basement Edge Wire */}
          {basementEdges && (
            <lineSegments geometry={basementEdges}>
              <lineBasicMaterial color="#a855f7" transparent opacity={0.7} linewidth={1.5} />
            </lineSegments>
          )}
        </group>
      )}
    </group>
  );
};

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';
import { useAuthStore } from '../state/useAuthStore';
import { geographicToLocal, ORIGIN_ELEVATION } from '../utils/coordinates';
import { TerrainMesh } from './TerrainMesh';
import { ParcelGroundMesh } from './ParcelGroundMesh';
import { BuildingMesh } from './BuildingMesh';
import { UndergroundMesh } from './UndergroundMesh';
import { ElevatedStructureMesh } from './ElevatedStructureMesh';
import { LidarPointCloud } from './LidarPointCloud';
import { GnssMarkers } from './GnssMarkers';
import { CelestialSky } from './CelestialSky';
import { RoadNetwork } from './RoadNetwork';
import { ModularCityModel } from './ModularCityModel';

// 3D polygon measurement overlay on 3D ground (Admin & Super Admin only)
const MeasurePolygon3DMesh: React.FC = () => {
  const { role } = useAuthStore();
  const isAdminOrSuperAdmin = role === 'admin' || role === 'superadmin';
  const { measurePolygonPoints, isMeasuringPolygon } = useCadastralStore();

  const points3D = useMemo(() => {
    if (!isAdminOrSuperAdmin) return [];
    return measurePolygonPoints.map(([lat, lng]) => {
      const [x, , z] = geographicToLocal(lat, lng, 0);
      return new THREE.Vector3(x, ORIGIN_ELEVATION + 0.35, z);
    });
  }, [measurePolygonPoints]);

  const lineGeometry = useMemo(() => {
    if (points3D.length < 2) return null;
    const pts = points3D.length >= 3 ? [...points3D, points3D[0]] : points3D;
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [points3D]);

  if (!isMeasuringPolygon && measurePolygonPoints.length === 0) return null;

  return (
    <group>
      {lineGeometry && (
        <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3 }))} />
      )}
      {points3D.map((pt, idx) => (
        <mesh key={idx} position={pt}>
          <cylinderGeometry args={[0.8, 0.8, 0.4, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// Camera controller component responding to preset changes, pan events & auto-framing
const CameraController: React.FC = () => {
  const { cameraPreset, selectedBuildingId, buildings } = useCadastralStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Preset changes
  useEffect(() => {
    if (!camera) return;

    if (cameraPreset === 'top') {
      camera.position.set(0, 850, 0.1);
      camera.lookAt(0, 0, 0);
    } else if (cameraPreset === 'side') {
      camera.position.set(0, 280, 750);
      camera.lookAt(0, 40, 0);
    } else if (cameraPreset === 'isometric') {
      camera.position.set(550, 420, 550);
      camera.lookAt(0, 0, 0);
    } else if (cameraPreset === 'default') {
      camera.position.set(550, 420, 550);
      camera.lookAt(0, 0, 0);
    }

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraPreset, camera]);

  // Scale-adaptive auto-framing on building selection (cinematic focus)
  useEffect(() => {
    if (!selectedBuildingId || !camera || !controlsRef.current) return;
    const b = buildings.find(b => b.building_id === selectedBuildingId);
    if (!b || !b.geometry || !b.geometry.coordinates[0]) return;

    const ring = b.geometry.coordinates[0];
    let sumX = 0, sumZ = 0;
    ring.forEach(([lng, lat]) => {
      const [x, , z] = geographicToLocal(lat, lng, 0);
      sumX += x;
      sumZ += z;
    });
    const cx = sumX / ring.length;
    const cz = sumZ / ring.length;
    const cy = (b.ground_elevation + b.roof_elevation) / 2;

    // Smoothly focus on the selected building
    controlsRef.current.target.set(cx, cy, cz);
    camera.position.set(cx - 65, cy + 55, cz + 75);
    controlsRef.current.update();
  }, [selectedBuildingId, buildings, camera]);

  // Pan event listener (for on-screen forward/backward/lateral pan buttons)
  useEffect(() => {
    const handlePan = (e: any) => {
      if (!camera || !controlsRef.current) return;
      const { direction, step = 35 } = e.detail || {};

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      // Horizontal forward vector (ground-parallel for natural walking/panning)
      const horizForward = new THREE.Vector3(forward.x, 0, forward.z).normalize();
      if (horizForward.lengthSq() < 0.001) {
        horizForward.set(0, 0, -1);
      }

      // Horizontal right vector
      const right = new THREE.Vector3();
      right.crossVectors(horizForward, new THREE.Vector3(0, 1, 0)).normalize();

      const moveVec = new THREE.Vector3();

      if (direction === 'forward') {
        moveVec.addScaledVector(horizForward, step);
      } else if (direction === 'backward') {
        moveVec.addScaledVector(horizForward, -step);
      } else if (direction === 'left') {
        moveVec.addScaledVector(right, -step);
      } else if (direction === 'right') {
        moveVec.addScaledVector(right, step);
      } else if (direction === 'in') {
        // Zoom in along 3D line of sight
        camera.position.addScaledVector(forward, step);
        controlsRef.current.update();
        return;
      } else if (direction === 'out') {
        // Zoom out along 3D line of sight
        camera.position.addScaledVector(forward, -step);
        controlsRef.current.update();
        return;
      }

      // Move both camera position and orbit target together to pan the entire viewport
      camera.position.add(moveVec);
      controlsRef.current.target.add(moveVec);
      controlsRef.current.update();
    };

    window.addEventListener('cadastre:camera-pan', handlePan);
    return () => window.removeEventListener('cadastre:camera-pan', handlePan);
  }, [camera]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      let direction: string | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        direction = 'forward';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        direction = 'backward';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        direction = 'left';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        direction = 'right';
      }

      if (direction) {
        e.preventDefault();
        const step = e.shiftKey ? 70 : 30;
        window.dispatchEvent(new CustomEvent('cadastre:camera-pan', { detail: { direction, step } }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 + 0.05}
      minDistance={3}
      maxDistance={4500}
      screenSpacePanning={true}
      enablePan={true}
    />
  );
};

export const Scene3D: React.FC = () => {
  const { buildings, layers, mapTheme } = useCadastralStore();
  const isLight = mapTheme === 'light';

  return (
    <div className={`w-full h-full relative transition-colors ${isLight ? 'bg-[#f0f4f8]' : 'bg-[#070b14]'}`}>
      <Canvas
        camera={{ position: [550, 420, 550], fov: 46, near: 1, far: 16000 }}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Dynamic Celestial Sky & Day/Night Atmosphere */}
        <CelestialSky />

        {/* Soft atmospheric haze */}
        <fog attach="fog" args={[isLight ? '#cbd5e1' : '#070b14', 2500, 9500]} />

        {/* Balanced Architectural Lighting Suite */}
        <ambientLight intensity={isLight ? 1.0 : 0.75} />
        <hemisphereLight
          args={[isLight ? '#ffffff' : '#bae6fd', isLight ? '#cbd5e1' : '#0f172a', isLight ? 1.1 : 0.9]}
        />

        {/* Primary Sun / Key Light with Soft Architectural Shadows */}
        <directionalLight
          position={[450, 750, 400]}
          intensity={isLight ? 1.8 : 1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={3500}
          shadow-camera-left={-2000}
          shadow-camera-right={2000}
          shadow-camera-top={2000}
          shadow-camera-bottom={-2000}
          shadow-bias={-0.0003}
        />

        {/* Secondary Sky/Fill Light for Soft Shadow Illumination */}
        <directionalLight
          position={[-300, 350, -250]}
          intensity={isLight ? 0.95 : 0.85}
          color={isLight ? '#e2e8f0' : '#93c5fd'}
        />

        {/* Front Warm Architectural Accent Light */}
        <directionalLight
          position={[0, 200, 400]}
          intensity={0.55}
          color={isLight ? '#ffffff' : '#e0f2fe'}
        />

        {/* Cinematic Camera Orbit & Pan Controls */}
        <CameraController />

        {/* Base Substratum Ground Plane (14km x 14km) */}
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[14000, 14000]} />
          <meshStandardMaterial color={isLight ? '#cbd5e1' : '#0b1120'} roughness={0.92} metalness={0.08} />
        </mesh>

        {/* Real 3D City Environment Mesh (modular_city_environment.glb) */}
        <ModularCityModel />

        {/* 3D Buildings with Rooftop Architecture & Vertical Floors */}
        {layers.buildings && (
          <group>
            {buildings.map((b) => (
              <BuildingMesh key={b.building_id} building={b} />
            ))}
          </group>
        )}

        {/* Subsurface Glowing Utilities, Clearance Envelope & Basements */}
        <UndergroundMesh />

        {/* Elevated Rapid Transit Flyover */}
        <ElevatedStructureMesh />

        {/* Synthetic LiDAR Point Cloud */}
        <LidarPointCloud />

        {/* GNSS / CORS Stations */}
        <GnssMarkers />

        {/* Google Earth Active Footprint Polygon Measurement */}
        <MeasurePolygon3DMesh />
      </Canvas>
    </div>
  );
};

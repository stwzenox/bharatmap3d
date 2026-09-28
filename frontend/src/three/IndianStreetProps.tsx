import React from 'react';
import * as THREE from 'three';

/** Iconic Indian Auto-Rickshaw (Yellow Roof + Green Body + 3 Wheels) */
export const AutoRickshaw: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Dark Green Lower Chassis & Cabin */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.3, 0.7, 2.4]} />
        <meshStandardMaterial color="#047857" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Yellow Iconic Curvature Canopy Roof */}
      <mesh position={[0, 1.35, -0.1]} castShadow>
        <boxGeometry args={[1.28, 0.75, 2.1]} />
        <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.95, 0.95]} rotation={[-0.26, 0, 0]}>
        <boxGeometry args={[1.15, 0.65, 0.08]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Headlight */}
      <mesh position={[0, 0.55, 1.22]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.2} />
      </mesh>

      {/* 3 Wheels (1 Front, 2 Rear) */}
      <mesh position={[0, 0.22, 0.9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[-0.6, 0.22, -0.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 0.22, -0.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
    </group>
  );
};

/** Indian Roadside BESCOM Electricity Distribution Transformer on Dual Concrete Poles */
export const BescomTransformer: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 2 Reinforced Concrete Utility Poles */}
      <mesh position={[-1.2, 4.5, 0]} castShadow>
        <boxGeometry args={[0.35, 9, 0.35]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      <mesh position={[1.2, 4.5, 0]} castShadow>
        <boxGeometry args={[0.35, 9, 0.35]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Steel Platform Channel Beam */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <boxGeometry args={[3.2, 0.25, 1.8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Transformer Tank (Industrial Steel Green/Grey) */}
      <mesh position={[0, 5.8, 0]} castShadow>
        <boxGeometry args={[1.8, 1.6, 1.4]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Radiator Cooling Fins */}
      <mesh position={[-1.0, 5.8, 0]}>
        <boxGeometry args={[0.2, 1.3, 1.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh position={[1.0, 5.8, 0]}>
        <boxGeometry args={[0.2, 1.3, 1.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Bushing Insulators on Top */}
      {[-0.5, 0, 0.5].map((bx, i) => (
        <mesh key={i} position={[bx, 6.8, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.5, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.2} />
        </mesh>
      ))}

      {/* Yellow/Black Danger Caution Plate */}
      <mesh position={[0, 3.2, 0.2]}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>
    </group>
  );
};

/** Indian Native Street Trees: Gulmohar (Orange/Red), Neem (Lush Green), Palm */
export const UrbanTree: React.FC<{
  position: [number, number, number];
  type: 'gulmohar' | 'neem' | 'palm';
}> = ({ position, type }) => {
  const [x, y, z] = position;

  if (type === 'palm') {
    return (
      <group position={[x, y, z]}>
        {/* Planter curb */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[1.6, 0.4, 1.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>
        {/* Slender curved trunk */}
        <mesh position={[0, 2.6, 0]} rotation={[0, 0, 0.06]} castShadow>
          <cylinderGeometry args={[0.18, 0.28, 5.0, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* Palm frond crown */}
        <mesh position={[0.2, 5.1, 0]} castShadow>
          <coneGeometry args={[2.4, 1.4, 7]} />
          <meshStandardMaterial color="#15803d" roughness={0.6} />
        </mesh>
      </group>
    );
  }

  const isGulmohar = type === 'gulmohar';

  return (
    <group position={[x, y, z]}>
      {/* Planter base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.1, 0.4, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.45, 3.6, 8]} />
        <meshStandardMaterial color="#573a27" roughness={0.9} />
      </mesh>
      {/* Canopy Dome */}
      <mesh position={[0, 4.4, 0]} castShadow>
        <sphereGeometry args={[2.5, 14, 14]} />
        <meshStandardMaterial
          color={isGulmohar ? '#ea580c' : '#16a34a'}
          roughness={0.7}
        />
      </mesh>
      {/* Secondary lush canopy puff */}
      <mesh position={[0.6, 4.9, 0.4]} castShadow>
        <sphereGeometry args={[1.8, 10, 10]} />
        <meshStandardMaterial
          color={isGulmohar ? '#f97316' : '#22c55e'}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
};

/** Roadside Modern Street Lamp with Warm Emissive Glow */
export const StreetLamp: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tall sleek metallic pole */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 8.4, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Overhanging cantilever arm */}
      <mesh position={[0.7, 8.4, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.06, 0.06, 1.8, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Light fixture head */}
      <mesh position={[1.3, 8.8, 0]}>
        <boxGeometry args={[0.6, 0.12, 0.25]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Emissive LED panel */}
      <mesh position={[1.3, 8.72, 0]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fef08a"
          emissiveIntensity={2.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

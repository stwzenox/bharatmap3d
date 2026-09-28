import React from 'react';
import { useCadastralStore } from '../state/useCadastralStore';
import { geographicToLocal } from '../utils/coordinates';

export const GnssMarkers: React.FC = () => {
  const { gnssStations, layers, selectProperty } = useCadastralStore();

  if (!layers.gnss) return null;

  return (
    <group>
      {gnssStations.map((st) => {
        const [x, , z] = geographicToLocal(st.latitude, st.longitude, 0);
        const y = st.elevation;

        return (
          <group
            key={st.station_id}
            position={[x, y, z]}
            onClick={(e) => {
              e.stopPropagation();
              selectProperty({
                type: 'GNSS Reference Station',
                id: st.station_id,
                latitude: st.latitude,
                longitude: st.longitude,
                elevation: `${st.elevation}m`,
                accuracy: `±${st.accuracy}m (RTK Survey Grade)`,
                status: 'Active CORS Continuous Broadcast'
              });
            }}
          >
            {/* Mast */}
            <mesh position={[0, 2, 0]}>
              <cylinderGeometry args={[0.2, 0.3, 4, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Pulsing Beacon Dome */}
            <mesh position={[0, 4.2, 0]}>
              <sphereGeometry args={[0.9, 16, 16]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={0.8}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

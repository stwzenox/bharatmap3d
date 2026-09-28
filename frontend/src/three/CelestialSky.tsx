import React, { useMemo } from 'react';
import { Sky, Stars } from '@react-three/drei';
import { useCadastralStore } from '../state/useCadastralStore';

export const CelestialSky: React.FC = () => {
  const { mapTheme } = useCadastralStore();
  const isLight = mapTheme === 'light';

  // Solar trajectory parameters
  const sunPosition = useMemo((): [number, number, number] => {
    if (isLight) {
      // Crisp mid-day sun casting sharp architectural shadows
      return [350, 480, 250];
    } else {
      // Low moody cyber-twilight / night illumination
      return [-200, 40, -350];
    }
  }, [isLight]);

  return (
    <group>
      {isLight ? (
        // Daylight atmospheric sky
        <Sky
          distance={450000}
          sunPosition={sunPosition}
          inclination={0.49}
          azimuth={0.25}
          turbidity={6.5}
          rayleigh={1.2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      ) : (
        // Cyber-Night celestial sky with stars and subtle moon glow
        <>
          <Sky
            distance={450000}
            sunPosition={sunPosition}
            turbidity={12}
            rayleigh={0.2}
            mieCoefficient={0.08}
            mieDirectionalG={0.9}
          />
          <Stars
            radius={2500}
            depth={80}
            count={3000}
            factor={5}
            saturation={0.5}
            fade
            speed={0.8}
          />
        </>
      )}
    </group>
  );
};

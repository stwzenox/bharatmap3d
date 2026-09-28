import React from 'react';
import { Html } from '@react-three/drei';
import { Building } from '../types';
import { useCadastralStore } from '../state/useCadastralStore';

interface UlpinBadge3DProps {
  building: Building;
  position: [number, number, number]; // [cx, roofY + 4, cz]
}

export const UlpinBadge3D: React.FC<UlpinBadge3DProps> = ({ building, position }) => {
  const { openBuilding3DModal } = useCadastralStore();
  const height = Math.round(building.roof_elevation - building.ground_elevation);
  const floors = building.floor_count || Math.max(Math.round(height / 3.2), 1);
  const ulpinDisplay = building.primary_ulpin || `3D-ULPIN-${building.building_id}`;
  const nameDisplay = building.building_name || building.building_type || `Structure ${building.building_id}`;

  return (
    <Html
      position={position}
      center
      distanceFactor={90}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex flex-col items-center select-none animate-fadeIn cursor-default">
        {/* Hologram Card */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.4)] rounded-xl px-3.5 py-2.5 text-white min-w-[210px] text-xs font-sans">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🇮🇳</span>
              <span className="font-bold text-cyan-400 font-mono tracking-wider text-[11px]">
                {ulpinDisplay}
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-semibold">
              VERIFIED
            </span>
          </div>

          {/* Body */}
          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="font-medium text-white truncate max-w-[190px]">
              {nameDisplay}
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Height: <strong className="text-slate-200">{height}m</strong></span>
              <span>Stories: <strong className="text-slate-200">{floors} Floors</strong></span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyan-300/90 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Foundation Clearance: <strong>Compliant</strong></span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openBuilding3DModal(building.building_id);
            }}
            className="mt-2 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-1 px-2 rounded-lg text-[10px] shadow-sm transition-all flex items-center justify-center gap-1"
          >
            <span>Inspect 3D Strata</span>
            <span>→</span>
          </button>
        </div>

        {/* Anchoring Hologram Stem Pin */}
        <div className="w-0.5 h-4 bg-gradient-to-b from-cyan-400 to-transparent"></div>
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
      </div>
    </Html>
  );
};

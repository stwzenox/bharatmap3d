import React from 'react';
import {
  Compass, RotateCcw, ArrowDownUp, Eye, Globe
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { ORIGIN_LAT, ORIGIN_LNG, ORIGIN_ELEVATION } from '../../utils/coordinates';

export const BottomControls: React.FC = () => {
  const {
    zMinClip,
    zMaxClip,
    setZClip,
    cameraPreset,
    setCameraPreset,
  } = useCadastralStore();

  return (
    <div className="h-12 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-20 text-xs font-mono select-none">
      {/* 1. Camera View Presets */}
      <div className="flex items-center gap-1">
        <span className="text-slate-500 text-[11px] uppercase mr-1">Camera:</span>

        {[
          { key: 'default', label: 'Perspective' },
          { key: 'top', label: 'Top 2D' },
          { key: 'side', label: 'Elevation' },
          { key: 'isometric', label: 'Isometric' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCameraPreset(key as any)}
            className={`px-2 py-1 rounded text-[11px] transition-all border ${
              cameraPreset === key
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={() => setCameraPreset('default')}
          className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded ml-1"
          title="Reset Camera Orientation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Z-Axis Range Clipping Slider (Underground to High-Rise) */}
      <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <ArrowDownUp className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">Z CLIP:</span>
        </div>

        {/* Z-MIN Slider */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">MIN</span>
          <input
            type="range"
            min="80"
            max="125"
            step="1"
            value={zMinClip}
            onChange={(e) => setZClip(parseInt(e.target.value), Math.max(zMaxClip, parseInt(e.target.value) + 2))}
            className="w-20 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-cyan-300 font-bold w-10 text-right">{zMinClip}m</span>
        </div>

        <span className="text-slate-600">|</span>

        {/* Z-MAX Slider */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">MAX</span>
          <input
            type="range"
            min="95"
            max="150"
            step="1"
            value={zMaxClip}
            onChange={(e) => setZClip(Math.min(zMinClip, parseInt(e.target.value) - 2), parseInt(e.target.value))}
            className="w-20 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-cyan-300 font-bold w-10 text-right">{zMaxClip}m</span>
        </div>
      </div>

      {/* 3. Coordinate System Tangent Info */}
      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>Prayagraj (UP):</span>
          <span className="text-slate-200">{ORIGIN_LAT}°N, {ORIGIN_LNG}°E</span>
        </div>
        <span className="text-slate-700">|</span>
        <div>
          <span>Datum: </span>
          <span className="text-cyan-300">WGS84 ({ORIGIN_ELEVATION}m DEM)</span>
        </div>
      </div>
    </div>
  );
};

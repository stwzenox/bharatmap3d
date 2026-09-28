import React, { useState } from 'react';
import { Ruler, X, Calculator, ArrowDownUp } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const MeasureToolPanel: React.FC = () => {
  const { measureMode, setMeasureMode, selectedProperty } = useCadastralStore();
  const [customArea, setCustomArea] = useState<number>(120);
  const [customZMin, setCustomZMin] = useState<number>(100);
  const [customZMax, setCustomZMax] = useState<number>(103.5);

  if (measureMode === 'none') return null;

  const activeArea = selectedProperty?.area || customArea;
  const activeZMin = selectedProperty?.z_min || customZMin;
  const activeZMax = selectedProperty?.z_max || customZMax;
  const heightDiff = Math.max(0, activeZMax - activeZMin);
  const calculatedVolume = activeArea * heightDiff;

  return (
    <div className="print:hidden absolute top-16 right-84 z-30 bg-slate-900/95 border border-amber-500/40 backdrop-blur-md rounded-xl p-4 w-72 shadow-2xl font-mono text-xs text-slate-200">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Ruler className="w-4 h-4" />
          <span>Cadastral Metric Tool</span>
        </div>
        <button
          onClick={() => setMeasureMode('none')}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] text-slate-400">
          Target Object: <span className="text-white font-bold">{selectedProperty?.id || 'Manual Entry'}</span>
        </div>

        {/* Inputs if manual */}
        {!selectedProperty?.area && (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400">Base Area (m²)</label>
              <input
                type="number"
                value={customArea}
                onChange={(e) => setCustomArea(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs mt-0.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Z Min (m)</label>
                <input
                  type="number"
                  value={customZMin}
                  onChange={(e) => setCustomZMin(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Z Max (m)</label>
                <input
                  type="number"
                  value={customZMax}
                  onChange={(e) => setCustomZMax(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs mt-0.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Calculated Results */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Height (ΔZ):</span>
            <span className="text-cyan-300 font-bold">{heightDiff.toFixed(2)} m</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Floor Footprint:</span>
            <span className="text-sky-400 font-bold">{activeArea.toFixed(1)} m²</span>
          </div>

          <div className="flex justify-between pt-1 border-t border-slate-800">
            <span className="text-amber-400 font-semibold">Vertical Volume:</span>
            <span className="text-amber-300 font-bold text-sm">
              {calculatedVolume.toFixed(1)} m³
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

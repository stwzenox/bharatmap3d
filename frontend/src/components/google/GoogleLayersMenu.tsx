import React from 'react';
import {
  Layers, X, CheckSquare, Square, Sliders, Box,
  Eye, Check, Map, Compass, Radio, Building2, Flame
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const GoogleLayersMenu: React.FC = () => {
  const {
    layers,
    toggleLayer,
    mapTheme,
    setMapTheme,
    isLayersOpen,
    setLayersOpen,
    isFloorView,
    setFloorView,
    isExplodedView,
    setExplodedView,
    explodeAmount,
    setExplodeAmount,
    isWireframe,
    setWireframe,
    isTransparent,
    setTransparent
  } = useCadastralStore();

  if (!isLayersOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white/98 backdrop-blur-md text-slate-800 rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200/90 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100vh-80px)] overflow-y-auto z-50 print:hidden select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Map Details & Layers</h3>
            </div>
            <button
              onClick={() => setLayersOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Map Style Selector */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Map Style
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMapTheme('light')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  mapTheme === 'light'
                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Map className="w-5 h-5 text-blue-600" />
                <span>Google Street</span>
              </button>

              <button
                onClick={() => setMapTheme('dark')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  mapTheme === 'dark'
                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
                <span>Dark / Night</span>
              </button>
            </div>
          </div>

          {/* Cadastral Overlays */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Cadastral Overlays
            </div>

            <div className="space-y-1">
              {[
                { key: 'parcels', label: '2D Land Parcels', color: 'text-blue-600', dot: 'bg-blue-600' },
                { key: 'buildings', label: '3D Building Meshes', color: 'text-indigo-600', dot: 'bg-indigo-600' },
                { key: 'floors', label: 'Floor Segmentation', color: 'text-cyan-600', dot: 'bg-cyan-600' },
                { key: 'verticalProperties', label: 'Vertical Units', color: 'text-purple-600', dot: 'bg-purple-600' },
                { key: 'elevated', label: 'Grand Trunk Elevated Flyover', color: 'text-pink-600', dot: 'bg-pink-600' },
                { key: 'underground', label: 'Underground Infrastructure', color: 'text-teal-600', dot: 'bg-teal-600' },
                { key: 'gnss', label: 'GNSS / CORS Stations', color: 'text-amber-600', dot: 'bg-amber-600' },
                { key: 'lidar', label: 'Synthetic LiDAR Point Cloud', color: 'text-emerald-600', dot: 'bg-emerald-600' },
                { key: 'terrain', label: '20×20 Terrain DEM Grid', color: 'text-slate-500', dot: 'bg-slate-500' },
              ].map(({ key, label, dot }) => {
                const active = (layers as any)[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key as any)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-slate-50 text-slate-900 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      <span>{label}</span>
                    </div>
                    {active ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3D Visualization Controls */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              3D Display Modes
            </div>

            {/* Floor Volume Mode */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Floor Rendering</span>
              <button
                onClick={() => setFloorView(!isFloorView)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  isFloorView
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isFloorView ? 'Segmented Floors' : 'Solid Shell'}
              </button>
            </div>

            {/* Exploded Floor Slider */}
            {isFloorView && (
              <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Exploded Separation</span>
                  <span className="font-mono font-bold text-blue-600">{explodeAmount.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={isExplodedView ? explodeAmount : 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > 0) {
                      setExplodedView(true);
                      setExplodeAmount(val);
                    } else {
                      setExplodedView(false);
                    }
                  }}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Wireframe / X-Ray Toggles */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setWireframe(!isWireframe)}
                className={`p-2 rounded-xl border font-semibold transition-all ${
                  isWireframe
                    ? 'bg-blue-50 text-blue-700 border-blue-400'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Wireframe
              </button>

              <button
                onClick={() => setTransparent(!isTransparent)}
                className={`p-2 rounded-xl border font-semibold transition-all ${
                  isTransparent
                    ? 'bg-blue-50 text-blue-700 border-blue-400'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Glass X-Ray
              </button>
            </div>
          </div>
        </div>
      );
};

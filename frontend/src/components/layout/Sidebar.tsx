import React from 'react';
import {
  Layers, Eye, CheckSquare, Square, Sliders, Box,
  Grid, Compass, Radio, Building2, Flame, MapPin
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const Sidebar: React.FC = () => {
  const {
    layers,
    toggleLayer,
    isFloorView,
    setFloorView,
    isExplodedView,
    setExplodedView,
    explodeAmount,
    setExplodeAmount,
    isWireframe,
    setWireframe,
    isTransparent,
    setTransparent,
    dashboardMetrics,
    buildings,
    selectedBuildingId,
    selectBuilding
  } = useCadastralStore();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-col h-[calc(100vh-3.5rem)] select-none overflow-y-auto">
      {/* 1. Cadastral Layer Control */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-sky-400">
          <Layers className="w-3.5 h-3.5" />
          <span>Cadastral Layers</span>
        </div>

        <div className="space-y-1 text-xs">
          {[
            { key: 'parcels', label: '2D Land Parcels', color: 'text-sky-400' },
            { key: 'buildings', label: '3D Building Meshes', color: 'text-blue-400' },
            { key: 'floors', label: 'Floor Segmentation', color: 'text-cyan-400' },
            { key: 'verticalProperties', label: 'Vertical Parcels', color: 'text-indigo-400' },
            { key: 'underground', label: 'Underground Infrastructure', color: 'text-teal-400' },
            { key: 'elevated', label: 'Elevated Flyover Bridge', color: 'text-pink-400' },
            { key: 'gnss', label: 'GNSS / CORS Stations', color: 'text-amber-400' },
            { key: 'lidar', label: 'Synthetic LiDAR Cloud', color: 'text-emerald-400' },
            { key: 'terrain', label: '20x20 Terrain DEM', color: 'text-slate-400' },
          ].map(({ key, label, color }) => {
            const active = (layers as any)[key];
            return (
              <button
                key={key}
                onClick={() => toggleLayer(key as any)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all ${
                  active
                    ? 'bg-slate-900/90 text-white font-medium hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={color}>
                    {active ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </span>
                  <span>{label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 3D Cadastral Visualization Controls */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <Sliders className="w-3.5 h-3.5" />
          <span>3D Controls</span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Floor Segmentation View */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Floor Volumes</span>
            <button
              onClick={() => setFloorView(!isFloorView)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                isFloorView
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-700'
              }`}
            >
              {isFloorView ? 'Segmented' : 'Solid'}
            </button>
          </div>

          {/* Exploded Floor View */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Exploded View</span>
            <button
              onClick={() => setExplodedView(!isExplodedView)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                isExplodedView
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-700'
              }`}
            >
              {isExplodedView ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Explode Amount Slider */}
          {isExplodedView && (
            <div className="pt-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Vertical Separation</span>
                <span className="text-amber-300 font-bold">{explodeAmount.toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={explodeAmount}
                onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Wireframe & Transparent Modes */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setWireframe(!isWireframe)}
              className={`py-1 text-center rounded text-[10px] font-mono border transition-all ${
                isWireframe
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Wireframe
            </button>

            <button
              onClick={() => setTransparent(!isTransparent)}
              className={`py-1 text-center rounded text-[10px] font-mono border transition-all ${
                isTransparent
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Glass X-Ray
            </button>
          </div>
        </div>
      </div>

      {/* 3. Building Quick Selector */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>Buildings ({buildings.length})</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {buildings.map((b) => (
            <button
              key={b.building_id}
              onClick={() => selectBuilding(b.building_id)}
              className={`py-1 rounded text-center text-xs font-mono transition-all border ${
                selectedBuildingId === b.building_id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {b.building_id}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Cadastral KPI Metrics */}
      <div className="p-3 mt-auto bg-slate-950/60">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
          Cadastral KPIs
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-slate-400 text-[10px]">Parcels</div>
            <div className="text-base font-bold text-sky-400">
              {dashboardMetrics ? dashboardMetrics.total_parcels : 15}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-slate-400 text-[10px]">3D Units</div>
            <div className="text-base font-bold text-cyan-300">
              {dashboardMetrics ? dashboardMetrics.total_vertical_properties : 48}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-slate-400 text-[10px]">Subsurface</div>
            <div className="text-base font-bold text-teal-400">
              {dashboardMetrics ? dashboardMetrics.underground_assets : 2}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-slate-400 text-[10px]">Topology</div>
            <div className="text-base font-bold text-emerald-400">
              Valid
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

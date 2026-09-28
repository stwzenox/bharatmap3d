import React from 'react';
import { Compass, Plus, Minus, Crosshair } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { ORIGIN_LAT, ORIGIN_LNG } from '../../utils/coordinates';

export const GoogleMapControls: React.FC = () => {
  const {
    cameraPreset,
    setCameraPreset,
    selectBuilding,
    viewMode
  } = useCadastralStore();

  const is3DActive = viewMode === '3d' || viewMode === 'split';

  const handleZoomIn = () => {
    const map3d = (window as any).map3d;
    if (map3d && is3DActive) {
      map3d.zoomIn();
    }
    window.dispatchEvent(new CustomEvent('cadastre:leaflet-zoom', { detail: 1 }));
  };

  const handleZoomOut = () => {
    const map3d = (window as any).map3d;
    if (map3d && is3DActive) {
      map3d.zoomOut();
    }
    window.dispatchEvent(new CustomEvent('cadastre:leaflet-zoom', { detail: -1 }));
  };

  const handleCenterMap = () => {
    selectBuilding('B001');
    setCameraPreset('default');
    const map3d = (window as any).map3d;
    if (map3d && is3DActive) {
      map3d.easeTo({ center: [ORIGIN_LNG, ORIGIN_LAT], zoom: 16.5, pitch: 58, bearing: 0, duration: 1000 });
    }
    window.dispatchEvent(new CustomEvent('cadastre:leaflet-center'));
  };

  const handleToggle3D = () => {
    if (cameraPreset === 'top') {
      setCameraPreset('default');
    } else {
      setCameraPreset('top');
    }
  };

  return (
    <div className="print:hidden absolute bottom-6 right-6 z-30 flex flex-col items-end gap-2 pointer-events-auto select-none">
      {/* 1. Camera Angle Quick Chips (Only shown in 3D or Split View) */}
      {is3DActive && (
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 p-1 mb-1">
          {[
            { key: 'default', label: '3D' },
            { key: 'top', label: '2D Top' },
            { key: 'side', label: 'Side' },
            { key: 'isometric', label: 'Iso' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCameraPreset(key as any)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl transition-all ${
                cameraPreset === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 4. Google Maps Vertical Control Stack */}
      <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {/* Zoom In (+) */}
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors active:scale-95"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out (-) */}
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors active:scale-95"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Reset North Compass (Only shown in 3D or Split View) */}
        {is3DActive && (
          <button
            onClick={() => setCameraPreset('top')}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            title="Reset to North"
          >
            <Compass className="w-5 h-5" />
          </button>
        )}

        {/* 3D / 2D Tilt Toggle (Only shown in 3D or Split View) */}
        {is3DActive && (
          <button
            onClick={handleToggle3D}
            className="w-10 h-10 flex items-center justify-center font-bold text-xs text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            title={cameraPreset === 'top' ? 'Switch to 3D Perspective' : 'Switch to 2D Top-Down'}
          >
            {cameraPreset === 'top' ? '2D' : '3D'}
          </button>
        )}

        {/* Center on Prayagraj (Common to 2D and 3D) */}
        <button
          onClick={handleCenterMap}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
          title="Center on Prayagraj Cadastre"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Google Maps Style Coordinate & Pan Shortcuts Hint Badge */}
      <div className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/70 text-[10px] font-mono text-slate-500 shadow-sm flex items-center gap-2">
        <span>Prayagraj {ORIGIN_LAT}°N, {ORIGIN_LNG}°E</span>
        {is3DActive && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-blue-600 font-sans font-medium">Pan: W/S or ↑/↓</span>
          </>
        )}
      </div>
    </div>
  );
};

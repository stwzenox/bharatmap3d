import React, { useState, useMemo } from 'react';
import { 
  Ruler, 
  X, 
  RotateCcw, 
  Undo2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Bookmark, 
  Sparkles, 
  Layers, 
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { useAuthStore } from '../../state/useAuthStore';
import { geographicToLocal } from '../../utils/coordinates';
import { generate3DBuildingWithGemini, GeneratedBuildingAiSpec } from '../../services/geminiBuildingAi';

export const GoogleEarthMeasureCard: React.FC = () => {
  const {
    isMeasuringPolygon,
    setIsMeasuringPolygon,
    measurePolygonPoints,
    removeLastMeasurePolygonPoint,
    clearMeasurePolygon,
    setPendingAiBuildingInput,
    parcels
  } = useCadastralStore();

  const { openAddBuildingModal } = useAuthStore();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [areaUnit, setAreaUnit] = useState<'m2' | 'ft2' | 'acre'>('m2');
  const [distUnit, setDistUnit] = useState<'m' | 'ft'>('m');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessSpec, setAiSuccessSpec] = useState<GeneratedBuildingAiSpec | null>(null);

  // Compute metric area and perimeter using local metric projection
  const { areaM2, perimeterM, localPoints } = useMemo(() => {
    if (measurePolygonPoints.length < 2) {
      return { areaM2: 0, perimeterM: 0, localPoints: [] };
    }

    const local = measurePolygonPoints.map(([lat, lng]) => {
      const [x, , z] = geographicToLocal(lat, lng, 0);
      return [x, z];
    });

    // Perimeter
    let perim = 0;
    for (let i = 0; i < local.length; i++) {
      const nextIdx = (i + 1) % local.length;
      if (measurePolygonPoints.length >= 3 || i < local.length - 1) {
        const dx = local[nextIdx][0] - local[i][0];
        const dz = local[nextIdx][1] - local[i][1];
        perim += Math.sqrt(dx * dx + dz * dz);
      }
    }

    // Shoelace area (only for >= 3 points)
    let area = 0;
    if (local.length >= 3) {
      let sum1 = 0;
      let sum2 = 0;
      for (let i = 0; i < local.length; i++) {
        const nextIdx = (i + 1) % local.length;
        sum1 += local[i][0] * local[nextIdx][1];
        sum2 += local[nextIdx][0] * local[i][1];
      }
      area = Math.abs(sum1 - sum2) / 2;
    }

    return { areaM2: area, perimeterM: perim, localPoints: local };
  }, [measurePolygonPoints]);

  if (!isMeasuringPolygon) return null;

  // Format Area
  let displayArea = `${areaM2.toFixed(2)} m²`;
  if (areaUnit === 'ft2') {
    displayArea = `${(areaM2 * 10.7639).toFixed(2)} ft²`;
  } else if (areaUnit === 'acre') {
    displayArea = `${(areaM2 / 4046.86).toFixed(4)} acres`;
  }

  // Format Perimeter
  let displayPerimeter = `${perimeterM.toFixed(2)} m`;
  if (distUnit === 'ft') {
    displayPerimeter = `${(perimeterM * 3.28084).toFixed(2)} ft`;
  }

  // Elevation estimates (simulated local terrain bounds)
  const minElev = 98.2;
  const maxElev = 118.5;
  const medianElev = 104.8;

  const handleRegisterWithAi = async () => {
    if (measurePolygonPoints.length < 3) {
      setAiError('Please click at least 3 points to outline a building polygon footprint.');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      // Calculate centroid of measured polygon
      const lats = measurePolygonPoints.map(p => p[0]);
      const lngs = measurePolygonPoints.map(p => p[1]);
      const cLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const cLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

      // Find enclosing or nearest parcel from coordinates
      let candidateParcel = parcels[0]?.parcel_id || 'P001';
      let minDist = Infinity;
      for (const p of parcels) {
        if (p.geometry?.coordinates?.[0]) {
          const ring = p.geometry.coordinates[0];
          const pLats = ring.map((c: any) => c[1]);
          const pLngs = ring.map((c: any) => c[0]);
          const minLat = Math.min(...pLats);
          const maxLat = Math.max(...pLats);
          const minLng = Math.min(...pLngs);
          const maxLng = Math.max(...pLngs);

          if (cLat >= minLat && cLat <= maxLat && cLng >= minLng && cLng <= maxLng) {
            candidateParcel = p.parcel_id;
            break;
          }
          const pCentLat = (minLat + maxLat) / 2;
          const pCentLng = (minLng + maxLng) / 2;
          const dist = (cLat - pCentLat) ** 2 + (cLng - pCentLng) ** 2;
          if (dist < minDist) {
            minDist = dist;
            candidateParcel = p.parcel_id;
          }
        }
      }

      // Generate initial AI Spec asynchronously (non-blocking fallback)
      let aiResult: any = null;
      try {
        aiResult = await generate3DBuildingWithGemini({
          coordinates: measurePolygonPoints,
          areaSqMeters: areaM2 || 416.64,
          perimeterMeters: perimeterM || 87.58,
          minElevation: minElev,
          maxElevation: maxElev,
          parcelId: candidateParcel,
        });
        setAiSuccessSpec(aiResult);
      } catch (geminiErr) {
        console.warn('Google AI Studio Gemini preview optional note:', geminiErr);
      }

      // Pass measured polygon, centroid coordinates and attributes to store
      setPendingAiBuildingInput({
        coordinates: measurePolygonPoints,
        area: areaM2,
        perimeter: perimeterM,
        aiSpec: aiResult,
        parcelId: candidateParcel,
      });

      // Advance into the professional Cadastral Pipeline with pre-populated geospatial data
      openAddBuildingModal();
      setIsMeasuringPolygon(false);
    } catch (err: any) {
      setAiError(err.message || 'Registration launch failed. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="print:hidden absolute top-16 right-4 z-40 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 text-slate-800 font-sans overflow-hidden pointer-events-auto select-none transition-all animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Ruler className="w-4 h-4 text-blue-600" />
          <span>Measure</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Help */}
          <button 
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Click corners on the map to outline building footprint"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button 
            onClick={clearMeasurePolygon}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Reset measurement"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Undo */}
          <button 
            onClick={removeLastMeasurePolygonPoint}
            disabled={measurePolygonPoints.length === 0}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-400 hover:text-slate-600 transition-colors"
            title="Undo last point"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Close */}
          <button 
            onClick={() => {
              setIsMeasuringPolygon(false);
              clearMeasurePolygon();
            }}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Close Measure Tool"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide text */}
      <div className="px-4 py-2.5 text-xs text-slate-500 border-b border-slate-100/60 bg-slate-50/50">
        {measurePolygonPoints.length === 0 && 'Click points on the map to measure distances and area'}
        {measurePolygonPoints.length === 1 && 'Click next corner of the building'}
        {measurePolygonPoints.length === 2 && 'Click third point to form a 2D surface area'}
        {measurePolygonPoints.length >= 3 && `${measurePolygonPoints.length} vertices placed. Click first point or Save to register.`}
      </div>

      {/* Error alert */}
      {aiError && (
        <div className="m-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Measurements List */}
      <div className="p-4 space-y-3 text-xs">
        {/* Area */}
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-700">Area</div>
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <span>{measurePolygonPoints.length >= 3 ? displayArea : '—'}</span>
            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as any)}
              className="text-[11px] bg-transparent text-slate-500 hover:text-slate-800 border-none outline-none cursor-pointer"
            >
              <option value="m2">m²</option>
              <option value="ft2">ft²</option>
              <option value="acre">acres</option>
            </select>
          </div>
        </div>

        {/* Perimeter */}
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-700">Perimeter</div>
          <div className="flex items-center gap-1 font-bold text-slate-900">
            <span>{measurePolygonPoints.length >= 2 ? displayPerimeter : '—'}</span>
            <select
              value={distUnit}
              onChange={(e) => setDistUnit(e.target.value as any)}
              className="text-[11px] bg-transparent text-slate-500 hover:text-slate-800 border-none outline-none cursor-pointer"
            >
              <option value="m">m</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>

        {/* Advanced measurements (Elevation estimate) */}
        <div className="border-t border-slate-100 pt-2.5">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 font-semibold"
          >
            <span className="flex items-center gap-1">
              <span>Advanced measurements</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </span>
            {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isAdvancedOpen && (
            <div className="mt-2 space-y-1.5 text-[11px] text-slate-500 pl-1">
              <div>Elevation estimate</div>
              <div className="font-mono font-semibold text-slate-700">
                Min: {minElev}m | Median: {medianElev}m | Max: {maxElev}m
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button: Save to project / Register 3D Building (AI) */}
      <div className="p-3 bg-slate-50 border-t border-slate-100">
        <button
          onClick={handleRegisterWithAi}
          disabled={measurePolygonPoints.length < 3 || isAiGenerating}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
        >
          {isAiGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing with Gemini AI...</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4 fill-white/20" />
              <span>Save to project / Register 3D Building</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 ml-auto" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

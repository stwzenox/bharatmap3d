import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const ValidationResultsPanel: React.FC = () => {
  const {
    isValidationModalOpen,
    setValidationModalOpen,
    validationResults,
    selectBuilding,
    selectParcel,
    selectFloor,
    searchGlobal
  } = useCadastralStore();

  if (!isValidationModalOpen) return null;

  const handleViewError = (objectId: string, objectType: string) => {
    if (objectType === 'Building') {
      selectBuilding(objectId);
    } else if (objectType === 'Parcel') {
      selectParcel(objectId);
    } else if (objectType === 'Floor') {
      selectFloor(objectId);
    } else {
      searchGlobal(objectId);
    }
    setValidationModalOpen(false);
  };

  const errors = validationResults.filter(r => r.severity === 'ERROR');
  const warnings = validationResults.filter(r => r.severity === 'WARNING');
  const valids = validationResults.filter(r => r.severity === 'VALID');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-mono">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Cadastral Topology & Geometric Validation
              </h3>
              <p className="text-[11px] text-slate-400">
                Planar 2D Enclosure, 3D Vertical Stacking & ULPIN Integrity Check
              </p>
            </div>
          </div>
          <button
            onClick={() => setValidationModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity Count Banners */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Passed Checks: {valids.length}</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Warnings: {warnings.length}</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-red-950/40 border border-red-500/30 text-red-300">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>Errors: {errors.length}</span>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {validationResults.map((r, idx) => {
            const isError = r.severity === 'ERROR';
            const isWarning = r.severity === 'WARNING';

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                  isError
                    ? 'bg-red-950/20 border-red-500/40 text-red-200'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isError && <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                  {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
                  {!isError && !isWarning && <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span className="text-white">{r.validation_type}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {r.object_type}: {r.object_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{r.message}</p>
                  </div>
                </div>

                {r.object_id !== 'GLOBAL_SYSTEM' && (
                  <button
                    onClick={() => handleViewError(r.object_id, r.object_type)}
                    className="shrink-0 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold border border-slate-600 flex items-center gap-1 transition-all"
                  >
                    <span>View Object</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={() => setValidationModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

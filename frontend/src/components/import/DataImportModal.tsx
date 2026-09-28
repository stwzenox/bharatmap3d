import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { CadastralApi } from '../../api/client';

export const DataImportModal: React.FC = () => {
  const { isImportModalOpen, setImportModalOpen, fetchAllData } = useCadastralStore();
  const [activeTab, setActiveTab] = useState<'geojson' | 'heights' | 'dem'>('geojson');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [layerType, setLayerType] = useState<'parcel' | 'building'>('parcel');
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isImportModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setImportResult(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      let res;
      if (activeTab === 'geojson') {
        formData.append('layer_type', layerType);
        res = await CadastralApi.importGeoJson(formData);
      } else if (activeTab === 'heights') {
        res = await CadastralApi.importBuildingHeights(formData);
      } else {
        res = await CadastralApi.importDemCsv(formData);
      }

      setImportResult(res);
      // Refresh map datasets
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Import failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Import Cadastral Datasets
            </h3>
          </div>
          <button
            onClick={() => setImportModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
          <button
            onClick={() => { setActiveTab('geojson'); setSelectedFile(null); }}
            className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-all ${
              activeTab === 'geojson'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            GeoJSON (2D Parcels/Footprints)
          </button>

          <button
            onClick={() => { setActiveTab('heights'); setSelectedFile(null); }}
            className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-all ${
              activeTab === 'heights'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Building Heights (CSV)
          </button>

          <button
            onClick={() => { setActiveTab('dem'); setSelectedFile(null); }}
            className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-all ${
              activeTab === 'dem'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            DEM Terrain (CSV)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {activeTab === 'geojson' && (
            <div>
              <label className="text-slate-400 text-[11px] uppercase block mb-1.5 font-bold">
                Select Layer Target
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayerType('parcel')}
                  className={`py-2 text-center rounded border transition-all ${
                    layerType === 'parcel'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Cadastral Parcels
                </button>
                <button
                  type="button"
                  onClick={() => setLayerType('building')}
                  className={`py-2 text-center rounded border transition-all ${
                    layerType === 'building'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Building Footprints
                </button>
              </div>
            </div>
          )}

          {/* File input box */}
          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 text-center bg-slate-950/40 cursor-pointer">
            <input
              type="file"
              id="cadastral-file-upload"
              accept={activeTab === 'geojson' ? '.geojson,.json' : '.csv'}
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="cadastral-file-upload" className="cursor-pointer block">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-slate-300 font-bold mb-1">
                {selectedFile ? selectedFile.name : 'Click to choose or drag & drop file'}
              </div>
              <div className="text-[11px] text-slate-500">
                {activeTab === 'geojson' ? 'Supported: .geojson, .json' : 'Supported: .csv format'}
              </div>
            </label>
          </div>

          {/* Instructions Format Helper */}
          <div className="bg-slate-950 p-3 rounded-lg text-[11px] text-slate-400 border border-slate-800">
            {activeTab === 'geojson' && (
              <div>Standard WGS84 GeoJSON FeatureCollection with coordinates and properties.</div>
            )}
            {activeTab === 'heights' && (
              <div>Required CSV columns: <span className="text-cyan-300">building_id, height, floors</span></div>
            )}
            {activeTab === 'dem' && (
              <div>Required CSV columns: <span className="text-cyan-300">x, z, elevation</span></div>
            )}
          </div>

          {/* Status Messages */}
          {importResult && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-lg text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {importResult.message || `Imported ${importResult.imported_features || 0} features successfully.`}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button
            onClick={() => setImportModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-5 py-2 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isUploading ? 'Processing...' : 'Upload & Reconstruct'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Search, X, Layers, Building2, MapPin, Navigation,
  ShieldCheck, Split, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const GoogleSearchBar: React.FC = () => {
  const {
    searchGlobal,
    buildings,
    selectBuilding,
    parcels,
    selectParcel,
    undergroundAssets,
    selectProperty,
    runValidationCheck,
    isLayersOpen,
    setLayersOpen,
    isExplodedView,
    setExplodedView
  } = useCadastralStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchMsg(null);
    const found = await searchGlobal(query.trim());
    setIsSearching(false);

    if (!found) {
      setSearchMsg('No matching cadastral record found');
      setTimeout(() => setSearchMsg(null), 3000);
    }
  };

  const handleSelectFlyover = () => {
    const flyover = undergroundAssets.find(u => u.asset_type.includes('Flyover') || u.asset_id.includes('ELEV'));
    if (flyover) {
      selectProperty({
        type: 'Elevated Infrastructure',
        id: flyover.asset_id,
        asset_type: flyover.asset_type,
        z_min: flyover.z_min,
        z_max: flyover.z_max,
        owner: flyover.owner,
        status: flyover.status
      });
    }
  };

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 pointer-events-auto select-none">
      {/* 1. Google Maps Signature Floating Search Card */}
      <div className="w-[310px] sm:w-[340px] md:w-[360px] bg-white text-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center gap-2 px-3 py-2 transition-all">
        {/* Layers / Hamburger Trigger */}
        <button
          onClick={() => setLayersOpen(!isLayersOpen)}
          className={`p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors ${
            isLayersOpen ? 'bg-blue-50 text-blue-600' : ''
          }`}
          title="Toggle Cadastral Layers & Map Settings"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Input */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 flex items-center">
          <input
            type="text"
            placeholder="Search 14-digit ULPIN, building..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-[13px] bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none font-sans font-medium truncate"
          />
        </form>

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search Action Button */}
        <button
          onClick={() => handleSearch()}
          disabled={isSearching}
          className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-600/25 transition-all"
          title="Search Cadastre"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Search Feedback Message Toast */}
      {searchMsg && (
        <div className="w-[390px] bg-red-600 text-white text-xs px-3 py-2 rounded-xl shadow-lg animate-fade-in font-medium">
          {searchMsg}
        </div>
      )}

      {/* 2. Google Maps Style Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[360px] pb-1 no-scrollbar">
        {/* Buildings Chip */}
        <button
          onClick={() => selectBuilding('B001')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 text-xs font-semibold rounded-full shadow-md border border-slate-200/90 whitespace-nowrap hover:text-blue-600 transition-all"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Buildings ({buildings.length})</span>
        </button>

        {/* Parcels Chip */}
        <button
          onClick={() => selectParcel('P001')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 text-xs font-semibold rounded-full shadow-md border border-slate-200/90 whitespace-nowrap hover:text-blue-600 transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Parcels ({parcels.length})</span>
        </button>

        {/* Elevated Flyover Chip */}
        <button
          onClick={handleSelectFlyover}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 text-xs font-semibold rounded-full shadow-md border border-slate-200/90 whitespace-nowrap hover:text-pink-600 transition-all"
        >
          <Navigation className="w-3.5 h-3.5 text-pink-600" />
          <span>GT Flyover</span>
        </button>

        {/* Exploded Floors Toggle Chip */}
        <button
          onClick={() => setExplodedView(!isExplodedView)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full shadow-md border whitespace-nowrap transition-all ${
            isExplodedView
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/30'
              : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90 hover:text-blue-600'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explode 3D</span>
        </button>

        {/* Topology Check Chip */}
        <button
          onClick={() => runValidationCheck()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 text-xs font-semibold rounded-full shadow-md border border-slate-200/90 whitespace-nowrap hover:text-emerald-600 transition-all"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Topology</span>
        </button>
      </div>
    </div>
  );
};

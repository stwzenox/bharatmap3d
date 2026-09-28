import React, { useState } from 'react';
import {
  Search,
  Map,
  Box,
  Layers,
  Wrench,
  Bell,
  ChevronDown,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Upload,
  Ruler,
  PlusCircle,
  ExternalLink,
  Sparkles,
  Check,
  LayoutGrid
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { useAuthStore } from '../../state/useAuthStore';
import { GoogleLayersMenu } from '../google/GoogleLayersMenu';

export const TopNavBar: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    searchGlobal,
    isLayersOpen,
    setLayersOpen,
    runValidationCheck,
    setImportModalOpen,
    setMeasureMode,
    isCategoriesModalOpen,
    setCategoriesModalOpen,
    isMeasuringPolygon,
    setIsMeasuringPolygon,
    clearMeasurePolygon
  } = useCadastralStore();

  const {
    currentUser,
    role,
    isAuthenticated,
    openSuperAdminModal,
    openAddBuildingModal,
    logout
  } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    await searchGlobal(searchQuery.trim());
    setIsSearching(false);
  };

  const userName = currentUser?.name || 'Dr. Arvind Sharma';
  const userRole = role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Cadastral Admin' : 'Public Citizen';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <header className="print:hidden absolute top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm z-30 flex items-center justify-between px-4 select-none pointer-events-auto">
      {/* 1. Left: Official Ashoka Emblem + BharatMap3D Branding */}
      <div className="flex items-center gap-3 shrink-0 mr-4">
        {/* BharatMap3D Logo */}
        <img 
          src="/logo.png" 
          alt="BharatMap3D Logo" 
          className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" 
        />

        <div className="leading-tight">
          <div className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
            <span>BharatMap3D</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Digital Land. Vertical India.</p>
        </div>
      </div>

      {/* 2. Center: Integrated Search Input Box */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-2 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search ULPIN / Building / Survey No. / Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 transition-all font-medium shadow-inner"
          />
          {isSearching && (
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>
      </form>

      {/* 3. Right: Viewport Controls, Map Layers, Tools Dropdown, Alerts & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* 2D / 3D Mode Toggle Pill */}
        <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              viewMode === '2d'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              viewMode === '3d'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3D
          </button>
        </div>

        {/* Map Layers Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setLayersOpen(!isLayersOpen);
              setToolsOpen(false);
              setProfileOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isLayersOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Cadastral Layers"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Map Layers</span>
          </button>

          <GoogleLayersMenu />
        </div>

        {/* Categories Feature Button (Residential, Hospital, School, Unregistered) */}
        <button
          type="button"
          onClick={() => {
            setCategoriesModalOpen(!isCategoriesModalOpen);
            setToolsOpen(false);
            setProfileOpen(false);
            setLayersOpen(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm cursor-pointer ${
            isCategoriesModalOpen
              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm ring-1 ring-blue-400/30'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600'
          }`}
          title="Asset Categories (Residential, Hospital, School, Unregistered Assets)"
        >
          <LayoutGrid className={`w-3.5 h-3.5 ${isCategoriesModalOpen ? 'text-blue-600 stroke-[2.2]' : 'text-indigo-600'}`} />
          <span className="hidden md:inline">Categories</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
            isCategoriesModalOpen
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
          }`}>
            6
          </span>
        </button>

        {/* Tools Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setToolsOpen(!toolsOpen);
              setProfileOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Wrench className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Tools</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {toolsOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                Geospatial Tools
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !isMeasuringPolygon;
                  setIsMeasuringPolygon(next);
                  if (next) {
                    clearMeasurePolygon();
                  } else {
                    setMeasureMode('none');
                  }
                  setToolsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                  isMeasuringPolygon
                    ? 'bg-amber-50 text-amber-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ruler className={`w-3.5 h-3.5 ${isMeasuringPolygon ? 'text-amber-600' : 'text-blue-600'}`} />
                  <span>Measure Distance & Area</span>
                </div>
                {isMeasuringPolygon && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                    Active
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  runValidationCheck();
                  setToolsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cadastral Topology Validation</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(true);
                  setToolsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Import GeoJSON / Point Cloud</span>
              </button>
              {(role === 'admin' || role === 'superadmin') && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      openAddBuildingModal();
                      setToolsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-blue-600 font-bold hover:bg-blue-50 flex items-center gap-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Register 3D Building (AI)</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => runValidationCheck()}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Notifications & Validation Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setToolsOpen(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <div className="text-xs font-bold text-slate-800 leading-none">{userName}</div>
              <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">{userRole}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900 truncate">{userName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{userRole}</div>
              </div>

              {role === 'superadmin' && (
                <button
                  type="button"
                  onClick={() => {
                    openSuperAdminModal();
                    setProfileOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Super Admin Directorate</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

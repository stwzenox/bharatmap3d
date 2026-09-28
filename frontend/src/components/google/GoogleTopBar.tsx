import React from 'react';
import {
  Map, Box, Split, ShieldCheck, Upload, Ruler, RefreshCw, Sun, Moon,
  User as UserIcon, LogOut, PlusCircle, Building2, ChevronDown, ExternalLink,
  LayoutDashboard, Sparkles
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { useAuthStore } from '../../state/useAuthStore';

export const GoogleTopBar: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    mapTheme,
    setMapTheme,
    runValidationCheck,
    setImportModalOpen,
    measureMode,
    setMeasureMode,
    isMeasuringPolygon,
    setIsMeasuringPolygon,
    fetchAllData,
  } = useCadastralStore();

  const {
    currentUser,
    role,
    isAuthenticated,
    openAuthModal,
    openSuperAdminModal,
    openAddBuildingModal,
    logout
  } = useAuthStore();

  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 pointer-events-auto select-none">
      {/* 1. View Mode Segmented Control (Google Maps Pill) */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-1 flex items-center gap-0.5">
        <button
          onClick={() => setViewMode('2d')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-xl font-semibold transition-all ${
            viewMode === '2d'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="2D Standard GIS Cadastre"
        >
          <Map className="w-3.5 h-3.5" />
          <span>2D</span>
        </button>

        <button
          onClick={() => setViewMode('3d')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-xl font-semibold transition-all ${
            viewMode === '3d'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="3D Vertical Cadastre & Digital Twin"
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D</span>
        </button>

        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-xl font-semibold transition-all ${
            viewMode === 'split'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Synchronized Split View"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>
      </div>

      {/* 2. Utility Actions (Topology, Import, Measure, Theme, Refresh) */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-1 flex items-center gap-0.5">
        {/* Topology Validation */}
        <button
          onClick={() => runValidationCheck()}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
          title="Run Cadastral Topology Validation"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden 2xl:inline">Topology</span>
        </button>

        {/* Data Import */}
        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          title="Import GeoJSON or DEM CSV"
        >
          <Upload className="w-4 h-4 text-blue-600" />
          <span className="hidden 2xl:inline">Import</span>
        </button>

        {/* Google Earth Style Polygon & Distance Measurement Tool (Admin & Super Admin only) */}
        {(role === 'admin' || role === 'superadmin') && (
          <button
            onClick={() => {
              const next = !isMeasuringPolygon;
              setIsMeasuringPolygon(next);
              if (!next) {
                setMeasureMode('none');
              }
            }}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              isMeasuringPolygon || measureMode !== 'none'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Measure Footprint & 3D Building (Google Earth Style)"
          >
            <Ruler className="w-4 h-4 text-amber-600" />
            <span className="hidden 2xl:inline">Measure</span>
          </button>
        )}

        {/* Theme Toggle (Clean Google Street Map vs Dark) */}
        <button
          onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          title={mapTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Clean Street Map'}
        >
          {mapTheme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={() => fetchAllData()}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all"
          title="Refresh Cadastral Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Role Privileged Actions (Super Admin Dashboard / Admin Dashboard / Admin Add Building) */}
      {role === 'superadmin' && (
        <button
          onClick={() => {
            window.open('/superadmin', '_blank');
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-2xl shadow-xl shadow-purple-900/30 text-xs font-bold transition-all animate-in fade-in"
          title="Open Super Admin Command Center in a new tab"
        >
          <ShieldCheck className="w-4 h-4 text-purple-200" />
          <span>Super Admin</span>
          <ExternalLink className="w-3.5 h-3.5 text-purple-200 ml-0.5" />
        </button>
      )}

      {(role === 'admin' || role === 'superadmin') && (
        <button
          onClick={() => {
            window.open('/admin', '_blank');
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 text-xs font-bold transition-all border border-slate-700/60 animate-in fade-in"
          title="Open Cadastral Admin Dashboard in a new tab"
        >
          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
          <span>Admin Portal</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-300 ml-0.5" />
        </button>
      )}

      {(role === 'admin' || role === 'superadmin') && (
        <button
          onClick={openAddBuildingModal}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-900/20 text-xs font-bold transition-all animate-in fade-in border border-blue-400/30"
          title="Register 3D Building Automatically with AI"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>+ Register 3D Building</span>
        </button>
      )}

      {/* 4. Sign In / User Profile Pill (Placed in the position where FastAPI live was) */}
      {!isAuthenticated ? (
        <button
          onClick={() => openAuthModal('login')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white/95 backdrop-blur-md border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl shadow-xl shadow-slate-900/10 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all"
          title="Sign in or create citizen / admin account"
        >
          <UserIcon className="w-4 h-4 text-blue-600" />
          <span>Sign In</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-1 pl-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                role === 'superadmin'
                  ? 'bg-purple-500'
                  : role === 'admin'
                  ? 'bg-blue-500'
                  : 'bg-emerald-500'
              }`}
            />
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-[11px] font-bold text-slate-800 max-w-[100px] truncate">
                {currentUser?.name}
              </div>
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                {role}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};


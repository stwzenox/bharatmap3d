import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Home,
  HeartPulse,
  GraduationCap,
  Building2,
  AlertTriangle,
  MapPin,
  Compass,
  CheckCircle2,
  ShieldAlert,
  Search,
  Layers,
  FileText,
  BadgeAlert,
  ChevronRight,
  ChevronDown,
  Box,
  LayoutGrid,
  Download,
  Users,
  Scale,
  RotateCw,
  Map as MapIcon,
  Maximize2,
  Columns
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import {
  getCadastralCategoriesData,
  CategorizedBuilding,
  CategorizedLand
} from '../../utils/categories';

export const CategoriesModal: React.FC = () => {
  const {
    isCategoriesModalOpen,
    setCategoriesModalOpen,
    buildings,
    parcels,
    verticalProperties,
    properties,
    selectBuilding,
    selectParcel,
    syncMapViewport,
    setDetailsOpen,
    selectedCategoryTab,
    setSelectedCategoryTab,
    viewMode,
    setViewMode
  } = useCadastralStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState('22 Sep 2026, 11:45 AM');
  const [layoutMode, setLayoutMode] = useState<'top' | 'side'>('top');

  // Compute live real-time categorized breakdown
  const summary = useMemo(() => {
    return getCadastralCategoriesData(buildings, parcels, verticalProperties, properties);
  }, [buildings, parcels, verticalProperties, properties]);

  // Active list based on active tab - always execute unconditionally
  const activeBuildings: CategorizedBuilding[] = useMemo(() => {
    if (!summary) return [];
    switch (selectedCategoryTab) {
      case 'residential':
        return summary.residential?.buildings || [];
      case 'hospital':
        return summary.hospital?.buildings || [];
      case 'school':
        return summary.school?.buildings || [];
      case 'commercial':
        return [...(summary.commercial?.buildings || []), ...(summary.civic?.buildings || [])];
      case 'unregistered_buildings':
        return summary.unregisteredBuildings?.buildings || [];
      case 'all':
      default:
        return [
          ...(summary.residential?.buildings || []),
          ...(summary.hospital?.buildings || []),
          ...(summary.school?.buildings || []),
          ...(summary.commercial?.buildings || []),
          ...(summary.civic?.buildings || []),
          ...(summary.unregisteredBuildings?.buildings || [])
        ];
    }
  }, [selectedCategoryTab, summary]);

  // Filtered buildings by search query - always execute unconditionally
  const filteredBuildings = useMemo(() => {
    if (!activeBuildings) return [];
    if (!searchQuery.trim()) return activeBuildings;
    const q = searchQuery.toLowerCase();
    return activeBuildings.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.building_id || '').toLowerCase().includes(q) ||
        (b.ulpin && b.ulpin.toLowerCase().includes(q)) ||
        (b.owner || '').toLowerCase().includes(q) ||
        (b.address || '').toLowerCase().includes(q) ||
        (b.survey_number || '').toLowerCase().includes(q) ||
        (b.building_type || '').toLowerCase().includes(q)
    );
  }, [activeBuildings, searchQuery]);

  // Filtered unregistered land parcels - always execute unconditionally
  const filteredUnregisteredLand = useMemo(() => {
    const parcelsList = summary?.unregisteredLand?.parcels || [];
    if (!searchQuery.trim()) return parcelsList;
    const q = searchQuery.toLowerCase();
    return parcelsList.filter(
      (p) =>
        (p.parcel_id || '').toLowerCase().includes(q) ||
        (p.survey_number || '').toLowerCase().includes(q) ||
        (p.land_use || '').toLowerCase().includes(q) ||
        (p.owner || '').toLowerCase().includes(q) ||
        (p.unregisteredReason && p.unregisteredReason.toLowerCase().includes(q))
    );
  }, [summary?.unregisteredLand?.parcels, searchQuery]);

  // Category coordinates map for camera flight
  const categoryTargets: Record<string, { center: [number, number]; zoom: number; pitch: number; bearing: number }> = useMemo(() => ({
    school: { center: [81.8475, 25.4355], zoom: 17.5, pitch: 62, bearing: 25 },
    hospital: { center: [81.8460, 25.4368], zoom: 17.5, pitch: 62, bearing: -20 },
    residential: { center: [81.8450, 25.4348], zoom: 17.2, pitch: 60, bearing: 15 },
    commercial: { center: [81.8470, 25.4365], zoom: 17.0, pitch: 60, bearing: 5 },
    unregistered_buildings: { center: [81.8479, 25.4368], zoom: 17.6, pitch: 65, bearing: 35 },
    unregistered_land: { center: [81.8485, 25.4372], zoom: 17.0, pitch: 50, bearing: 15 },
    all: { center: [81.8463, 25.4358], zoom: 16.5, pitch: 58, bearing: 15 }
  }), []);



  // Synchronize 3D Camera with selected category tab
  useEffect(() => {
    if (!isCategoriesModalOpen) return;

    // Ensure 3D view mode is active so the 3D digital twin map is running in the background
    if (viewMode !== '3d') {
      setViewMode('3d');
    }

    const map3d = (window as any).map3d;
    if (!map3d) return;

    const target = categoryTargets[selectedCategoryTab] || categoryTargets.all;
    try {
      map3d.easeTo({
        ...target,
        duration: 1200
      });
    } catch (e) {
      // MapLibre easeTo safe fallback
    }
  }, [selectedCategoryTab, isCategoriesModalOpen, viewMode, setViewMode, categoryTargets]);

  // Early return: strictly after all hooks have executed unconditionally
  if (!isCategoriesModalOpen) return null;

  const handleResetCamera = () => {
    const map3d = (window as any).map3d;
    if (map3d) {
      const target = categoryTargets[selectedCategoryTab] || categoryTargets.all;
      map3d.easeTo({ ...target, duration: 800 });
    }
  };

  // Fly and focus map camera on a building
  const handleLocateBuilding = (b: CategorizedBuilding, keepModalOpen = false) => {
    selectBuilding(b.building_id);
    setDetailsOpen(true);
    syncMapViewport(b.coordinates, 18.0, '2d', 0, 55);

    const map3d = (window as any).map3d;
    if (map3d) {
      map3d.easeTo({
        center: [b.coordinates[1], b.coordinates[0]],
        zoom: 17.5,
        pitch: 62,
        bearing: 15,
        duration: 1200
      });
    }

    if (!keepModalOpen && layoutMode === 'top') {
      setCategoriesModalOpen(false);
    }
  };

  // Fly and focus map camera on an unregistered land parcel
  const handleLocateLand = (p: CategorizedLand, keepModalOpen = false) => {
    selectParcel(p.parcel_id);
    setDetailsOpen(true);
    syncMapViewport(p.coordinates, 18.0, '2d', 0, 45);

    const map3d = (window as any).map3d;
    if (map3d) {
      map3d.easeTo({
        center: [p.coordinates[1], p.coordinates[0]],
        zoom: 17.0,
        pitch: 50,
        bearing: 0,
        duration: 1200
      });
    }

    if (!keepModalOpen && layoutMode === 'top') {
      setCategoriesModalOpen(false);
    }
  };

  // Export current list to CSV
  const handleExportData = () => {
    let rows: any[] = [];
    if (selectedCategoryTab === 'unregistered_land') {
      rows = filteredUnregisteredLand.map(p => ({
        Parcel_ID: p.parcel_id,
        Survey_Number: p.survey_number,
        Land_Use: p.land_use,
        Area_Sqm: p.area_sqm,
        Area_Acres: p.area_acres,
        Status: p.status,
        Risk: p.cadastralRisk || 'High',
        Issue: p.unregisteredReason || ''
      }));
    } else {
      rows = filteredBuildings.map(b => ({
        Building_ID: b.building_id,
        Name: b.name,
        Category: b.categoryLabel,
        ULPIN: b.ulpin || 'MISSING',
        Floors: b.floor_count,
        Height_M: b.height,
        Plot_Area_Sqm: b.plot_area,
        Facility: b.facilityDetails || '',
        Address: b.address,
        Status: b.isRegistered ? 'Verified' : 'Unregistered'
      }));
    }

    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + [
      headers,
      ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `3d_cadastre_${selectedCategoryTab}_assets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Section banner metadata configuration based on active category tab
  const getCategoryBannerMeta = () => {
    switch (selectedCategoryTab) {
      case 'school':
        return {
          icon: GraduationCap,
          iconBg: 'bg-emerald-50 text-emerald-700',
          title: `School & Educational Institutions Cadastre (${summary?.school?.count || 3} Campuses Mapped)`,
          description: 'Educational institutes, degree colleges, and model public schools with registered campus land boundaries.'
        };
      case 'hospital':
        return {
          icon: HeartPulse,
          iconBg: 'bg-rose-50 text-rose-700',
          title: `Hospital & Healthcare Infrastructure Cadastre (${summary?.hospital?.count || 4} Facilities Identified)`,
          description: 'Critical health infrastructure mapped with designated emergency corridors, patient beds, and vertical medical wings.'
        };
      case 'residential':
        return {
          icon: Home,
          iconBg: 'bg-blue-50 text-blue-700',
          title: `Residential Housing & Multi-Family Towers (${summary?.residential?.count || 5} Enclaves • ${summary?.residential?.units || 104} Units)`,
          description: 'Vertical apartment complexes with individual 3D ULPINs assigned per floor unit.'
        };
      case 'commercial':
        return {
          icon: Building2,
          iconBg: 'bg-indigo-50 text-indigo-700',
          title: `Commercial & Civic Infrastructure Cadastre (${(summary?.commercial?.count || 0) + (summary?.civic?.count || 0) || 9} Complexes Mapped)`,
          description: 'Corporate towers, administrative revenue offices, and public transit infrastructure centers.'
        };
      case 'unregistered_buildings':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-50 text-red-700',
          title: `Unregistered & Non-Compliant 3D Vertical Assets (${summary?.unregisteredBuildings?.count || 3} Structures Detected)`,
          description: 'These buildings exhibit unauthorized vertical floor additions, lack a formal 14-digit 3D ULPIN, or occupy parcels without municipal deed verification.'
        };
      case 'unregistered_land':
        return {
          icon: ShieldAlert,
          iconBg: 'bg-amber-50 text-amber-700',
          title: `Unregistered & Encroached Land Parcels Monitoring (${summary?.unregisteredLand?.count || 3} Plots • ${summary?.unregisteredLand?.totalAreaAcres || 1.82} Acres Unsurveyed)`,
          description: 'These land plots lack an assigned 14-digit Land ULPIN, are missing vectorized polygons in BhuNaksha, or carry active encroachment / sub-judice litigation flags.'
        };
      case 'all':
      default:
        return {
          icon: LayoutGrid,
          iconBg: 'bg-blue-50 text-blue-700',
          title: `Complete Cadastral Asset Portfolio (${summary?.totalBuildings || 24} Buildings • ${summary?.totalParcels || 18} Land Parcels)`,
          description: 'Comprehensive 3D GIS classification across all residential, healthcare, educational, commercial and unregistered parcels.'
        };
    }
  };

  const bannerMeta = getCategoryBannerMeta();
  const BannerIcon = bannerMeta.icon;

  // Shared Categories Content Body
  const renderCategoriesBody = () => (
    <div className="px-4 sm:px-6 py-3.5 space-y-3">
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Categories & Asset Classification
            </h1>
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full">
              Prayagraj 3D GIS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time count of Residential, Hospital, School, Unregistered Buildings & Land
          </p>
        </div>
      </div>

      {/* 6 KPI Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Residential */}
        <button
          onClick={() => setSelectedCategoryTab('residential')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedCategoryTab === 'residential'
              ? 'bg-white border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold font-sans text-slate-900">
              {summary?.residential?.count || 5}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Residential</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
              {summary?.residential?.units || 104} Apartment Units
            </div>
          </div>
        </button>

        {/* 2. Hospitals */}
        <button
          onClick={() => setSelectedCategoryTab('hospital')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedCategoryTab === 'hospital'
              ? 'bg-white border-rose-500 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold font-sans text-slate-900">
              {summary?.hospital?.count || 4}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Hospitals</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
              Emergency & Clinics
            </div>
          </div>
        </button>

        {/* 3. Schools & Colleges */}
        <button
          onClick={() => setSelectedCategoryTab('school')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedCategoryTab === 'school'
              ? 'bg-[#edfcf2]/60 border-2 border-emerald-500 shadow-md shadow-emerald-500/15'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold font-sans text-slate-900">
              {summary?.school?.count || 3}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Schools & Colleges</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
              Academic Campuses
            </div>
          </div>
        </button>

        {/* 4. Commercial & Civic */}
        <button
          onClick={() => setSelectedCategoryTab('commercial')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedCategoryTab === 'commercial'
              ? 'bg-white border-indigo-500 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold font-sans text-slate-900">
              {(summary?.commercial?.count || 0) + (summary?.civic?.count || 0) || 9}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Commercial & Civic</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
              Corporate & Public
            </div>
          </div>
        </button>

        {/* 5. Unregistered Buildings */}
        <button
          onClick={() => setSelectedCategoryTab('unregistered_buildings')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedCategoryTab === 'unregistered_buildings'
              ? 'bg-white border-red-500 shadow-md shadow-red-500/15 ring-2 ring-red-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold font-sans text-slate-900">
              {summary?.unregisteredBuildings?.count || 3}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Unreg. Buildings</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
              Missing 3D ULPIN
            </div>
          </div>
        </button>

        {/* 6. Unregistered Land */}
        <button
          onClick={() => setSelectedCategoryTab('unregistered_land')}
          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
            selectedCategoryTab === 'unregistered_land'
              ? 'bg-white border-amber-500 shadow-md shadow-amber-500/15 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold font-sans text-slate-900">
              {summary?.unregisteredLand?.count || 3}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Unreg. Land</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
              {summary?.unregisteredLand?.totalAreaAcres || 1.82} Acres
            </div>
          </div>
        </button>
      </div>

      {/* Filter Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs font-semibold">
        {[
          { id: 'all', label: 'All Categories', count: summary?.totalBuildings || 24 },
          { id: 'residential', label: 'Residential', count: summary?.residential?.count || 5 },
          { id: 'hospital', label: 'Hospitals & Healthcare', count: summary?.hospital?.count || 4 },
          { id: 'school', label: 'Schools & Education', count: summary?.school?.count || 3 },
          { id: 'commercial', label: 'Commercial & Civic', count: (summary?.commercial?.count || 0) + (summary?.civic?.count || 0) || 9 },
          { id: 'unregistered_buildings', label: '⚠️ Unregistered Buildings', count: summary?.unregisteredBuildings?.count || 3 },
          { id: 'unregistered_land', label: '🌐 Unregistered Land', count: summary?.unregisteredLand?.count || 3 },
        ].map((tab) => {
          const isActive = selectedCategoryTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategoryTab(tab.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#064e3b] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Section Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bannerMeta.iconBg}`}>
            <BannerIcon className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {bannerMeta.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {bannerMeta.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setCategoriesModalOpen(false);
              setViewMode('3d');
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>View Full Map</span>
          </button>

          <button
            onClick={handleExportData}
            className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#065f46] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data +</span>
          </button>
        </div>
      </div>

      {/* Asset Cards Grid */}
      {selectedCategoryTab === 'unregistered_land' ? (
        /* Unregistered Land Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnregisteredLand.map((parcel) => (
            <div
              key={parcel.parcel_id}
              className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Drone Aerial Banner for Land */}
              <div className="relative h-32 bg-slate-900 overflow-hidden">
                <img 
                  src="/images/category_banner.jpg" 
                  alt={parcel.parcel_id}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{parcel.cadastralRisk || 'High'} Risk</span>
                </div>
                <div className="absolute bottom-2.5 left-3 text-white">
                  <span className="font-mono font-bold text-sm">{parcel.parcel_id}</span>
                  <span className="text-[11px] text-amber-300 ml-2 font-mono">Survey: {parcel.survey_number}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  {parcel.land_use}
                </div>

                {/* Cadastral Issue Description */}
                <div className="text-[11px] bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Cadastral Issue:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {parcel.unregisteredReason}
                  </p>
                </div>

                {/* 3 Metric Chips */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 bg-slate-50/60 p-2 rounded-xl text-left">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Area</span>
                    <span className="text-[11px] font-bold text-slate-800">{(parcel.area_sqm || 0).toLocaleString()} m²</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Acres</span>
                    <span className="text-[11px] font-bold text-amber-700">{parcel.area_acres} Acres</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Status</span>
                    <span className="text-[11px] font-bold text-red-600 truncate block">{parcel.status}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleLocateLand(parcel, layoutMode === 'side')}
                    className="flex-1 py-1.5 bg-[#064e3b] hover:bg-[#065f46] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{layoutMode === 'side' ? 'Inspect 3D Twin' : 'Locate on Map'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Buildings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuildings.map((building) => {
            const isUnreg = !building.isRegistered;
            const isSchool = building.category === 'school';
            const isHospital = building.category === 'hospital';
            const isResidential = building.category === 'residential';

            return (
              <div
                key={building.building_id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Top Aerial Drone Photo */}
                <div className="relative h-32 bg-slate-900 overflow-hidden">
                  <img 
                    src={building.image_url || (isSchool ? '/images/school_campus.jpg' : isHospital ? '/images/hospital_building.jpg' : isResidential ? '/images/residential_towers.jpg' : '/images/category_banner.jpg')} 
                    alt={building.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Top-Right Badge: Verified or Unregistered */}
                  <div className="absolute top-2.5 right-2.5">
                    {isUnreg ? (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{building.cadastralRisk || 'High'} Risk</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* ID + Category Pill + Right Arrow */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-base">
                          {building.building_id}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          isUnreg
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : isSchool
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                            : isHospital
                            ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                            : isResidential
                            ? 'bg-blue-50 text-blue-700 border-blue-200/70'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {building.categoryLabel}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleLocateBuilding(building, layoutMode === 'side')}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title={layoutMode === 'side' ? 'Focus 3D Map Beside' : 'Inspect on 3D Map'}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* ULPIN Code */}
                    <div>
                      {isUnreg ? (
                        <span className="text-red-500 font-bold text-xs font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>MISSING 3D ULPIN</span>
                        </span>
                      ) : (
                        <span className="text-blue-600 font-mono font-bold text-xs">
                          {building.ulpin}
                        </span>
                      )}
                    </div>

                    {/* Building Title */}
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 leading-snug">
                      {building.name}
                    </h3>

                    {/* Location Address */}
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{building.address}</span>
                    </p>
                  </div>

                  {/* 3 Metric Chips (Facility, Students/Units/Beds, Land Area) */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl text-left">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Facility</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 leading-tight mt-0.5 line-clamp-2">
                        {building.facilityDetails || building.specialty || 'CBSE Affiliated'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>
                          {isHospital ? 'Beds' : isResidential ? 'Units' : 'Students'}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                        {building.studentCount ? building.studentCount.toLocaleString() : (building.unitCount || (building.floor_count * 4)).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Scale className="w-3 h-3 text-teal-600 shrink-0" />
                        <span>Land Area</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                        {building.landAreaAcres || 2.4} Acres
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Shared Footer Bar
  const renderFooter = () => (
    <footer className="px-6 py-2.5 bg-white border-t border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 shrink-0 gap-2">
      <div className="flex items-center gap-2">
        <span>
          Total Categorized Assets: <strong className="text-slate-800">{summary?.totalBuildings || 24} Buildings</strong> • <strong className="text-slate-800">{summary?.totalParcels || 18} Land Parcels</strong>
        </span>
        <span className="text-slate-300">|</span>
        <span>
          Coordinate System: <span className="font-mono text-slate-600 font-semibold">WGS 84 / UTM 43N</span>
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Last Updated: {lastUpdated}</span>
        </span>
        <button 
          onClick={() => window.location.reload()}
          className="p-1 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
          title="Refresh Cadastre"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );

  // Common Top Search and Navigation Bar
  const renderTopControls = () => (
    <div className="relative z-10 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 pointer-events-auto">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search building, school, hospital, ULPIN or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right Controls: Location Dropdown + Layout Switcher + Map Toggles + Exit Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Location Dropdown Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-md text-xs font-semibold text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Prayagraj, Uttar Pradesh</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Layout Mode Switcher (Top 3D View vs Beside 3D Map) */}
        <div className="hidden sm:flex items-center bg-white/95 backdrop-blur-md border border-slate-200 rounded-full p-1 shadow-md text-xs font-semibold text-slate-600">
          <button
            onClick={() => setLayoutMode('top')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              layoutMode === 'top' ? 'bg-[#064e3b] text-white shadow-xs' : 'hover:text-slate-900'
            }`}
            title="Show 3D Map in Top Window"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Top 3D View</span>
          </button>
          <button
            onClick={() => setLayoutMode('side')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              layoutMode === 'side' ? 'bg-[#064e3b] text-white shadow-xs' : 'hover:text-slate-900'
            }`}
            title="Show 3D Map Beside Categories (Side-by-Side)"
          >
            <Columns className="w-3 h-3" />
            <span>Beside 3D Map</span>
          </button>
        </div>

        {/* Map View Switcher Pill */}
        <div className="hidden sm:flex items-center bg-white/95 backdrop-blur-md border border-slate-200 rounded-full p-1 shadow-md text-xs font-semibold text-slate-600">
          <button
            onClick={() => {
              setViewMode('2d');
              setCategoriesModalOpen(false);
            }}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === '2d' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3 h-3" />
            <span>Map</span>
          </button>
          <button
            onClick={() => {
              setViewMode('3d');
              handleResetCamera();
            }}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === '3d' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Box className="w-3 h-3" />
            <span>3D</span>
          </button>
          <button
            onClick={() => {
              setViewMode('split');
              setCategoriesModalOpen(false);
            }}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'split' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <span>Satellite</span>
          </button>
          <div className="px-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Close Button to Return to Full Map */}
        <button
          onClick={() => setCategoriesModalOpen(false)}
          className="p-2 rounded-full bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200 transition-all cursor-pointer"
          title="Return to 3D Map View"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // =========================================================================
  // VIEW MODE 1: TOP 3D WINDOW (3D Map seen in top banner area, cards below)
  // =========================================================================
  if (layoutMode === 'top') {
    return (
      <div className="fixed top-14 left-0 sm:left-[72px] lg:left-[76px] right-0 bottom-0 z-30 font-sans print:hidden select-none pointer-events-none flex flex-col justify-between animate-in fade-in">
        
        {/* ========================================================================= */}
        {/* 1. TOP LIVE 3D MAP WINDOW (Positioned exactly at red line marker: h-36 / 144px) */}
        {/* ========================================================================= */}
        <div className="relative h-36 lg:h-36 w-full shrink-0 overflow-hidden pointer-events-none border-b-2 border-slate-300 shadow-md">
          {/* Subtle gradient overlay to enhance search bar readability over 3D terrain */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-transparent to-black/15 pointer-events-none" />

          {/* Floating Top Controls Row */}
          {renderTopControls()}
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN CATEGORIES CONTENT BODY (Scrollable white card area below 3D window) */}
        {/* ========================================================================= */}
        <div className="flex-1 bg-[#f8fafc] text-slate-800 overflow-y-auto pointer-events-auto flex flex-col justify-between">
          {renderCategoriesBody()}
          {renderFooter()}
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: BESIDE 3D MAP (Split side-by-side mode: categories on left, 3D map beside it)
  // =========================================================================
  return (
    <div className="fixed top-14 left-0 sm:left-[72px] lg:left-[76px] right-0 bottom-0 z-30 font-sans print:hidden select-none pointer-events-none flex animate-in fade-in">
      
      {/* Left Panel: Categories List & Data (Takes 54% width, leaving live 3D map beside it) */}
      <div className="w-full md:w-[60%] lg:w-[54%] h-full bg-[#f8fafc] text-slate-800 overflow-y-auto pointer-events-auto flex flex-col justify-between border-r border-slate-300 shadow-2xl animate-in slide-in-from-left duration-300">
        <div>
          {/* Top Controls within Left Panel */}
          <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
            {renderTopControls()}
          </div>
          {renderCategoriesBody()}
        </div>
        {renderFooter()}
      </div>

      {/* Right Area: Wide Open to Live 3D Model Map Beside It */}
      <div className="hidden md:flex flex-1 h-full pointer-events-none relative flex-col justify-between p-4">
        {/* Top Floating Info Bar over 3D Map */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>3D Model Map Live Beside Categories</span>
          </div>

          <button
            onClick={() => setLayoutMode('top')}
            className="px-3 py-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-full border border-slate-200 text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Switch back to Top 3D Window View"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Top 3D View</span>
          </button>
        </div>

      </div>

    </div>
  );
};

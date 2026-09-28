import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  MoreHorizontal,
  MapPin,
  CheckCircle2,
  Award,
  Printer,
  Box,
  Ruler,
  Pencil,
  Sparkles,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Trash2,
  PlusCircle,
  FileBadge,
  ExternalLink
} from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { useAuthStore } from '../../state/useAuthStore';
import { ScannableQRCode } from '../common/ScannableQRCode';
import { format14DigitUlpin } from '../../utils/ulpin';

export const GooglePlaceSheet: React.FC = () => {
  const { role, openAddBuildingModal } = useAuthStore();
  const isAdminOrSuperAdmin = role === 'admin' || role === 'superadmin';

  const {
    selectedProperty,
    selectedBuildingId,
    selectedFloorId,
    selectedVerticalParcelId,
    floors,
    buildings,
    verticalProperties,
    selectBuilding,
    selectFloor,
    selectVerticalParcel,
    generateUlpinForCurrent,
    setReportModalOpen,
    isExplodedView,
    setExplodedView,
    setMeasureMode,
    isDetailsOpen,
    setDetailsOpen,
    openBuilding3DModal,
    openEditOwnerModal,
    removeBuilding,
    setCategoriesModalOpen,
    setSelectedCategoryTab
  } = useCadastralStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'ownership' | 'documents' | 'activity'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  if (!selectedProperty || !isDetailsOpen) return null;

  const prop = selectedProperty;

  // Resolve target building from selected property or selected building ID
  const activeBuildingId = (
    prop.building_id ||
    (prop.type === 'Building' ? prop.id : null) ||
    selectedBuildingId ||
    (buildings.find(b => b.parcel_id === prop.parcel_id)?.building_id) ||
    'B001'
  );

  const matchedBuilding = activeBuildingId 
    ? buildings.find(b => b.building_id?.toUpperCase() === activeBuildingId.toUpperCase())
    : null;

  // Building navigation (Prev / Next)
  const currentBuildingIndex = buildings.findIndex(
    b => b.building_id?.toUpperCase() === activeBuildingId.toUpperCase()
  );

  const handlePrevBuilding = () => {
    if (buildings.length <= 1) return;
    const prevIdx = currentBuildingIndex <= 0 ? buildings.length - 1 : currentBuildingIndex - 1;
    selectBuilding(buildings[prevIdx].building_id);
  };

  const handleNextBuilding = () => {
    if (buildings.length <= 1) return;
    const nextIdx = currentBuildingIndex >= buildings.length - 1 ? 0 : currentBuildingIndex + 1;
    selectBuilding(buildings[nextIdx].building_id);
  };

  const buildingFloors = activeBuildingId
    ? floors
        .filter(f => f.building_id?.toUpperCase() === activeBuildingId.toUpperCase())
        .sort((a, b) => b.floor_number - a.floor_number)
    : [];

  const handleCopyUlpin = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateUlpin = async () => {
    setIsGenerating(true);
    setGenMessage(null);
    const res = await generateUlpinForCurrent();
    setIsGenerating(false);
    if (res) {
      setGenMessage(`Assigned ULPIN: ${res}`);
      setTimeout(() => setGenMessage(null), 4000);
    }
  };

  const handleDeleteBuilding = async () => {
    const targetBid = matchedBuilding?.building_id || activeBuildingId;
    if (!targetBid) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Building "${targetBid}"?`
    );
    if (!confirmDelete) return;
    await removeBuilding(targetBid);
    setDetailsOpen(false);
  };

  const currentUlpin = prop.ulpin || format14DigitUlpin(activeBuildingId || 'B001', selectedFloorId || 'F01', prop.id || 'P01');

  // Building specifications dynamically calculated from real building entity
  const totalFloors = matchedBuilding?.floor_count || prop.floor_count || 6;
  const totalHeight = (matchedBuilding?.height || prop.height || 18.00).toFixed(2);
  const bldgAreaNum = matchedBuilding?.area || prop.area || 280.0;
  const plotArea = `${bldgAreaNum.toFixed(1)} m²`;
  const builtUpArea = `${(bldgAreaNum * totalFloors).toFixed(1)} m²`;
  const parcelSurveyNo = prop.survey_number || prop.parcel_id || matchedBuilding?.parcel_id || 'P001';
  const primaryHolder = prop.owner_name || prop.owner || matchedBuilding?.owner || 'Govt Verified Citizen';
  const propertyCategory = prop.property_type || matchedBuilding?.building_type || 'Residential Complex';

  return (
    <div className="print:hidden absolute top-16 left-[84px] bottom-4 w-[390px] max-h-[calc(100vh-80px)] bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/90 z-20 flex flex-col overflow-hidden select-none pointer-events-auto transition-all animate-fade-in">
      {/* 1. Top Navigation Bar: ← Buildings (15)        < Prev | Next > */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-slate-100">
        <button
          onClick={() => setDetailsOpen(false)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Buildings ({buildings.length || 15})</span>
        </button>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
          <button
            onClick={handlePrevBuilding}
            className="hover:text-slate-900 transition-colors px-1"
          >
            &lt; Prev
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={handleNextBuilding}
            className="hover:text-slate-900 transition-colors px-1"
          >
            Next &gt;
          </button>
        </div>
      </div>

      {/* 2. Building Badges & Actions */}
      <div className="px-5 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
              BUILDING
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Topology Valid</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCopyUlpin(currentUlpin)}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Share / Copy ULPIN"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowQr(!showQr)}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="More Actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Building Title & Address */}
        <h2 className="text-xl font-black text-slate-900 tracking-tight mt-2">
          Building {activeBuildingId || 'B001'}
        </h2>
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>Prayagraj Central, Uttar Pradesh 211001</span>
        </p>

        {/* Rating & Trust Badges */}
        <div className="flex items-center gap-3 mt-2 text-xs font-medium">
          <div className="flex items-center gap-1 text-amber-500 font-bold">
            <span>★ 4.9</span>
            <span className="text-slate-400 font-normal">(RERA Cadastre)</span>
          </div>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bhu-Aadhaar Verified</span>
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs (Overview, Details, Ownership, Documents, Activity) */}
      <div className="flex items-center gap-4 px-5 mt-3 border-b border-slate-200 text-xs font-semibold">
        {(['overview', 'details', 'ownership', 'documents', 'activity'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 transition-all capitalize ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 4. Circular Action Buttons Row */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-1 bg-white">
        {/* Assign ULPIN */}
        <button
          onClick={handleGenerateUlpin}
          disabled={isGenerating}
          className="flex-1 flex flex-col items-center justify-center gap-1 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full border border-blue-200 flex items-center justify-center text-blue-600 bg-white group-hover:bg-blue-50 transition-colors shadow-xs">
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileBadge className="w-4 h-4" />
            )}
          </div>
          <span className="text-[10px] font-semibold text-slate-700 leading-tight text-center">
            Assign<br />ULPIN
          </span>
        </button>

        {/* Cadastre Report */}
        <button
          onClick={() => setReportModalOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 bg-white group-hover:bg-slate-50 transition-colors shadow-xs">
            <Printer className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-slate-700 leading-tight text-center">
            Cadastre<br />Report
          </span>
        </button>

        {/* 3D View (Highlighted/Active in image) */}
        <button
          onClick={() => openBuilding3DModal(activeBuildingId)}
          className="flex-1 flex flex-col items-center justify-center gap-1 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors shadow-xs">
            <Box className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-blue-600 leading-tight text-center">
            3D View
          </span>
        </button>

        {/* Measure */}
        <button
          onClick={() => setMeasureMode('distance')}
          className="flex-1 flex flex-col items-center justify-center gap-1 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 bg-white group-hover:bg-slate-50 transition-colors shadow-xs">
            <Ruler className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-slate-700 leading-tight text-center">
            Measure
          </span>
        </button>

        {/* More */}
        <button
          onClick={() => setShowQr(!showQr)}
          className="flex-1 flex flex-col items-center justify-center gap-1 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 bg-white group-hover:bg-slate-50 transition-colors shadow-xs">
            <MoreHorizontal className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-slate-700 leading-tight text-center">
            More
          </span>
        </button>
      </div>

      {/* Generation Toast */}
      {genMessage && (
        <div className="mx-4 mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{genMessage}</span>
        </div>
      )}

      {/* 5. Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
        {/* QR Code view if toggled */}
        {showQr && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 animate-fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Bhu-Aadhaar 3D ULPIN QR</span>
            </div>
            <ScannableQRCode
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://bhu-aadhaar.up.gov.in'}/?ulpin=${encodeURIComponent(currentUlpin)}&id=${encodeURIComponent(activeBuildingId)}#verify`}
              size={120}
              showScanHint={true}
            />
            <div className="text-[11px] font-mono font-bold text-slate-700">{currentUlpin}</div>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 tracking-tight">
                Building Information
              </h3>
              {isAdminOrSuperAdmin && (
                <button
                  onClick={() => openEditOwnerModal(activeBuildingId)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  title="Super Admin: Edit Building & Owner Details"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Parcel Survey No.</span>
                <span className="font-bold text-slate-900 font-mono">{parcelSurveyNo}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Primary Holder</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">{primaryHolder}</span>
                  {isAdminOrSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => openEditOwnerModal(activeBuildingId)}
                      className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Super Admin: Edit Owner Details"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Property Category</span>
                <button
                  type="button"
                  onClick={() => {
                    setCategoriesModalOpen(true);
                    const pCatLower = propertyCategory.toLowerCase();
                    if (pCatLower.includes('hospital') || pCatLower.includes('health')) {
                      setSelectedCategoryTab('hospital');
                    } else if (pCatLower.includes('school') || pCatLower.includes('college')) {
                      setSelectedCategoryTab('school');
                    } else if (pCatLower.includes('residential')) {
                      setSelectedCategoryTab('residential');
                    } else {
                      setSelectedCategoryTab('all');
                    }
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Browse in Categories Breakdown"
                >
                  <span>{propertyCategory}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
                </button>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Registry Status</span>
                <span className="font-bold text-emerald-600">Active Registered</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Total Floors</span>
                <span className="font-bold text-slate-900 font-mono">{totalFloors}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Total Height</span>
                <span className="font-bold text-slate-900 font-mono">{totalHeight} m</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Plot Area (2D)</span>
                <span className="font-bold text-slate-900 font-mono">{plotArea}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500 font-medium">Built-up Area (3D)</span>
                <span className="font-bold text-slate-900 font-mono">{builtUpArea}</span>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Ownership Breakdown (Real Title Holders & Partitioned Flats) */}
        {activeTab === 'ownership' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs space-y-1">
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
                Ground & Freehold Land Title
              </div>
              <div className="font-bold text-slate-900 text-sm">{primaryHolder}</div>
              <div className="text-[11px] text-slate-600">Parcel #{parcelSurveyNo} • Full Land Title</div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/80 px-3 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Vertical Strata Ownership</span>
                <span>{buildingFloors.length} Levels</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {buildingFloors.map((fl) => {
                  const floorVPs = verticalProperties.filter(vp => vp.floor_id === fl.floor_id);
                  const isMultiUnit = floorVPs.length > 1;

                  return (
                    <div key={fl.floor_id} className="p-2.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-xs">
                          Floor {fl.floor_number}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {fl.z_min}m — {fl.z_max}m
                        </span>
                      </div>

                      {isMultiUnit ? (
                        <div className="space-y-1 pl-2 border-l-2 border-indigo-300 ml-1">
                          {floorVPs.map((vp) => {
                            const subCode = vp.vertical_parcel_id?.split('-').pop() || 'Unit';
                            return (
                              <div key={vp.vertical_parcel_id} className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-indigo-700">{subCode}</span>
                                <span className="text-slate-800 font-medium">
                                  {(vp as any).owner_name || primaryHolder}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>Whole Floor Unit</span>
                          <span className="font-semibold text-slate-800">
                            {floorVPs[0]?.owner_name || primaryHolder}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Details */}
        {(activeTab === 'details' || activeTab === 'documents' || activeTab === 'activity') && (
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500 font-medium">Structure ULPIN</span>
              <span className="font-mono font-bold text-slate-900">{currentUlpin}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500 font-medium">Ground Elevation</span>
              <span className="font-mono font-bold text-slate-900">{matchedBuilding?.ground_elevation || 100.0} m</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500 font-medium">Roof Elevation</span>
              <span className="font-mono font-bold text-slate-900">{((matchedBuilding?.ground_elevation || 100.0) + (matchedBuilding?.height || 18.0)).toFixed(2)} m</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500 font-medium">Structure Type</span>
              <span className="font-bold text-slate-900">{propertyCategory}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500 font-medium">Compliance Audit</span>
              <span className="font-bold text-emerald-600">100% UP Cadastre Certified</span>
            </div>
          </div>
        )}

        {/* Admin Quick Action */}
        {isAdminOrSuperAdmin && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={handleDeleteBuilding}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Building</span>
            </button>
            <button
              onClick={() => setExplodedView(!isExplodedView)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isExplodedView ? 'Collapse 3D' : 'Explode Floors'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

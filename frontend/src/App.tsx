import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useCadastralStore } from './state/useCadastralStore';
import { useAuthStore } from './state/useAuthStore';
import { CadastralApi } from './api/client';
import { TopNavBar } from './components/navigation/TopNavBar';
import { LeftSidebar } from './components/navigation/LeftSidebar';
import { GooglePlaceSheet } from './components/google/GooglePlaceSheet';
import { GoogleMapControls } from './components/google/GoogleMapControls';
import { LeafletMap } from './map/LeafletMap';
import { OpenFreeMap3D } from './three/OpenFreeMap3D';
import { MeasureToolPanel } from './components/measurement/MeasureToolPanel';
import { GoogleEarthMeasureCard } from './components/measurement/GoogleEarthMeasureCard';
import { ValidationResultsPanel } from './components/validation/ValidationResultsPanel';
import { DataImportModal } from './components/import/DataImportModal';
import { PropertyReportModal } from './components/report/PropertyReportModal';
import { AuthModal } from './components/auth/AuthModal';
import { SuperAdminDashboardModal } from './components/admin/SuperAdminDashboardModal';
import { AddBuildingPipelineModal } from './components/admin/AddBuildingPipelineModal';
import { EditBuildingOwnerModal } from './components/admin/EditBuildingOwnerModal';
import { Building3DInspectorModal } from './components/modals/Building3DInspectorModal';
import { CategoriesModal } from './components/categories/CategoriesModal';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { BackendOfflineModal } from './components/common/BackendOfflineModal';
import { DemoModeBanner } from './components/common/DemoModeBanner';
import { CompulsoryAuthScreen } from './components/auth/CompulsoryAuthScreen';

export const App: React.FC = () => {
  const { viewMode, fetchAllData, isLoading, error, mapTheme, syncNotification } = useCadastralStore();
  const { role, openAuthModal, isAuthenticated } = useAuthStore();
  const isAdminOrSuperAdmin = role === 'admin' || role === 'superadmin';
  const isLight = mapTheme === 'light';

  const [currentRoute, setCurrentRoute] = React.useState<'map' | 'superadmin' | 'admin'>(() => {
    const p = window.location.pathname.toLowerCase();
    const s = window.location.search.toLowerCase();
    const h = window.location.hash.toLowerCase();
    if (p.startsWith('/superadmin') || s.includes('panel=superadmin') || s.includes('view=superadmin') || h === '#superadmin') {
      return 'superadmin';
    }
    if (p.startsWith('/admin') || s.includes('panel=admin') || s.includes('view=admin') || h === '#admin') {
      return 'admin';
    }
    return 'map';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      const s = window.location.search.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p.startsWith('/superadmin') || s.includes('panel=superadmin') || s.includes('view=superadmin') || h === '#superadmin') {
        setCurrentRoute('superadmin');
      } else if (p.startsWith('/admin') || s.includes('panel=admin') || s.includes('view=admin') || h === '#admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('map');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Strict Super Admin Access Guard: If anyone tries to open /superadmin without being logged in as superadmin, redirect back to map
  useEffect(() => {
    if (currentRoute === 'superadmin' && role !== 'superadmin') {
      window.history.replaceState({}, '', '/');
      setCurrentRoute('map');
      openAuthModal('login');
    }
  }, [currentRoute, role, openAuthModal]);

  // Strict Admin Access Guard: If anyone tries to open /admin without being logged in as admin or superadmin, redirect back to map
  useEffect(() => {
    if (currentRoute === 'admin' && role !== 'admin' && role !== 'superadmin') {
      window.history.replaceState({}, '', '/');
      setCurrentRoute('map');
      openAuthModal('login');
    }
  }, [currentRoute, role, openAuthModal]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [fetchAllData, isAuthenticated]);

  // Automated Heartbeat & Auto-Sync Engine for Remote PostgreSQL 17 (46.247.108.191:30182)
  useEffect(() => {
    const checkAndSync = async () => {
      const store = useCadastralStore.getState();
      if (store.backendOffline || store.offlineModalOpen) {
        const health = await CadastralApi.checkBackendHealth();
        if (health.isLive) {
          // Remote PostgreSQL cluster came back online!
          const syncRes = await CadastralApi.syncOfflineQueue();
          await store.fetchAllData();
          useCadastralStore.setState({
            isLiveBackend: true,
            backendOffline: false,
            offlineModalOpen: false,
            pendingSyncCount: 0,
            syncNotification: syncRes.synced > 0
              ? `PostgreSQL 17 Online (46.247.108.191:30182) — Auto-synchronized ${syncRes.synced} offline building(s) to live database!`
              : `Remote PostgreSQL 17 Reconnected (46.247.108.191:30182) — Live database synchronized.`,
          });
          setTimeout(() => {
            useCadastralStore.setState({ syncNotification: null });
          }, 6000);
        }
      }
    };

    const interval = setInterval(checkAndSync, 8000);
    window.addEventListener('online', checkAndSync);
    window.addEventListener('focus', checkAndSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkAndSync);
      window.removeEventListener('focus', checkAndSync);
    };
  }, []);

  // 0. Compulsory Authentication Gatekeeper: User must have an account and be signed in to view the map
  if (!isAuthenticated) {
    return (
      <>
        <DemoModeBanner />
        <BackendOfflineModal />
        <CompulsoryAuthScreen />
      </>
    );
  }

  if (currentRoute === 'superadmin') {
    if (role !== 'superadmin') {
      return null;
    }
    return (
      <>
        <DemoModeBanner />
        <BackendOfflineModal />
        <SuperAdminPage 
          onBackToMap={() => {
            if (window.opener) {
              window.close();
            } else {
              window.history.pushState({}, '', '/');
              setCurrentRoute('map');
            }
          }} 
        />
        <CategoriesModal />
      </>
    );
  }

  if (currentRoute === 'admin') {
    if (role !== 'admin' && role !== 'superadmin') {
      return null;
    }
    return (
      <>
        <DemoModeBanner />
        <BackendOfflineModal />
        <AdminDashboardPage 
          onBackToMap={() => {
            if (window.opener) {
              window.close();
            } else {
              window.history.pushState({}, '', '/');
              setCurrentRoute('map');
            }
          }} 
        />
        <CategoriesModal />
      </>
    );
  }

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none font-sans print:overflow-visible print:h-auto print:w-auto print:bg-white ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#07090e] text-slate-100'}`}>
      {/* All interactive application UI elements are strictly hidden during printing */}
      <div className="print:hidden">
        <DemoModeBanner />
        <BackendOfflineModal />
        {/* 1. Full-Bleed Map & 3D Geospatial Canvas (Edge-to-Edge) */}
        <main className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          {/* 2D View Mode */}
          {viewMode === '2d' && (
            <div className="w-full h-full">
              <LeafletMap />
            </div>
          )}

          {/* 3D View Mode */}
          {viewMode === '3d' && (
            <div className="w-full h-full">
              <OpenFreeMap3D />
            </div>
          )}

          {/* Synchronized Split View Mode */}
          {viewMode === 'split' && (
            <div className="w-full h-full flex">
              {/* Left 2D GIS Cadastre Pane */}
              <div className="w-1/2 h-full relative border-r border-slate-300 dark:border-slate-800">
                <LeafletMap />
              </div>

              {/* Right 3D Digital Twin Pane (OpenFreeMap 3D Vector Map) */}
              <div className="w-1/2 h-full relative">
                <OpenFreeMap3D />
              </div>
            </div>
          )}
        </main>

        {/* 2. Top Header Navigation Bar (Matches screenshot layout) */}
        <TopNavBar />

        {/* 3. Left Fixed Sidebar (Matches screenshot layout) */}
        <LeftSidebar />

        {/* 4. Floating Google Maps Place Details Card (Left Side Drawer) */}
        <GooglePlaceSheet />

        {/* 5. Floating Navigation, Zoom & Camera Controls (Bottom-Right) */}
        <GoogleMapControls />

        {/* 7. Floating Measurement Tool Panel & Google Earth Measure Card */}
        {isAdminOrSuperAdmin && <MeasureToolPanel />}
        <GoogleEarthMeasureCard />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-800 dark:text-slate-200">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3 shadow-lg shadow-blue-600/20" />
            <p className="text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-400">Loading 3D Cadastral Engine...</p>
          </div>
        )}

        {/* Auto-Sync Reconnection Banner */}
        {syncNotification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2900] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
            <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 border border-emerald-400/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
              <span>{syncNotification}</span>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-2xl shadow-xl shadow-red-600/25">
            {error}
          </div>
        )}

        {/* Dialog Modals */}
        <ValidationResultsPanel />
        <CategoriesModal />
        <DataImportModal />
        <AuthModal />
        <SuperAdminDashboardModal />
        <AddBuildingPipelineModal />
        <EditBuildingOwnerModal />
        <Building3DInspectorModal />
      </div>

      {/* Property Certificate Modal - Rendered outside print:hidden */}
      <PropertyReportModal />
    </div>
  );
};

export default App;

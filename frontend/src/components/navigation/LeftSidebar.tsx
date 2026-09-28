import React, { useState } from 'react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { useAuthStore } from '../../state/useAuthStore';

interface LeftSidebarProps {
  activeNav?: string;
  onSelectNav?: (key: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeNav = 'map', onSelectNav }) => {
  const { 
    buildings, 
    selectBuilding, 
    setDetailsOpen, 
    parcels, 
    selectParcel, 
    setReportModalOpen,
    runValidationCheck,
    isCategoriesModalOpen,
    setCategoriesModalOpen
  } = useCadastralStore();

  const { role, openSuperAdminModal } = useAuthStore();
  const [currentNav, setCurrentNav] = useState(activeNav);

  const navItems = [
    {
      key: 'map',
      label: 'Map',
      onClick: () => {
        setCategoriesModalOpen(false);
        setCurrentNav('map');
        if (onSelectNav) onSelectNav('map');
      }
    },
    {
      key: 'buildings',
      label: 'Buildings',
      onClick: () => {
        setCategoriesModalOpen(false);
        setCurrentNav('buildings');
        if (buildings.length > 0) {
          selectBuilding(buildings[0].building_id || 'B001');
          setDetailsOpen(true);
        }
        if (onSelectNav) onSelectNav('buildings');
      }
    },
    {
      key: 'parcels',
      label: 'Parcels',
      onClick: () => {
        setCategoriesModalOpen(false);
        setCurrentNav('parcels');
        if (parcels.length > 0) {
          selectParcel(parcels[0].parcel_id);
          setDetailsOpen(true);
        }
        if (onSelectNav) onSelectNav('parcels');
      }
    },
    {
      key: 'categories',
      label: 'Categories',
      onClick: () => {
        const next = !isCategoriesModalOpen;
        setCategoriesModalOpen(next);
        if (next) setCurrentNav('categories');
        else setCurrentNav('map');
        if (onSelectNav) onSelectNav('categories');
      }
    },
    {
      key: 'search',
      label: 'ULPIN Search',
      onClick: () => {
        setCategoriesModalOpen(false);
        setCurrentNav('search');
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) input.focus();
        if (onSelectNav) onSelectNav('search');
      }
    },
    {
      key: 'analytics',
      label: 'Analytics',
      onClick: () => {
        setCategoriesModalOpen(false);
        setCurrentNav('analytics');
        openSuperAdminModal();
        if (onSelectNav) onSelectNav('analytics');
      }
    },
    {
      key: 'reports',
      label: 'Reports',
      onClick: () => {
        setCategoriesModalOpen(false);
        setCurrentNav('reports');
        setReportModalOpen(true);
        if (onSelectNav) onSelectNav('reports');
      }
    },
    {
      key: 'admin',
      label: 'Admin',
      onClick: () => {
        setCategoriesModalOpen(false);
        setCurrentNav('admin');
        if (role === 'superadmin' || role === 'admin') {
          openSuperAdminModal();
        } else {
          runValidationCheck();
        }
        if (onSelectNav) onSelectNav('admin');
      }
    }
  ];

  return (
    <aside className="print:hidden absolute top-14 bottom-0 left-0 w-[72px] sm:w-[76px] bg-white border-r border-slate-200/90 shadow-sm z-20 flex flex-col justify-between py-3 select-none pointer-events-auto">
      {/* Top Navigation Items */}
      <nav className="flex flex-col items-center gap-1.5 px-1.5">
        {navItems.map((item) => {
          const isActive = isCategoriesModalOpen ? item.key === 'categories' : currentNav === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={`w-full py-2.5 px-1 rounded-xl flex items-center justify-center text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`}
              title={item.label}
            >
              <span className="text-[11px] leading-tight text-center tracking-tight break-words max-w-[66px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Ministry Tagline */}
      <div className="flex flex-col items-center justify-center px-1 text-center border-t border-slate-100 pt-3">
        <div className="text-[8px] leading-tight text-slate-600 font-semibold tracking-tight">
          <div>Ministry of</div>
          <div>Land Resources</div>
          <div className="text-[7px] text-slate-400 font-medium mt-0.5">Government of India</div>
        </div>
      </div>
    </aside>
  );
};

import React, { useEffect } from 'react';
import { useAuthStore } from '../../state/useAuthStore';
import { useCadastralStore } from '../../state/useCadastralStore';
import { 
  X, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Clock, 
  Layers, 
  MapPin, 
  FileBadge, 
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const SuperAdminDashboardModal: React.FC = () => {
  const { 
    isSuperAdminModalOpen, 
    closeSuperAdminModal, 
    adminsList, 
    superAdminMetrics, 
    isLoadingAdmins, 
    fetchAdmins, 
    fetchSuperAdminMetrics, 
    approveAdmin, 
    revokeAdmin, 
    deleteAdmin 
  } = useAuthStore();

  const { buildings, parcels, verticalProperties, properties } = useCadastralStore();

  useEffect(() => {
    if (isSuperAdminModalOpen) {
      fetchAdmins();
      fetchSuperAdminMetrics(buildings.length);
    }
  }, [isSuperAdminModalOpen, buildings.length]);

  if (!isSuperAdminModalOpen) return null;

  // Compute live metrics if API didn't provide them
  const totalBuildings = superAdminMetrics?.total_buildings ?? buildings.length;
  const registeredBuildings = superAdminMetrics?.registered_buildings ?? buildings.length;
  const totalParcels = superAdminMetrics?.total_parcels ?? parcels.length;
  const totalVertical = superAdminMetrics?.total_vertical_properties ?? verticalProperties.length;
  const totalUlpins = superAdminMetrics?.total_ulpins ?? properties.length;
  const pendingCount = adminsList.filter(a => a.status === 'pending').length;
  const activeCount = adminsList.filter(a => a.status === 'active' || a.status === 'approved').length;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Super Admin Command Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  SYSTEM AUTHORITY
                </span>
              </div>
              <p className="text-xs text-slate-400">Cadastral Registry Oversight & Admin Authorization</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeSuperAdminModal();
                window.open('/superadmin', '_blank');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 text-xs font-semibold transition-colors"
              title="Open full Super Admin Panel in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>
            <button
              onClick={() => {
                fetchAdmins();
                fetchSuperAdminMetrics(buildings.length);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAdmins ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeSuperAdminModal}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Cadastral Metrics Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>National Cadastral Asset Metrics</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Buildings */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">Total Buildings</span>
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-800">{totalBuildings}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  100% In 3D Digital Twin
                </div>
              </div>

              {/* Registered Buildings */}
              <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/40 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-700 mb-2">
                  <span className="text-xs font-medium">Registered Buildings</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-900">{registeredBuildings}</div>
                <div className="text-[11px] text-blue-700 font-semibold mt-1">
                  Verified with Cadastre
                </div>
              </div>

              {/* Base Parcels */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">Parcels Delineated</span>
                  <MapPin className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-800">{totalParcels}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {totalVertical} Vertical Units
                </div>
              </div>

              {/* 14-Digit ULPINs */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">Active 3D-ULPINs</span>
                  <FileBadge className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-800">{totalUlpins}</div>
                <div className="text-[11px] text-purple-700 font-semibold mt-1">
                  14-Digit Bhu-Aadhaar
                </div>
              </div>
            </div>
          </div>

          {/* Admin Authorization Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span>Cadastral Admin Approval Queue</span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                      {pendingCount} Pending Approval
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Review Admin signups with Name, ID & Gmail. Only approved admins can log in and add buildings.
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-600">
                Active Admins: <span className="font-bold text-emerald-600">{activeCount}</span>
              </div>
            </div>

            {adminsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No admin accounts currently registered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Officer Name & ID</th>
                      <th className="px-4 py-3">Gmail / Email</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Super Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminsList.map((admin) => {
                      const isPending = admin.status === 'pending';
                      const isActive = admin.status === 'active' || admin.status === 'approved';
                      const isRevoked = admin.status === 'revoked';

                      return (
                        <tr key={admin.user_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{admin.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{admin.user_id}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-700">{admin.email}</div>
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {admin.organization || 'Cadastral Planning Div'}
                          </td>

                          <td className="px-4 py-3">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Pending Approval
                              </span>
                            )}
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Approved & Active
                              </span>
                            )}
                            {isRevoked && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                Revoked
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {isPending ? (
                                <button
                                  onClick={() => approveAdmin(admin.user_id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
                                  title="Approve Admin"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              ) : isActive ? (
                                <button
                                  onClick={() => revokeAdmin(admin.user_id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold text-xs flex items-center gap-1 transition-all"
                                  title="Revoke Admin Access"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Revoke</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => approveAdmin(admin.user_id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1 transition-all"
                                  title="Re-activate Admin"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Re-Approve</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to permanently remove admin ${admin.name}?`)) {
                                    deleteAdmin(admin.user_id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Permanently Remove Admin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Logged in as Super Admin (Ministry Level)</span>
          </div>
          <button
            onClick={closeSuperAdminModal}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

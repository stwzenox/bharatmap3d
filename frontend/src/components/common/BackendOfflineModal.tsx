import React from 'react';
import { AlertTriangle, RefreshCw, Sparkles, Server, Database, X, CloudOff, Radio } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';
import { API_BASE_URL } from '../../api/client';

export const BackendOfflineModal: React.FC = () => {
  const {
    backendOffline,
    isDemoMode,
    offlineModalOpen,
    setOfflineModalOpen,
    retryConnection,
    enableDemoMode,
    isLoading,
    dbHost,
    dbPort,
    pendingSyncCount
  } = useCadastralStore();

  if (!backendOffline || isDemoMode || !offlineModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
        {/* Close / Dismiss */}
        <button
          onClick={() => setOfflineModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Dismiss Modal & Continue in Offline Mode"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 shadow-sm">
          <CloudOff className="w-7 h-7" />
        </div>

        {/* Header Titles */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Remote PostgreSQL Database is Offline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            The remote cloud PostgreSQL cluster is currently unreachable. You can continue reviewing cached boundaries. Any new buildings created offline will be queued and <strong>automatically synchronized</strong> as soon as the database comes back online.
          </p>
        </div>

        {/* Diagnostic Metadata Box */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-left font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-2 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              Remote Cloud Host:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 select-all">
              {dbHost || '46.247.108.191'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Port:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {dbPort || 30182} (PostgreSQL 17)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              Database Status:
            </span>
            <span className="font-bold text-rose-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Offline / Reconnecting...
            </span>
          </div>
          {pendingSyncCount > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-amber-500 font-semibold">
                Pending Offline Sync:
              </span>
              <span className="font-bold text-amber-500">
                {pendingSyncCount} record(s) queued
              </span>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => setOfflineModalOpen(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Continue in Offline Cache Mode</span>
          </button>

          <button
            onClick={() => retryConnection()}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Testing PostgreSQL Connection...' : 'Retry PostgreSQL Connection Now'}</span>
          </button>

          <button
            onClick={() => enableDemoMode()}
            className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[11px] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Switch to Demo Mode (View Sample Dataset)</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400">
          Auto-sync heartbeat is active. As soon as 46.247.108.191:30182 is online, data will automatically synchronize.
        </p>
      </div>
    </div>
  );
};

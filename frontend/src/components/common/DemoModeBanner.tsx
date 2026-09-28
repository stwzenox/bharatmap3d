import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useCadastralStore } from '../../state/useCadastralStore';

export const DemoModeBanner: React.FC = () => {
  const { isDemoMode, disableDemoMode, isLoading } = useCadastralStore();

  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="print:hidden fixed top-0 left-0 right-0 z-[2500] bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white text-xs px-4 py-1.5 shadow-md flex items-center justify-between pointer-events-auto">
      <div className="flex items-center gap-2 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
        <span>
          <strong className="font-bold">Demo Mode Active:</strong> Viewing bundled simulation dataset because live backend/database was offline.
        </span>
      </div>

      <button
        onClick={() => disableDemoMode()}
        disabled={isLoading}
        className="px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Exit Demo Mode & Reconnect</span>
      </button>
    </div>
  );
};

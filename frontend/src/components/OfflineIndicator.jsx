import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

const OfflineIndicator = () => {
  const { isOnline, syncing } = useOfflineSync();

  if (isOnline && !syncing) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2 text-center text-white text-[12px] font-bold transition-all ${
      !isOnline ? 'bg-red-500' : 'bg-blue-500'
    }`} style={{ paddingTop: 'calc(8px + env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff size={14} />
            <span>Mode Offline - Laporan akan disimpan lokal</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Sinkronisasi data ke server...</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;

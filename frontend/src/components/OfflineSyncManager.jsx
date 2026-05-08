import React, { useEffect, useState } from 'react';
import { authFetch } from '../services/api';
import { getAllPendingSync, removeSyncedData } from '../services/offlineDB';
import { CheckCircle2 } from 'lucide-react';

const OfflineSyncManager = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const handleOnline = () => {
      syncOfflineData();
    };

    window.addEventListener('online', handleOnline);
    // Also try to sync on mount if online
    if (navigator.onLine) {
      syncOfflineData();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const syncOfflineData = async () => {
    try {
      const pendingData = await getAllPendingSync();
      if (!pendingData || pendingData.length === 0) return;

      setSyncing(true);
      setSyncMessage('Menyinkronkan data offline...');
      let successCount = 0;
      let failedCount = 0;

      // Sort by timestamp to ensure chronological order (START -> SUBMIT -> FINISH)
      pendingData.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of pendingData) {
        try {
          let endpoint = '';
          let method = 'PATCH';
          
          if (item.type === 'START_TASK') endpoint = `/api/tasks/${item.data.id}/start`;
          else if (item.type === 'FINISH_TASK') endpoint = `/api/tasks/${item.data.id}/finish`;
          else if (item.type === 'SUBMIT_TASK') endpoint = `/api/tasks/${item.data.id}/submit`;
          else {
            await removeSyncedData(item.id); // Remove invalid types
            continue;
          }

          const response = await authFetch(endpoint, {
            method,
            body: JSON.stringify(item.data.payload)
          });

          if (response.ok || response.status === 400 || response.status === 404) {
            // Remove if successful OR if it's a client error (e.g. task already submitted, not found)
            await removeSyncedData(item.id);
            if (response.ok) successCount++;
            else failedCount++;
          } else {
            failedCount++;
          }
        } catch (e) {
          console.error(`[Sync] Failed to sync item ${item.id}:`, e);
          failedCount++;
          // Don't break, try the rest
        }
      }

      if (successCount > 0 && failedCount === 0) {
        setSyncMessage(`Berhasil menyinkronkan ${successCount} data tertunda!`);
        setTimeout(() => setSyncing(false), 3000);
      } else if (successCount > 0 && failedCount > 0) {
        setSyncMessage(`Berhasil sinkron ${successCount} data, gagal ${failedCount} data.`);
        setTimeout(() => setSyncing(false), 5000);
      } else if (failedCount > 0) {
        setSyncMessage(`Gagal menyinkronkan ${failedCount} data. Akan dicoba lagi nanti.`);
        setTimeout(() => setSyncing(false), 5000);
      } else {
        setSyncing(false);
      }
    } catch (err) {
      console.error('[SyncManager] Error syncing:', err);
      setSyncing(false);
    }
  };

  if (!syncing) return null;

  return (
    <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[10000] px-4 py-2 pointer-events-none flex justify-center animate-slide-down">
      <div className="bg-[#181C32] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
        {syncMessage.includes('Berhasil') ? (
          <CheckCircle2 size={16} className="text-[#50CD89]" />
        ) : (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {syncMessage}
      </div>
      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(16px); opacity: 1; }
        }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default OfflineSyncManager;

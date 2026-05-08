import { useEffect, useState } from 'react';
import { getAllPendingSync, removeSyncedData } from '../services/offlineDB';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check if already online
    if (navigator.onLine) {
      performSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const performSync = async () => {
    if (syncing) return;
    const pending = await getAllPendingSync();
    if (pending.length === 0) return;

    setSyncing(true);
    console.log(`[OfflineSync] Found ${pending.length} items to sync.`);

    for (const item of pending) {
      try {
        let response;
        if (item.type === 'SUBMIT_TASK') {
          response = await fetch(`/api/tasks/${item.data.id}/submit`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data.payload)
          });
        } else if (item.type === 'START_TASK') {
          response = await fetch(`/api/tasks/${item.data.id}/start`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data.payload)
          });
        } else if (item.type === 'FINISH_TASK') {
          response = await fetch(`/api/tasks/${item.data.id}/finish`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data.payload)
          });
        }

        if (response && response.ok) {
          await removeSyncedData(item.id);
          console.log(`[OfflineSync] Successfully synced item ${item.id}`);
        }
      } catch (err) {
        console.error(`[OfflineSync] Sync failed for item ${item.id}:`, err);
        break; // Stop syncing if error (e.g. server down)
      }
    }
    setSyncing(false);
  };

  return { isOnline, syncing };
};

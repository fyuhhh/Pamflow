/**
 * Simple IndexedDB wrapper for Offline Storage
 */
const DB_NAME = 'PamFlowOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingSync';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const saveOfflineData = async (type, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Simple conflict resolution: Check if an entry for the same task and type exists
    const requestAll = store.getAll();
    requestAll.onsuccess = () => {
      const existing = requestAll.result.find(item => item.type === type && item.data.id === data.id);
      
      const entry = {
        type,
        data,
        timestamp: Date.now()
      };

      if (existing) {
        entry.id = existing.id; // overwrite existing ID
        store.put(entry);
      } else {
        store.add(entry);
      }
    };
    
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllPendingSync = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const removeSyncedData = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

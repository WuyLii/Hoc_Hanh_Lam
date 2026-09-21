// Native IndexedDB storage wrapper for large-scale datasets and offline sync queue
// Safely bypasses the 5MB browser localStorage quota limit

const DB_NAME = 'PolyglotHubDB';
const DB_VERSION = 2;
const STORE_NAME = 'app_state';
const SYNC_QUEUE_STORE = 'sync_queue';

export interface SyncQueueItem {
  id: string;
  type: 'upsert' | 'delete' | 'batch_upsert';
  table: string;
  data: any;
  onConflict?: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

export async function idbGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result !== undefined && request.result !== null) {
          resolve(request.result as T);
        } else {
          resolve(fallback);
        }
      };

      request.onerror = () => {
        resolve(fallback);
      };
    });
  } catch (e) {
    return fallback;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  } catch (e) {
    return false;
  }
}

export async function idbDelete(key: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function idbClear(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

// -------------------------------------------------------------
// OFFLINE SYNC QUEUE OPERATIONS
// -------------------------------------------------------------

export async function enqueueSyncTask(
  task: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>
): Promise<string> {
  const item: SyncQueueItem = {
    ...task,
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.put(item);

      req.onsuccess = () => resolve(item.id);
      req.onerror = () => reject(req.error || new Error('Không thể thêm vào hàng đợi sync'));
    });
  } catch (e) {
    console.warn('Lỗi enqueueSyncTask:', e);
    return item.id;
  }
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve((req.result || []) as SyncQueueItem[]);
      };
      req.onerror = () => {
        resolve([]);
      };
    });
  } catch (e) {
    return [];
  }
}

export async function dequeueSyncTask(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function updateSyncTask(item: SyncQueueItem): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.put(item);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function clearSyncQueue(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function getSyncQueueCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.count();

      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch (e) {
    return 0;
  }
}


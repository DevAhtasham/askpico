const DB_NAME = 'fahmchat-images';
const STORE_NAME = 'images';

const memoryFallback = new Map<string, Blob>();

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runRequest = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

export const saveImage = async (id: string, blob: Blob): Promise<void> => {
  try {
    await runRequest('readwrite', (store) => store.put(blob, id));
  } catch {
    // IndexedDB unavailable: keep the image in memory for this session only.
    memoryFallback.set(id, blob);
  }
};

export const getImage = async (id: string): Promise<Blob | undefined> => {
  const cached = memoryFallback.get(id);
  if (cached) return cached;
  try {
    const stored = await runRequest<Blob | undefined>('readonly', (store) => store.get(id));
    return stored ?? undefined;
  } catch {
    return undefined;
  }
};

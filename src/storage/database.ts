import { RetirementCalculatorData, PortfolioSnapshot } from '../types';

const DB_NAME = 'RetirementCalculatorDB';
const DB_VERSION = 1;
const STORE_NAME = 'calculatorData';
const SNAPSHOTS_STORE = 'portfolioSnapshots';

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
          const snapshotsStore = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id', autoIncrement: true });
          snapshotsStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  async saveData(data: RetirementCalculatorData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: 'mainData', data });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getData(): Promise<RetirementCalculatorData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('mainData');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }

  async addSnapshot(snapshot: PortfolioSnapshot): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SNAPSHOTS_STORE], 'readwrite');
      const store = transaction.objectStore(SNAPSHOTS_STORE);
      const request = store.add({
        ...snapshot,
        date: snapshot.date.getTime(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getSnapshots(): Promise<PortfolioSnapshot[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SNAPSHOTS_STORE], 'readonly');
      const store = transaction.objectStore(SNAPSHOTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map(item => ({
          ...item,
          date: new Date(item.date),
        }));
        resolve(results as PortfolioSnapshot[]);
      };
    });
  }

  async deleteSnapshot(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SNAPSHOTS_STORE], 'readwrite');
      const store = transaction.objectStore(SNAPSHOTS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME, SNAPSHOTS_STORE], 'readwrite');
      
      transaction.objectStore(STORE_NAME).clear();
      transaction.objectStore(SNAPSHOTS_STORE).clear();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }
}

// LocalStorage fallback for critical data
export const localStorageService = {
  saveKey(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  },

  getKey<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
      return null;
    }
  },

  removeKey(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove from localStorage:', e);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  },
};

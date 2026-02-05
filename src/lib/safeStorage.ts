/**
 * Safe localStorage wrapper that handles Safari private browsing mode
 * and other scenarios where localStorage might not be available.
 */

let storageAvailable: boolean | null = null;

function checkStorageAvailable(): boolean {
  if (storageAvailable !== null) {
    return storageAvailable;
  }
  
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
    return true;
  } catch (e) {
    storageAvailable = false;
    return false;
  }
}

// In-memory fallback storage for when localStorage is unavailable
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    if (checkStorageAvailable()) {
      try {
        return localStorage.getItem(key);
      } catch {
        return memoryStorage[key] ?? null;
      }
    }
    return memoryStorage[key] ?? null;
  },

  setItem(key: string, value: string): void {
    if (checkStorageAvailable()) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // Fall through to memory storage
      }
    }
    memoryStorage[key] = value;
  },

  removeItem(key: string): void {
    if (checkStorageAvailable()) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    }
    delete memoryStorage[key];
  },

  isAvailable(): boolean {
    return checkStorageAvailable();
  }
};

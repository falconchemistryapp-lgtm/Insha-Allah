const CACHE_PREFIX = 'physIQCache_';

export function getFromCache<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from cache', error);
    return null;
  }
}

export function saveToCache<T>(key: string, data: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to cache', error);
  }
}

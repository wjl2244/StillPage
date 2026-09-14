type ChromeStorageLocal = {
  get: (keys: string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

function extensionStorage(): ChromeStorageLocal | undefined {
  return (globalThis as typeof globalThis & { chrome?: { storage?: { local?: ChromeStorageLocal } } }).chrome?.storage?.local;
}

function legacyValue<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : undefined;
  } catch { return undefined; }
}

export async function readStored<T>(key: string, fallback: T): Promise<T> {
  const storage = extensionStorage();
  if (storage) {
    const value = (await storage.get([key]))[key] as T | undefined;
    if (value !== undefined) return value;
    const legacy = legacyValue<T>(key);
    if (legacy !== undefined) { await storage.set({ [key]: legacy }); return legacy; }
    return fallback;
  }
  return legacyValue<T>(key) ?? fallback;
}

export async function writeStored(key: string, value: unknown) {
  const storage = extensionStorage();
  if (storage) { await storage.set({ [key]: value }); return; }
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable in preview. */ }
}

export function loadLocalMap<T>(key: string): Record<string, T> {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

export function saveLocalMap<T>(key: string, map: Record<string, T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore storage quota/availability errors
  }
}

export function appendLocalHistory<T>(
  key: string,
  itemId: string,
  entry: Omit<T, 'id'>,
  prevMap: Record<string, T[]>,
  maxEntries = 50
): Record<string, T[]> {
  const current = prevMap[itemId] || [];
  const nextEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  } as T;
  const nextMap = {
    ...prevMap,
    [itemId]: [nextEntry, ...current].slice(0, maxEntries),
  };
  saveLocalMap(key, nextMap);
  return nextMap;
}

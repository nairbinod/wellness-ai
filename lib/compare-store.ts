"use client";

// Compare selections are ephemeral, per-browser state — no reason to touch
// the DB for this. localStorage + a module-level subscriber list gives every
// mounted CompareToggle/CompareBar instance the same live view without a
// Context provider wrapping the whole tree (same useSyncExternalStore
// pattern already used for cookie consent).
const STORAGE_KEY = "pn-compare";
export const MAX_COMPARE = 4;

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: string[] | null = null;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  cache = ids;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): string[] {
  if (cache == null) cache = read();
  return cache;
}

export function getServerSnapshot(): string[] {
  return [];
}

export function toggleCompare(id: string) {
  const current = getSnapshot();
  if (current.includes(id)) {
    write(current.filter((x) => x !== id));
  } else if (current.length < MAX_COMPARE) {
    write([...current, id]);
  }
}

export function clearCompare() {
  write([]);
}

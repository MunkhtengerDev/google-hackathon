export const STORAGE_KEY = "trip_planner_form_v2";

export function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

export function loadFromStorage() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return safeParse(raw);
}

export function saveToStorage(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

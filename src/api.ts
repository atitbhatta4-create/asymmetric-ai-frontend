// frontend/src/api.ts

const RAW_BACKEND =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// remove trailing slash if present
export const BACKEND = RAW_BACKEND.replace(/\/+$/, "");

export async function api<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  // ✅ FIX: your code had "/${path}" which is broken
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${BACKEND}${cleanPath}`, {
    ...opts,
    credentials: "include",
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
  });

  const text = await res.text();

  if (!res.ok) {
    // ✅ FIX: your throw line was broken syntax
    try {
      const j = JSON.parse(text);
      throw new Error(j?.detail || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

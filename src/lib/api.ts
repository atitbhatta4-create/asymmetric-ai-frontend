// frontend/src/lib/api.ts

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

if (!API_BASE) {
  console.error("❌ VITE_API_URL is missing in production");
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed ${res.status}`);
  }

  // If backend returns non-json sometimes, avoid crash
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return (await res.text()) as any;
  }

  return res.json();
}

// ✅ Alias (some components use apiFetch)
export const apiFetch = apiRequest;

// API helpers
export const getSession = () => apiRequest("/session");

export const login = (email: string, password: string) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const logout = () =>
  apiRequest("/auth/logout", {
    method: "POST",
  });

export const getTrades = () => apiRequest("/trades");

// src/lib/api.ts

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : "https://asymmetric-ai-backend.onrender.com");

if (!API_BASE) {
  console.error("❌ VITE_API_URL is missing in production");
}

// ✅ Main function (keep this name because your code already uses it)
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

  return res.json();
}

// ✅ Alias (some files may use apiFetch)
export const apiFetch = apiRequest;

// ---- Helpers ----
export const getSession = () => apiRequest("/session");

export const login = (email: string, password: string) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const signup = (email: string, password: string) =>
  apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getTrades = () => apiRequest("/trades");

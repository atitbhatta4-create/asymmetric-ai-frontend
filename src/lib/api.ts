// frontend/src/lib/api.ts
// SINGLE SOURCE OF TRUTH for backend URL

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

export const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${API_BASE_URL}${cleanPath}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

// src/lib/api.ts
// Centralized API helper for Vercel + local dev

const RAW =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

export const API_BASE = RAW.replace(/\/+$/, "");

// In production, NEVER allow localhost fallback
if (import.meta.env.PROD && (!API_BASE || API_BASE.includes("127.0.0.1") || API_BASE.includes("localhost"))) {
  throw new Error(
    "Missing VITE_API_URL in production. Set it in Vercel Environment Variables."
  );
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${cleanPath}`, {
    credentials: "include",
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

// frontend/src/api.ts

// Pick ONE env var in Vercel, but this supports multiple names safely.
const RAW_BACKEND =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:8000";

// Remove trailing slashes
export const BACKEND = String(RAW_BACKEND).replace(/\/+$/, "");

/**
 * Build a safe path like "/session" or "/auth/login"
 */
function normalizePath(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * API helper
 * - Sends cookies (session) with credentials: "include"
 * - Works for JSON and non-JSON responses
 * - Throws useful error messages
 */
export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const cleanPath = normalizePath(path);

  // If body exists and caller didn't specify Content-Type, set JSON by default
  const headers: Record<string, string> = {
    ...(opts.headers as any),
  };

  const hasBody = opts.body !== undefined && opts.body !== null;
  const hasContentType =
    Object.keys(headers).some((k) => k.toLowerCase() === "content-type");

  if (hasBody && !hasContentType) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BACKEND}${cleanPath}`, {
    ...opts,
    mode: "cors",
    credentials: "include",
    headers,
  });

  // Handle 204 No Content quickly
  if (res.status === 204) return {} as T;

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const detail =
      (payload && typeof payload === "object" && (payload as any).detail) ||
      (typeof payload === "string" && payload) ||
      `HTTP ${res.status}`;

    throw new Error(String(detail));
  }

  return payload as T;
}

/**
 * Convenience helpers
 */
export const apiGet = <T = any>(path: string) => api<T>(path);

export const apiPost = <T = any>(path: string, body?: any, opts: RequestInit = {}) =>
  api<T>(path, {
    method: "POST",
    ...opts,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const apiPut = <T = any>(path: string, body?: any, opts: RequestInit = {}) =>
  api<T>(path, {
    method: "PUT",
    ...opts,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const apiDelete = <T = any>(path: string, opts: RequestInit = {}) =>
  api<T>(path, {
    method: "DELETE",
    ...opts,
  });

// src/lib/api.ts

// IMPORTANT:
// In production you MUST set VITE_API_URL to your backend, e.g.
// https://asymmetric-ai-backend.onrender.com
const RAW_BASE = import.meta.env.VITE_API_URL;
const API_BASE = (RAW_BASE || "").replace(/\/$/, "");

// If PROD and API_BASE is empty, requests will hit Vercel domain and 404.
// We don't throw here to avoid blank screen, but it will fail fast with a clear error.
if (import.meta.env.PROD && !API_BASE) {
  console.warn(
    "[api] VITE_API_URL is missing in production. Set it in Vercel Environment Variables."
  );
}

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: any;
};

function joinUrl(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p; // fallback (dev proxy / same-origin), but NOT recommended for prod
  return `${base}${p}`;
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const url = joinUrl(API_BASE, path);

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const text = await res.text();
  const json = text ? tryParseJson(text) : null;

  if (!res.ok) {
    const msg =
      (json && (json.detail || json.message || json.msg || json.error)) ||
      text ||
      `Request failed (${res.status})`;

    // Make prod failure obvious if backend base is missing
    if (import.meta.env.PROD && !API_BASE) {
      throw new Error(
        `VITE_API_URL is missing in production. Set it to your backend URL. Original error: ${msg}`
      );
    }

    throw new Error(msg);
  }

  return (json ?? (text as any)) as T;
}

// API helpers
// Use /api/* consistently (your backend supports it by stripping /api prefix)
export const getSession = () => apiRequest("/api/session");

export const login = (email: string, password: string) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const signup = (email: string, password: string) =>
  apiRequest("/api/auth/signup", {
    method: "POST",
    body: { email, password },
  });

export const logout = () => apiRequest("/api/auth/logout", { method: "POST" });

export const getTrades = () => apiRequest("/api/trades");

export const api = apiRequest;

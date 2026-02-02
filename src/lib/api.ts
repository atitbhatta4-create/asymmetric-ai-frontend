// src/lib/api.ts
/// <reference types="vite/client" />

/**
 * API base rules:
 * - If VITE_API_URL is set (recommended in Vercel), always use it.
 * - Otherwise:
 *   - PROD uses "/api" (for Vercel proxy setups)
 *   - DEV uses local backend
 */
const ENV_URL = (import.meta.env.VITE_API_URL || "").trim();

const API_BASE = ENV_URL
  ? ENV_URL.replace(/\/+$/, "") // remove trailing slash
  : import.meta.env.PROD
    ? "/api"
    : "http://127.0.0.1:8000";

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: any;
};

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function pickErrorMessage(json: any, fallback: string) {
  const raw =
    json?.detail ??
    json?.message ??
    json?.msg ??
    json?.error;

  if (!raw) return fallback;

  if (typeof raw === "string") return raw;

  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  // If body is already a string, do not stringify again
  const isBodyDefined = body !== undefined && body !== null;
  const finalBody =
    !isBodyDefined
      ? undefined
      : typeof body === "string"
        ? body
        : JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(isBodyDefined && typeof body !== "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(headers || {}),
    },
    body: finalBody,
    ...rest,
  });

  const text = await res.text();
  const json = text ? tryParseJson(text) : null;

  if (!res.ok) {
    const fallback = text || `Request failed (${res.status})`;
    const msg = json ? pickErrorMessage(json, fallback) : fallback;
    throw new Error(msg);
  }

  // return JSON if possible, else plain text
  return (json ?? (text as any)) as T;
}

/* =========================
   Helpers
========================= */

export const getSession = () => apiRequest("/session");

export const login = (email: string, password: string) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const signup = (email: string, password: string) =>
  apiRequest("/auth/signup", {
    method: "POST",
    body: { email, password },
  });

export const logout = () => apiRequest("/auth/logout", { method: "POST" });

export const getTrades = () => apiRequest("/trades");

/**
 * ✅ MAGIC:
 * api is both callable AND has helpers:
 *   await api("/path")
 *   await api.login(...)
 */
type ApiCallable = (<T = any>(
  path: string,
  options?: ApiRequestInit
) => Promise<T>) & {
  apiRequest: typeof apiRequest;
  request: typeof apiRequest;
  getSession: typeof getSession;
  login: typeof login;
  signup: typeof signup;
  logout: typeof logout;
  getTrades: typeof getTrades;
};

const apiFn = (async function <T = any>(
  path: string,
  options?: ApiRequestInit
) {
  return apiRequest<T>(path, options);
}) as ApiCallable;

apiFn.apiRequest = apiRequest;
apiFn.request = apiRequest;
apiFn.getSession = getSession;
apiFn.login = login;
apiFn.signup = signup;
apiFn.logout = logout;
apiFn.getTrades = getTrades;

export const api = apiFn;

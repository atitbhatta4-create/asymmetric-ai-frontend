/// <reference types="vite/client" />

const API_BASE =
  import.meta.env.PROD ? "/api" : import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
  if (!json) return fallback;

  // common FastAPI shape: { detail: "..." } or { detail: { ... } }
  const detail = json.detail ?? json.message ?? json.msg ?? json.error;

  if (typeof detail === "string" && detail.trim()) return detail;

  // sometimes detail is an object/list
  if (detail !== undefined) {
    try {
      return typeof detail === "string" ? detail : JSON.stringify(detail);
    } catch {
      // ignore
    }
  }

  // last fallback: stringify whole json
  try {
    return JSON.stringify(json);
  } catch {
    return fallback;
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
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
    const fallback = text || `Request failed (${res.status})`;
    const msg = pickErrorMessage(json, fallback);
    throw new Error(msg);
  }

  return (json ?? (text as any)) as T;
}

// helpers (named exports)
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
 * ✅ callable api function + methods
 */
type ApiCallable = (<T = any>(path: string, options?: ApiRequestInit) => Promise<T>) & {
  apiRequest: typeof apiRequest;
  request: typeof apiRequest;
  getSession: typeof getSession;
  login: typeof login;
  signup: typeof signup;
  logout: typeof logout;
  getTrades: typeof getTrades;
};

const apiFn = (async function <T = any>(path: string, options?: ApiRequestInit) {
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

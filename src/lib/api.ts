/// <reference types="vite/client" />

const API_BASE =
  import.meta.env.PROD
    ? "/api"
    : import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

function extractErrorMessage(json: any, fallbackText: string, status: number) {
  // FastAPI often returns: { detail: [...] } for 422
  const detail = json?.detail ?? json?.message ?? json?.msg ?? json?.error;

  if (Array.isArray(detail)) {
    // show full validation errors instead of "[object Object]"
    return JSON.stringify(detail, null, 2);
  }

  if (typeof detail === "string" && detail.trim()) return detail;
  if (typeof detail === "number") return String(detail);

  if (fallbackText && fallbackText.trim()) return fallbackText;

  return `Request failed (${status})`;
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
    const msg = extractErrorMessage(json, text, res.status);
    throw new Error(msg);
  }

  return (json ?? (text as any)) as T;
}

// helpers
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
 * ✅ MAGIC FIX:
 * api is BOTH:
 *  - callable: api("/path")
 *  - and has helpers: api.login(...), api.getSession(), etc.
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

/// <reference types="vite/client" />

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://127.0.0.1:8000");

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
    // FastAPI validation errors return detail as an array of {loc, msg, type}
    let detail = json?.detail ?? json?.message ?? json?.msg ?? json?.error;
    if (Array.isArray(detail)) {
      detail = detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join("; ");
    }
    const msg = (detail ? String(detail) : null) || text || `Request failed (${res.status})`;
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

// Forgot password
export const forgotPassword = (email: string) =>
  apiRequest("/auth/forgot-password", { method: "POST", body: { email } });

export const resetPassword = (email: string, code: string, new_password: string) =>
  apiRequest("/auth/reset-password", { method: "POST", body: { email, code, new_password } });

// 2FA
export const get2faStatus = () => apiRequest("/auth/2fa/status");
export const setup2fa     = () => apiRequest("/auth/2fa/setup",   { method: "POST" });
export const confirm2fa   = (code: string) => apiRequest("/auth/2fa/confirm",  { method: "POST", body: { code } });
export const verify2fa    = (code: string) => apiRequest("/auth/2fa/verify",   { method: "POST", body: { code } });
export const disable2fa   = (code: string) => apiRequest("/auth/2fa/disable",  { method: "POST", body: { code } });

/**
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

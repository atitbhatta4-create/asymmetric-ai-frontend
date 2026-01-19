// src/lib/api.ts

const API_BASE = import.meta.env.PROD
  ? "/api"
  : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000");

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: any;
};

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  // try to parse json; if not, return text in error
  const text = await res.text();
  const maybeJson = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;

  if (!res.ok) {
    const msg =
      (maybeJson && (maybeJson.detail || maybeJson.msg)) ||
      text ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return (maybeJson ?? (text as any)) as T;
}

export const getSession = () => apiRequest("/session");

export const login = (email: string, password: string) =>
  apiRequest("/auth/login", { method: "POST", body: { email, password } });

export const signup = (email: string, password: string) =>
  apiRequest("/auth/signup", { method: "POST", body: { email, password } });

export const logout = () =>
  apiRequest("/auth/logout", { method: "POST" });

export const getTrades = () => apiRequest("/trades");

export const api = apiRequest;

// src/lib/api.ts

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
    const msg =
      (json &&
        (json.detail ||
          json.message ||
          json.msg ||
          json.error)) ||
      text ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return (json ?? (text as any)) as T;
}

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

export const logout = () =>
  apiRequest("/auth/logout", { method: "POST" });

export const getTrades = () => apiRequest("/trades");
export const api = apiRequest;
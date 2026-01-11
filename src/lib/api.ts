// src/lib/api.ts

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://asymmetric-ai-backend.onrender.com";

/**
 * Allow body to be object (we stringify it safely)
 */
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
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json();
}

/* =========================
   Helpers
========================= */

export const getSession = () =>
  apiRequest("/session");

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

export const getTrades = () =>
  apiRequest("/trades");

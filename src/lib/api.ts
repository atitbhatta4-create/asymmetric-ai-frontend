// src/lib/api.ts

const RAW_BASE =
  import.meta.env.VITE_API_URL || "https://asymmetric-ai-backend.onrender.com";

// remove trailing slashes
const API_BASE = RAW_BASE.replace(/\/+$/, "");

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
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  // Better error so you can see exact backend message
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}\n${text}`);
  }

  // Some endpoints may return empty body
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await res.text()) as any;

  return res.json();
}

// helpers
export const getSession = () => apiRequest("/session");

export const login = (email: string, password: string) =>
  apiRequest("/auth/login", { method: "POST", body: { email, password } });

export const signup = (email: string, password: string) =>
  apiRequest("/auth/signup", { method: "POST", body: { email, password } });

export const logout = () => apiRequest("/auth/logout", { method: "POST" });

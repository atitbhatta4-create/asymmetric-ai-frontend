// src/api.ts
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function getStoredToken(): string {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

function storeTokenIfPresent(data: any) {
  // support common names
  const t =
    data?.access_token ||
    data?.token ||
    data?.jwt ||
    data?.data?.access_token ||
    data?.data?.token;

  if (typeof t === "string" && t.length > 10) {
    localStorage.setItem("access_token", t);
  }
}

export async function api(path: string, init: RequestInit = {}) {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as any),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    // show backend error clearly
    const msg =
      typeof data === "string"
        ? data
        : data?.detail || data?.message || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  // ✅ if this is login response and contains token, store it
  if (path.includes("/auth/login")) {
    storeTokenIfPresent(data);
  }

  return data;
}

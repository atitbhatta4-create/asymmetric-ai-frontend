// src/api.ts (or src/api/API.ts)

const RAW =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_BACKEND_URL ||
  "";

function cleanBaseUrl(url: string) {
  return String(url).trim().replace(/\/+$/, "");
}

export const API_BASE_URL = cleanBaseUrl(RAW);

// ✅ Never allow localhost/127.0.0.1 in production builds
const isProd = (import.meta as any).env?.PROD === true;

if (isProd) {
  if (!API_BASE_URL) {
    throw new Error(
      "Missing VITE_API_URL in production. Set it in Vercel Environment Variables."
    );
  }
  if (
    API_BASE_URL.includes("localhost") ||
    API_BASE_URL.includes("127.0.0.1")
  ) {
    throw new Error(
      `Invalid API base URL in production: ${API_BASE_URL}. Use your deployed backend URL.`
    );
  }
}

// optional helper
function join(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type ApiOptions = RequestInit & {
  json?: any;
};

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is empty. Did you set VITE_API_URL?");
  }

  const headers: Record<string, string> = {
    ...(opts.headers as any),
  };

  let body = opts.body;

  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }

  const res = await fetch(join(API_BASE_URL, path), {
    method: opts.method || "GET",
    credentials: "include", // keep cookies working
    ...opts,
    headers,
    body,
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.detail || data?.message || `HTTP ${res.status}`
    );
  }

  return data as T;
}

// src/api.ts
// Central API helper for Asymmetric AI frontend (Vite)

type ApiOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
};

function normalizeBaseUrl(url: string): string {
  // remove trailing slashes
  return url.replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  // ensure it starts with /
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

const RAW_BACKEND =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

// IMPORTANT: do NOT fallback to localhost in production builds
if (!RAW_BACKEND) {
  // This will help you instantly know env is missing on Vercel
  throw new Error(
    "Missing backend URL. Set VITE_BACKEND_URL in Vercel Environment Variables."
  );
}

export const BACKEND = normalizeBaseUrl(String(RAW_BACKEND));

export async function api<T = any>(
  path: string,
  opts: ApiOptions = {}
): Promise<T> {
  const url = `${BACKEND}${normalizePath(path)}`;

  const {
    method = "GET",
    headers = {},
    body,
    credentials = "include", // for cookie-based sessions
  } = opts;

  const finalHeaders: Record<string, string> = {
    ...headers,
  };

  let finalBody: BodyInit | undefined = undefined;

  // Auto-handle JSON body
  if (body !== undefined) {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    if (isFormData) {
      finalBody = body; // browser sets proper boundary
    } else {
      finalHeaders["Content-Type"] =
        finalHeaders["Content-Type"] || "application/json";
      finalBody = JSON.stringify(body);
    }
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: finalBody,
    credentials,
  });

  // Try to parse JSON, fallback to text
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const errPayload = isJson ? await safeJson(res) : await res.text();
    throw new Error(
      typeof errPayload === "string"
        ? errPayload
        : errPayload?.detail || errPayload?.message || `HTTP ${res.status}`
    );
  }

  return isJson ? ((await res.json()) as T) : ((await res.text()) as any as T);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Optional convenience wrappers (use if you want)
export const apiGet = <T = any>(path: string) => api<T>(path);

export const apiPost = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: "POST", body });

export const apiPut = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: "PUT", body });

export const apiDelete = <T = any>(path: string) =>
  api<T>(path, { method: "DELETE" });

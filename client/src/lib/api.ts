/**
 * Central API Base URL Configuration for FictionFigure Client.
 *
 * Uses NEXT_PUBLIC_API_URL environment variable when set (e.g., https://fictionfigure.onrender.com).
 * Defaults to http://localhost:5000/api during local development.
 */
const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const cleanUrl = rawUrl.replace(/\/$/, "");

export const API_BASE = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;

/**
 * Inflight request promise cache to prevent duplicate GET requests.
 */
const inflightRequests = new Map<string, Promise<Response>>();

/**
 * Deduplicated fetch helper for GET requests.
 * Concurrently triggered requests to the same URL reuse a single HTTP Promise.
 */
export const dedupedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET") {
    return fetch(url, options);
  }

  const key = `${url}_${JSON.stringify(options.headers || {})}`;
  if (inflightRequests.has(key)) {
    const existing = await inflightRequests.get(key)!;
    return existing.clone();
  }

  const promise = fetch(url, options)
    .then((res) => {
      setTimeout(() => inflightRequests.delete(key), 500);
      return res;
    })
    .catch((err) => {
      inflightRequests.delete(key);
      throw err;
    });

  inflightRequests.set(key, promise);
  const result = await promise;
  return result.clone();
};

/**
 * Retrieves stored admin bearer token from localStorage in browser environment.
 */
export const getAdminAuthHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("fictionfigure_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Authenticated fetch helper for admin API requests.
 * Automatically attaches Authorization: Bearer <token> header.
 * Handles 401/403 responses by throwing an explicit error and clearing stale tokens.
 */
export const adminFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const authHeader = getAdminAuthHeader();
  const headers: Record<string, string> = {
    ...authHeader,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      console.warn(`Admin API returned ${response.status} Unauthorized for ${url}. Redirecting to login...`);
      localStorage.removeItem("fictionfigure_token");
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error("Admin authentication required or session expired. Please sign in again.");
  }

  return response;
};

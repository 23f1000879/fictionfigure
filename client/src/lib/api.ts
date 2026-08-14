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
 * Retrieves the stored admin bearer token from localStorage if in a browser environment.
 */
export const getAdminAuthHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("fictionfigure_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Authenticated fetch helper for admin API requests.
 */
export const adminFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const authHeader = getAdminAuthHeader();
  const headers: Record<string, string> = {
    ...authHeader,
    ...((options.headers as Record<string, string>) || {}),
  };
  return fetch(url, { ...options, headers });
};

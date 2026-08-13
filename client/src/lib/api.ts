/**
 * Central API Base URL Configuration for FictionFigure Client.
 *
 * Uses NEXT_PUBLIC_API_URL environment variable when set (e.g., https://fictionfigure.onrender.com).
 * Defaults to http://localhost:5000/api during local development.
 */
const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const cleanUrl = rawUrl.replace(/\/$/, "");

export const API_BASE = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;

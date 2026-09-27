import type { NextFunction, Request, Response } from "express";

/**
 * Fields that must never reach storefront visitors. `costPrice` is the supplier/purchase cost;
 * the customer-facing discount uses `compareAtPrice`, which stays public.
 */
const INTERNAL_FIELDS = new Set(["costPrice"]);

const replacer = (key: string, value: unknown) => (INTERNAL_FIELDS.has(key) ? undefined : value);

/**
 * Removes internal fields from every non-admin JSON response.
 * Works on a serialised copy, so cached payloads (e.g. the catalogue cache) are never mutated.
 */
export function stripInternalFields(req: Request, res: Response, next: NextFunction) {
  // Admin screens keep the full product record.
  if (req.path === "/api/admin" || req.path.startsWith("/api/admin/")) return next();
  const originalJson = res.json.bind(res);
  res.json = (body?: any) => originalJson(body === undefined ? body : JSON.parse(JSON.stringify(body, replacer)));
  next();
}

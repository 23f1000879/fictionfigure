/** Minimum length for customer passwords (matches the storefront registration form). */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * True when the stored hash is a real bcrypt hash. Accounts created by the legacy
 * checkout flow carry a non-bcrypt placeholder and therefore have no usable password.
 */
export function hasUsablePassword(passwordHash: string | null | undefined): boolean {
  return typeof passwordHash === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash);
}

/**
 * Minimal fixed-window attempt limiter (in-memory, per server instance).
 * Returns true when the attempt is allowed.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function allowAttempt(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}

export const clientIp = (req: any): string =>
  String(req.headers?.["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "unknown").split(",")[0].trim();

export const TOO_MANY_ATTEMPTS = "Too many attempts. Please wait a few minutes and try again.";

/**
 * Account state for a phone number, decided on the server.
 *  PASSWORD — an account exists and has a usable password: sign in with the password (no OTP)
 *  ACTIVATE — an account exists without a usable password: OTP, then create a password
 *  NEW      — no account: OTP, then create an account with a password
 * Nothing else about the account is returned to unauthenticated callers.
 */
export type PhoneAccountState = "PASSWORD" | "ACTIVATE" | "NEW";

export function phoneAccountState(user: { passwordHash: string } | null): PhoneAccountState {
  if (!user) return "NEW";
  return hasUsablePassword(user.passwordHash) ? "PASSWORD" : "ACTIVATE";
}

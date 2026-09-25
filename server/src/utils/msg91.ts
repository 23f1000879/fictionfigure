/**
 * Server-side MSG91 OTP widget verification.
 *
 * The widget sends and checks the OTP on MSG91's side; the browser only receives an
 * access token. We verify that token with MSG91 and, when MSG91 reports which mobile
 * number it was issued for, bind it to the phone number the client submitted.
 */

export interface Msg91Verification {
  ok: boolean;
  /** Last 10 digits of the mobile number MSG91 verified, when its response includes it. */
  verifiedPhone: string | null;
  error?: string;
  status?: number;
}

const last10 = (value: string) => value.replace(/\D/g, "").slice(-10);

/** Finds a 10–12 digit mobile number anywhere in the MSG91 response body. */
function extractVerifiedPhone(body: any): string | null {
  const candidates: string[] = [];
  const walk = (v: any) => {
    if (v == null) return;
    if (typeof v === "string" || typeof v === "number") candidates.push(String(v));
    else if (typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(body);
  for (const c of candidates) {
    if (c.length > 40 && c.split(".").length === 3) continue; // skip JWT-like strings
    const m = c.match(/(?:\+?91)?[6-9]\d{9}/);
    if (m) return last10(m[0]);
  }
  return null;
}

/** Reads a JWT's payload without trusting it (callers must have verified the token first). */
function decodeJwtClaims(token: string): any {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** Keys and value types with every digit masked — safe to log. */
function describeShape(v: any, depth = 0): any {
  if (v == null || depth > 3) return v === null ? null : typeof v;
  if (typeof v === "string") return v.length > 40 ? `string(${v.length})` : v.replace(/\d/g, "#");
  if (typeof v !== "object") return typeof v;
  const out: Record<string, any> = {};
  for (const [k, val] of Object.entries(v)) out[k] = describeShape(val, depth + 1);
  return out;
}

export async function verifyMsg91AccessToken(accessToken: string, reqId?: string): Promise<Msg91Verification> {
  const authKey = process.env.MSG91_AUTH_KEY || "";
  if (!authKey) {
    // Fail closed: never treat an OTP as verified without the provider.
    console.error("MSG91 verification unavailable: MSG91_AUTH_KEY is not configured.");
    return { ok: false, verifiedPhone: null, status: 503, error: "Phone verification is temporarily unavailable. Please try again later." };
  }
  if (!accessToken) {
    return { ok: false, verifiedPhone: null, status: 400, error: "OTP verification token is required." };
  }

  try {
    const payload: Record<string, string> = { authkey: authKey, "access-token": accessToken };
    if (reqId) payload.reqId = reqId;

    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: authKey },
      body: JSON.stringify(payload),
    });
    const data: any = await res.json().catch(() => ({}));

    const ok =
      res.ok &&
      (data.type === "success" ||
        data.status === "success" ||
        data.message === "success" ||
        (typeof data.message === "string" && data.message.toLowerCase().includes("verified")) ||
        (data.data && !data.error));

    if (!ok) {
      return { ok: false, verifiedPhone: null, status: 400, error: "OTP verification failed. Please request a new code." };
    }

    // 1) Number reported in MSG91's verification response.
    // 2) Otherwise the claims of the access token itself — safe only because MSG91 has just
    //    validated this exact token above, so a forged token never reaches this step.
    const verifiedPhone = extractVerifiedPhone(data) ?? extractVerifiedPhone(decodeJwtClaims(accessToken));
    if (!verifiedPhone) {
      // Masked shape only (no token, no digits) so an integration mismatch can be diagnosed.
      console.warn("MSG91 verification succeeded but no verified number was found", {
        response: describeShape(data),
        tokenClaims: describeShape(decodeJwtClaims(accessToken)),
      });
    }
    return { ok: true, verifiedPhone };
  } catch (e) {
    console.error("MSG91 verifyAccessToken network error");
    return { ok: false, verifiedPhone: null, status: 502, error: "Unable to verify the OTP right now. Please try again." };
  }
}

/**
 * Binding policy between the MSG91-verified number and the submitted number.
 * - strict: MSG91 must report the number and it must match (used when the result grants
 *   access to an EXISTING account: password reset / setup).
 * - lenient: a reported number must match; if MSG91 does not report one, allow (used only
 *   for creating NEW accounts, preserving the pre-existing registration behaviour).
 */
export function phoneBindingOk(v: Msg91Verification, submittedPhone: string, mode: "strict" | "lenient"): boolean {
  if (!v.ok) return false;
  if (!v.verifiedPhone) {
    if (mode === "strict") return false;
    console.warn("MSG91 response did not include the verified number; binding check skipped (new-account flow).");
    return true;
  }
  return v.verifiedPhone === last10(submittedPhone);
}

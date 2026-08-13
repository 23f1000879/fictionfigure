/**
 * Normalizes Indian mobile numbers to E.164 format (+91XXXXXXXXXX)
 * Examples of valid inputs:
 *  - "9876543210"        -> "+919876543210"
 *  - "+919876543210"     -> "+919876543210"
 *  - "+91 98765 43210"   -> "+919876543210"
 *  - "919876543210"      -> "+919876543210"
 *  - "09876543210"       -> "+919876543210"
 */
export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;

  // Extract all numeric digits
  const digits = input.replace(/\D/g, "");

  let tenDigits = "";

  if (digits.length === 10) {
    tenDigits = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    tenDigits = digits.substring(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    tenDigits = digits.substring(2);
  } else {
    return null;
  }

  // Validate Indian mobile numbers (start with 6, 7, 8, 9)
  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    return null;
  }

  return `+91${tenDigits}`;
}

export function formatDisplayPhone(normalizedPhone: string): string {
  if (!normalizedPhone || !normalizedPhone.startsWith("+91") || normalizedPhone.length !== 13) {
    return normalizedPhone || "";
  }
  const digits = normalizedPhone.substring(3);
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
}

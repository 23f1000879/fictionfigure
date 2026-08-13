/**
 * Client-side Indian phone number normalization and validation.
 */
export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;

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

  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    return null;
  }

  return `+91${tenDigits}`;
}

export function normalizeMsg91WidgetIdentifier(input: string): string | null {
  if (!input) return null;
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

  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    return null;
  }

  return `91${tenDigits}`;
}

export function formatDisplayPhone(phoneStr: string): string {
  const norm = normalizeIndianPhone(phoneStr);
  if (!norm) return phoneStr;
  const digits = norm.substring(3);
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
}

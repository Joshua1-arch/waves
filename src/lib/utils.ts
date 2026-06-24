export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Sanitizes input values to prevent NoSQL injection.
 * Recursively removes keys that start with '$' or contain '.'
 */
export function sanitizeNoSql<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (input instanceof Date || input instanceof RegExp) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeNoSql(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const cleanObj: Record<string, any> = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        // Strip keys that start with '$' or contain '.'
        if (key.startsWith("$") || key.includes(".")) {
          continue;
        }
        cleanObj[key] = sanitizeNoSql((input as any)[key]);
      }
    }
    return cleanObj as unknown as T;
  }

  return input;
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must include at least one block (uppercase) letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must include at least one number." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: "Password must include at least one special character." };
  }
  return { valid: true };
}



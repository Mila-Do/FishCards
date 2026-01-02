import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines className values with Tailwind CSS merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Text Utilities
// ============================================================================

/**
 * Truncates text to specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Capitalizes first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generates a slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Formats date to Polish locale format
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("pl-PL", options);
}

/**
 * Formats date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) return "przed chwilą";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min temu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz temu`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dni temu`;

  return formatDate(targetDate, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Checks if date is today
 */
export function isToday(date: string | Date): boolean {
  const today = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;

  return (
    today.getDate() === targetDate.getDate() &&
    today.getMonth() === targetDate.getMonth() &&
    today.getFullYear() === targetDate.getFullYear()
  );
}

// ============================================================================
// Number Utilities
// ============================================================================

/**
 * Formats number with Polish locale
 */
export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("pl-PL", options).format(num);
}

/**
 * Formats bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Groups array items by key
 */
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const group = String(item[key]);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Removes duplicates from array based on key
 */
export function uniqueBy<T, K extends keyof T>(array: T[], key: K): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Chunks array into smaller arrays of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is object
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

/**
 * Pick specific keys from object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete result[key];
  });
  return result;
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Creates a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

/**
 * Creates a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
  let inThrottle: boolean;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Safe localStorage wrapper
 */
export const storage = {
  get<T = unknown>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T = unknown>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail for quota exceeded or other errors
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Silently fail
    }
  },
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

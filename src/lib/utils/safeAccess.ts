/**
 * Safe access utilities for optional chaining with proper fallbacks
 * Prevents undefined errors and provides type-safe defaults
 */

/**
 * Safely get array element with fallback
 */
export const safeArrayAccess = <T>(
  array: T[] | undefined | null,
  index: number,
  fallback: T
): T => {
  if (!Array.isArray(array)) return fallback;
  if (index < 0 || index >= array.length) return fallback;
  return array[index] ?? fallback;
};

/**
 * Safely get array length
 */
export const safeArrayLength = (array: unknown[] | undefined | null): number => {
  return Array.isArray(array) ? array.length : 0;
};

/**
 * Safely get first array element
 */
export const safeFirst = <T>(
  array: T[] | undefined | null,
  fallback: T
): T => {
  return safeArrayAccess(array, 0, fallback);
};

/**
 * Safely get last array element
 */
export const safeLast = <T>(
  array: T[] | undefined | null,
  fallback: T
): T => {
  if (!Array.isArray(array) || array.length === 0) return fallback;
  return array[array.length - 1] ?? fallback;
};

/**
 * Safely filter array with type guard
 */
export const safeFilter = <T>(
  array: T[] | undefined | null,
  predicate: (item: T) => boolean
): T[] => {
  if (!Array.isArray(array)) return [];
  return array.filter(predicate);
};

/**
 * Safely map array with transform
 */
export const safeMap = <T, R>(
  array: T[] | undefined | null,
  transform: (item: T, index: number) => R
): R[] => {
  if (!Array.isArray(array)) return [];
  return array.map(transform);
};

/**
 * Safely get property from object
 */
export const safeGet = <T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  fallback: T[K]
): T[K] => {
  if (!obj || typeof obj !== 'object') return fallback;
  return obj[key] ?? fallback;
};

/**
 * Safely parse JSON with fallback
 */
export const safeJsonParse = <T>(
  json: string | undefined | null,
  fallback: T
): T => {
  if (!json || typeof json !== 'string') return fallback;
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safely get nested property with dot notation
 */
export const safeNestedGet = <T>(
  obj: unknown,
  path: string,
  fallback: T
): T => {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return fallback;
    if (typeof current !== 'object') return fallback;
    current = current[key];
  }
  
  return current ?? fallback;
};

/**
 * Safely split string
 */
export const safeSplit = (
  str: string | undefined | null,
  separator: string,
  fallback: string[] = []
): string[] => {
  if (!str || typeof str !== 'string') return fallback;
  return str.split(separator).filter(Boolean);
};

/**
 * Safely trim string
 */
export const safeTrim = (
  str: string | undefined | null,
  fallback: string = ''
): string => {
  if (!str || typeof str !== 'string') return fallback;
  return str.trim();
};

/**
 * Safely convert to number
 */
export const safeNumber = (
  value: string | number | undefined | null,
  fallback: number = 0
): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

/**
 * Safely check if value exists and is not empty
 */
export const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Checks if the provided value is a plain object (excluding arrays and null).
 * @param value The value to check.
 * @returns True if the value is a non-null object and not an array, false otherwise.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if the specified key exists in the given object.
 * @param obj The object to check.
 * @param key The key to look for.
 * @returns True if the key exists in the object, false otherwise.
 */
export function hasKey<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

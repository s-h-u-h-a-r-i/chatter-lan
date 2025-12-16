/**
 * ### Performs a deep equality check between two values.
 *
 * Recursively compares values including objects and arrays. Returns true if
 * both values are deeply equal, otherwise false.
 *
 * @template T The type of the values being compared.
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns True if the values are deeply equal, false otherwise.
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  const keysA = Object.keys(a) as Array<keyof T>;
  const keysB = Object.keys(b) as Array<keyof T>;

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

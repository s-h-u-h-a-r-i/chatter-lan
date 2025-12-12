interface StorageSchema {
  appUserName: string;
}

type StorageSchemaKey = keyof StorageSchema;

/**
 * @overload
 * Returns the parsed item value if present, or the provided default value if absent.
 * @template K
 * @param {K} key - The key under which the value is stored in localStorage.
 * @param {StorageSchema[K]} defaultValue - The default value to return if the item is not present.
 * @returns {StorageSchema[K]} The parsed item value or the provided default value.
 */
export function getStorageItem<K extends StorageSchemaKey>(
  key: K,
  defaultValue: StorageSchema[K]
): StorageSchema[K];
/**
 * @overload
 * Returns the parsed item value if present, or null if absent.
 * @template K
 * @param {K} key - The key under which the value is stored in localStorage.
 * @returns {(StorageSchema[K] | null)} The parsed item value or null.
 */
export function getStorageItem<K extends StorageSchemaKey>(
  key: K
): StorageSchema[K] | null;
/**
 * ### Retrieves and parses an item from localStorage.
 *
 * @template K - The key of the item, corresponding to the StorageSchema.
 * @param {K} key - The key under which the value is stored in localStorage.
 * @param {StorageSchema[K]} [defaultValue] - The default value to return if the item is not present.
 * @returns {StorageSchema[K] | null} The parsed item value if present, or the provided default value if absent, or null if neither.
 */
export function getStorageItem<K extends StorageSchemaKey>(
  key: K,
  defaultValue?: StorageSchema[K]
): StorageSchema[K] | null {
  const item = localStorage.getItem(key);

  if (item === null) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return null;
  }

  return JSON.parse(item);
}

/**
 * ### Saves a value to localStorage under the provided key.
 *
 * @template K - The key of the item, corresponding to the StorageSchema.
 * @param {K} key - The key under which to store the value.
 * @param {StorageSchema[K]} value - The value to be stored.
 * @returns {void}
 */
export function setStorageItem<K extends StorageSchemaKey>(
  key: K,
  value: StorageSchema[K]
): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * ### Removes an item from localStorage under the provided key.
 *
 * @template K - The key of the item, corresponding to the StorageSchema.
 * @param {K} key - The key of the item to be removed.
 * @returns {void}
 */
export function removeStorageItem<K extends StorageSchemaKey>(key: K): void {
  localStorage.removeItem(key);
}

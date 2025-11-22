/**
 * ### Gets the segments of the current URL pathname.
 *
 * @remarks
 * The pathname is split by the '/' character, and any empty segments are filtered out.
 *
 * @example
 * // When the URL is 'https://example.com/foo/bar/'
 * getPathSegments(); // returns ['foo', 'bar']
 *
 * @returns {string[]} An array of non-empty URL path segments.
 */
export function getPathSegments(): string[] {
  return location.pathname.split("/").filter(Boolean);
}

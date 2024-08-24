/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 *
 * @param value Any value to be tested
 * @returns true if value is NOT `null` nor `undefined`
 */
export function isNonNullable(value: any): boolean {
  return value !== null && value !== undefined;
}

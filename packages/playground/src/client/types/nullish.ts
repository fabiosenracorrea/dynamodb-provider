/**
 * Check if a type is `undefined`
 *
 * Returns `true` or `false`
 */
export type IsUndefined<T> = undefined extends T ? true : false;

/**
 * Condition check if a type is `undefined`
 *
 * - If Yes, returns the `second` type parameter
 * - If No, returns the `third` type parameter
 */
export type IfUndefined<T, Y, N> = IsUndefined<T> extends true ? Y : N;

/**
 * Check if a type is `never`
 *
 * Returns `true` or `false`
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Condition check if a type is `never`
 *
 * - If Yes, returns the `second` type parameter
 * - If No, returns the `third` type parameter
 */
export type IfNever<
  T,
  TypeIfNever = true,
  TypeIfNotNever = false,
> = IsNever<T> extends true ? TypeIfNever : TypeIfNotNever;

/**
 * Make any type be optionally undefined as well
 */
export type OrUndefined<T> = T | undefined;

/**
 * Condition check if a type is `any`
 *
 * - If Yes, returns the `second` type parameter
 * - If No, returns the `third` type parameter
 */
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
// https://stackoverflow.com/questions/61624719/how-to-conditionally-detect-the-any-type-in-typescript

export type IsNull<T> = [T] extends [null] ? true : false;

export type IsUnknown<T> = unknown extends T // `T` can be `unknown` or `any`
  ? IsNull<T> extends false // `any` can be `null`, but `unknown` can't be
    ? true
    : false
  : false;

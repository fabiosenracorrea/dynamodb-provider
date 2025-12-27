/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Merges two objects, if the first object has properties
 * in common with the second, they are not kept
 */
export type MergeObj<Obj1, Obj2> = Omit<Obj1, keyof Obj2> & Obj2;

/**
 * Receives a `Record<string, string>` object and swaps the keys and values
 */
export type SwapKeyAndValues<T extends Record<string, string>> = {
  [K in keyof T as T[K]]: K;
};

/**
 * Ensures the object is shown as one plain object instead of combination of types
 */
export type PrettifyObject<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? PrettifyObject<T[K]> : T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

/**
 * As the name implies, references an object that can have any value on its keys
 */
export type AnyObject = Record<string, any>;

/**
 * Only the string keys from the object instead of string | number | symbol
 */
export type StringKey<Entity> = Extract<keyof Entity, string>;

/**
 * Removes any `undefined` property from the object
 */
export type OmitUndefined<T> = {
  [K in keyof T as T[K] extends Exclude<T[K], undefined> ? K : never]: T[K];
};

/**
 * Keeps only the `undefined` properties from the object
 */
export type OnlyOptional<T> = {
  [K in keyof T as T[K] extends Exclude<T[K], undefined> ? never : K]?: T[K];
};

/**
 * Ensures the object does not show as `{ key: string | undefined }`
 * but instead as `{ key?: string | undefined }`
 */
export type MakePartial<T> = OmitUndefined<T> & OnlyOptional<T>;

/**
 * Checks if any member of the union is an object
 *
 * - `User | string` => true
 * - `string | number` => never
 */
export type AnyMemberIsObject<T> = T extends any
  ? T extends object
    ? true
    : never
  : never;

/**
 * Ensures that, given an object type, the ref object has AT LEAST ONE property in common with that object,
 * NO EXTERNAL PROPERTIES ALLOWED
 *
 * @example
 * ```ts
 * type Options = {
 *   onCreate: boolean;
 *   onUpdate: boolean;
 * };
 *
 * type AllowedParams = AtLeastOne<Options>
 * ```
 *
 * - `{ onCreate: true }` => valid
 * - `{ onUpdate: false }` => valid
 * - `{ onCreate: true, onUpdate: false }` => valid
 * - `{  }` => INVALID
 * - `{ otherProp: 'hi' }` => INVALID
 * - `{ onCreate: true, extra: 1 }` => INVALID
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

/**
 * Makes every property on the object optional, except the ones passed in to the second param
 */
export type PartialExcept<
  Entity extends object,
  K extends keyof Entity,
> = Partial<Entity> & {
  [key in K]: Entity[K];
};

/**
 * Quickly generate an object with string as values
 */
export type StringObj<Keys extends string> = { [K in Keys]: string };

/**
 * Same as the native `Omit` type, but with autocomplete on the keys
 */
export type TypedOmit<Entity, Keys extends keyof Entity> = Omit<Entity, Keys>;

/**
 * Use this if you are getting unpredictable behavior with the
 * built in Omit<> from TS
 *
 * If you have a more complex that with Unions/Intersections Omit
 * can often lead TS to calculate the wrong type
 */
export type StableOmit<T, Keys extends keyof T> = {
  [K in keyof T as K extends Keys ? never : K]: T[K];
};

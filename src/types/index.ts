/* eslint-disable @typescript-eslint/no-explicit-any */
export type OrUndefined<T> = T | undefined;

export type IsUndefined<T> = undefined extends T ? true : false;

export type IfUndefined<T, Y, N> = IsUndefined<T> extends true ? Y : N;

export type AnyObject = Record<string, any>;

export type AnyMemberIsObject<T> = T extends any ? (T extends object ? true : never) : never;

export type StringKey<Entity> = Extract<keyof Entity, string>;

// https://stackoverflow.com/questions/61624719/how-to-conditionally-detect-the-any-type-in-typescript
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type IsNull<T> = [T] extends [null] ? true : false;

export type IsUnknown<T> = unknown extends T // `T` can be `unknown` or `any`
  ? IsNull<T> extends false // `any` can be `null`, but `unknown` can't be
    ? true
    : false
  : false;

export type IsNever<T> = [T] extends [never] ? true : false;

export type OmitUndefined<T> = {
  [K in keyof T as T[K] extends Exclude<T[K], undefined> ? K : never]: T[K];
};

export type OnlyOptional<T> = {
  [K in keyof T as T[K] extends Exclude<T[K], undefined> ? never : K]?: Exclude<T[K], undefined>;
};

export type MakePartial<T> = OmitUndefined<T> & OnlyOptional<T>;

export type AnyFunction = (...p: any[]) => any;

export type FirstParameter<Fn extends AnyFunction> = Parameters<Fn>[0];

// type PrettifyObject<Obj> = { [Key in keyof Obj]: Obj[Key] };
export type PrettifyObject<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? PrettifyObject<T[K]> : T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

/**
 * Ensures you have at least one key of an object present
 *
 * AtLeastOne<{ create?: string; update?: string; }> => ensures we have 'create' and/or 'update' defined
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

// ======================== TEST TYPES =========================== //

export type Expect<T extends true> = T;
export type ExpectTrue<T extends true> = T;
export type ExpectFalse<T extends false> = T;
export type IsTrue<T extends true> = T;
export type IsFalse<T extends false> = T;

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;

export type NotAny<T> = true extends IsAny<T> ? false : true;

export type Debug<T> = { [K in keyof T]: T[K] };
export type MergeInsertions<T> = T extends object ? { [K in keyof T]: MergeInsertions<T[K]> } : T;

export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>;

export type ExpectExtends<VALUE, EXPECTED> = EXPECTED extends VALUE ? true : false;
export type ExpectValidArgs<
  FUNC extends (...args: any[]) => any,
  ARGS extends any[],
> = ARGS extends Parameters<FUNC> ? true : false;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

// https://stackoverflow.com/questions/69793164/typescript-weird-type-intersection-of-string
/**
 * A type to make it possible to autocomplete on fields that accept strongly typed strings + any string
 *
 * `T = 'red' | 'blue' | SafeToIntersectString` => autocompletes works + string is also acceptable
 *
 * Sometimes you need this imported to VS CODE to properly work, but generally use the OrString
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type SafeToIntersectString = string & {};

/**
 * Safely create a type that can accept pre-determined strings or any, with autocomplete
 *
 * `OrString<'red' | 'blue'>` => autocompletes works + string is also acceptable
 */
export type OrString<T extends string> = T | SafeToIntersectString;

/**
 * Use this if you are getting unpredictable behavior with the
 * built in Omit<> from TS
 *
 * If you have a more complex that with Unions/Intersections Omit
 * can often lead TS to calculate the wrong type
 */
export type StableOmit<T, Keys extends OrString<Extract<keyof T, string>>> = {
  [K in keyof T as K extends Keys ? never : K]: T[K];
};

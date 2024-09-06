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
  [K in keyof T as T[K] extends Exclude<T[K], undefined> ? never : K]?: T[K];
};

export type MakePartial<T> = OmitUndefined<T> & OnlyOptional<T>;

export type AnyFunction = (...p: any[]) => any;

export type FirstParameter<Fn extends AnyFunction> = Parameters<Fn>[0];

// type PrettifyObject<Obj> = { [Key in keyof Obj]: Obj[Key] };
export type PrettifyObject<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? PrettifyObject<T[K]> : T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

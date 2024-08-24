/* eslint-disable @typescript-eslint/no-explicit-any */
export type OrUndefined<T> = T | undefined;

export type AnyObject = Record<string, any>;

export type AnyMemberIsObject<T> = T extends any ? (T extends object ? true : never) : never;

export type StringKey<Entity> = Extract<keyof Entity, string>;

// https://stackoverflow.com/questions/61624719/how-to-conditionally-detect-the-any-type-in-typescript
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export type OmitUndefined<T> = {
  [K in keyof T as T[K] extends Exclude<T[K], undefined> ? K : never]: T[K];
};

export type OnlyOptional<T> = {
  [K in keyof T as T[K] extends Exclude<T[K], undefined> ? never : K]?: T[K];
};

export type MakePartial<T> = OmitUndefined<T> & OnlyOptional<T>;

// type PrettifyObject<Obj> = { [Key in keyof Obj]: Obj[Key] };
export type PrettifyObject<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? PrettifyObject<T[K]> : T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

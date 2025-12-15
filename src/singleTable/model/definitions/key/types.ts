/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue, SingleTableKeyReference } from 'singleTable/adaptor/definitions';

import {
  AnyFunction,
  FirstParameter,
  IsUndefined,
  IsUnknown,
  OrString,
  PrettifyObject,
  StringKey,
} from 'types';

type EntityParamsOnly<Entity = undefined> = IsUndefined<Entity> extends true
  ? any
  : { [Key in keyof Entity]: Entity[Key] };

type KeyFn<Entity> = (params: EntityParamsOnly<Entity>) => KeyValue;

/**
 * This currently accepts any .string
 * even if its not a key of Entity
 *
 * The ideia is to just provide editor autocomplete
 */
type DotKey<T> = `.${StringKey<T>}`;

type StringKeyRef<T> = OrString<DotKey<T>>;

type KeyDotRef<Entity> = IsUndefined<Entity> extends true
  ? never
  : StringKeyRef<Entity>[];

type KeyRef<Entity> = KeyFn<Entity> | KeyDotRef<Entity>;

export type EntityKeyResolvers<Entity = undefined> = {
  getPartitionKey: KeyRef<Entity>;

  getRangeKey: KeyRef<Entity>;
};

type SafeFirstParam<
  Fn extends AnyFunction,
  Params = FirstParameter<Fn>,
> = IsUndefined<Params> extends true ? unknown : Params;

type MergedKeyParams<Resolvers extends EntityKeyResolvers<any>> = SafeFirstParam<
  Resolvers['getPartitionKey']
> &
  SafeFirstParam<Resolvers['getRangeKey']>;

/**
 * Get all the parameters used on partition resolvers
 *
 * Used to merge with other method params
 */
export type KeyParams<Resolvers extends EntityKeyResolvers<any>> = IsUnknown<
  MergedKeyParams<Resolvers>
> extends true
  ? unknown
  : PrettifyObject<MergedKeyParams<Resolvers>>;

type GetKeyParams<PieceResolvers extends EntityKeyResolvers<any>> = IsUnknown<
  KeyParams<PieceResolvers>
> extends true
  ? []
  : [KeyParams<PieceResolvers>];

export type KeyResolvers<PieceResolvers extends EntityKeyResolvers<any>> =
  PieceResolvers & {
    getKey: (...params: GetKeyParams<PieceResolvers>) => SingleTableKeyReference;
  };

/**
 * Extract .prop references
 */

type GetDotKeys<Entity, Params extends StringKeyRef<Entity>[]> = {
  [K in Params[number]]: K extends `.${infer Key extends keyof Entity & string}`
    ? Key
    : never;
}[Params[number]];

type KeyGetterParam<Entity, Params extends StringKeyRef<Entity>[]> = GetDotKeys<
  Entity,
  Params
> extends infer RefKeys extends keyof Entity
  ? [RefKeys] extends [never]
    ? []
    : [{ [K in RefKeys]: Entity[K] }]
  : [];

type ResolvedKeyFn<Entity, Params extends StringKeyRef<Entity>[]> = (
  ...actualParams: KeyGetterParam<Entity, Params>
) => string[];

/**
 * Normalize getPartitionKey + getRangeKey into functions
 */
type EntityKeyGettersPieces<Entity, Getters extends EntityKeyResolvers<any>> = {
  [K in Extract<
    keyof Getters,
    keyof EntityKeyResolvers
  >]: Getters[K] extends StringKeyRef<Entity>[]
    ? ResolvedKeyFn<Entity, Getters[K]>
    : Getters[K];
};

type EntityKeyGettersInner<
  Entity,
  Getters extends EntityKeyResolvers<any>,
  FnGetters = EntityKeyGettersPieces<Entity, Getters>,
> = FnGetters & {
  getKey: (
    ...params: FnGetters extends EntityKeyResolvers<any>
      ? GetKeyParams<FnGetters>
      : [never]
  ) => SingleTableKeyReference;
};

export type EntityKeyGetters<
  Entity,
  Getters extends EntityKeyResolvers<any>,
> = EntityKeyGettersInner<Entity, Getters>;

/**
 * Extract the getKey() params
 */
export type EntityKeyParamsInner<
  Entity,
  Getters extends EntityKeyResolvers<any>,
  FnGetters = EntityKeyGettersPieces<Entity, Getters>,
> = FnGetters extends EntityKeyResolvers<any> ? KeyParams<FnGetters> : never;

export type EntityKeyParams<
  Entity,
  Getters extends EntityKeyResolvers<any>,
> = EntityKeyParamsInner<Entity, Getters>;

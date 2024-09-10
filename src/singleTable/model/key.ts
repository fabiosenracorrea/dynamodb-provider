/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue, SingleTableKeyReference } from 'singleTable/adaptor/definitions';

import { AnyFunction, AnyObject, FirstParameter, IsUndefined, PrettifyObject } from 'types';

export type KeyGetter<Params extends AnyObject | undefined> = undefined extends Params
  ? () => KeyValue
  : (params: Params) => KeyValue;

type EntityParamsOnly<Entity = undefined> = IsUndefined<Entity> extends true
  ? any
  : { [Key in keyof Entity]: Entity[Key] };

export type EntityKeyResolvers<Entity = undefined> = {
  getPartitionKey: (params: EntityParamsOnly<Entity>) => KeyValue;

  getRangeKey: (params: EntityParamsOnly<Entity>) => KeyValue;
};

type SafeFirstParam<
  Fn extends AnyFunction,
  Params = FirstParameter<Fn>,
> = IsUndefined<Params> extends true ? unknown : Params;

/**
 * Get all the parameters used on partition resolvers
 */
export type EntityKeyParams<Resolvers extends EntityKeyResolvers<any>> = PrettifyObject<
  SafeFirstParam<Resolvers['getPartitionKey']> & SafeFirstParam<Resolvers['getRangeKey']>
>;

export type KeyResolvers<PieceResolvers extends EntityKeyResolvers<any>> = PieceResolvers & {
  getKey: (params: EntityKeyParams<PieceResolvers>) => SingleTableKeyReference;
};

// Todo>: fix type to accept only Key[] or {key, parser} to properly infer result
// type GetterByKeys<Entity extends AnyObject, Keys extends keyof Entity> = KeyGetter<{
//   [K in Keys]: Entity[K];
// }>;

// class BuiltKey<Entity extends AnyObject, Keys extends keyof Entity, KK extends keyof Entity> {
//   private fn: GetterByKeys<Entity, Keys | KK>;

//   constructor(k: (Keys | { key: KK; parse: (value?: Entity[KK]) => KeyValue })[]) {
//     this.fn = ((params) =>
//       k.map((singleKey) =>
//         typeof singleKey !== 'object' ? params[singleKey] : singleKey.parse(params[singleKey.key]),
//       )) as GetterByKeys<Entity, Keys | KK>;
//   }

//   getter(): GetterByKeys<Entity, Keys | KK> {
//     return this.fn;
//   }
// }

// export class Key<Entity extends AnyObject> {
//   build<K extends keyof Entity, KK extends keyof Entity>(
//     ...k: (K | { key: KK; parse: (value?: Entity[KK]) => KeyValue })[]
//   ): BuiltKey<Entity, K, KK> {
//     return new BuiltKey(k as any);
//   }
// }

// const keys = new Key<{
//   name: string;
//   age: number;
//   address: string;
//   zip: string;
//   id: string;
// }>().build('name');

// const x = keys.getter();

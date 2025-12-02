import type { QueryParams } from 'provider';
import type { AnyObject, HasUndefined } from 'types';

export type QueryConfigParams<Entity = AnyObject> = Omit<
  QueryParams<Entity>,
  'index' | 'partitionKey' | 'rangeKey' | 'table'
>;

export type OptionalTupleIfUndefined<Ref, Params> = HasUndefined<[Ref]> extends true
  ? [Params?]
  : [Params];

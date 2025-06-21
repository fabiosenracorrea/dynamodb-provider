import type { QueryParams } from 'provider';
import type { AnyObject } from 'types';

export type QueryConfigParams<Entity = AnyObject> = Omit<
  QueryParams<Entity>,
  'index' | 'partitionKey' | 'rangeKey' | 'table'
>;

export type OptionalTupleIfUndefined<Ref, Params> = Ref extends undefined ? [Params?] : [Params];

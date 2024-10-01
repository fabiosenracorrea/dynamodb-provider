import { QueryParams } from 'provider';
import { AnyObject } from 'types';

export type QueryConfigParams<Entity = AnyObject> = Omit<
  QueryParams<Entity>,
  'index' | 'hashKey' | 'rangeKey' | 'table'
>;

export type OptionalTupleIfUndefined<Ref, Params> = Ref extends undefined ? [Params?] : [Params];

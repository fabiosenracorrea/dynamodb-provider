import { CollectionListParams } from 'providers/database/provider/utils';
import { AnyObject } from 'types/general';

export type QueryConfigParams<Entity = AnyObject> = Omit<
  CollectionListParams<Entity>,
  'index' | 'hashKey' | 'rangeKey' | 'table'
>;

export type OptionalTupleIfUndefined<Ref, Params> = Ref extends undefined ? [Params?] : [Params];

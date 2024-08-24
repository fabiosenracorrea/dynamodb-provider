import { SingleTableItem } from 'types/general';
import { IDatabaseProvider } from '../provider';

import { CollectionListResult, StringKey } from '../provider/utils';

import { SingleTableKeyReference } from './config';

import { FromCollectionMethods, FromEntityMethods } from './model';
import {
  SingleTableCreateItemParams,
  SingleTableTransactionConfig,
  SingleTableUpdateParams,
  SingleTableGetParams,
  SingleTableBatchGetParams,
  SingleTableCollectionListParams,
  ListItemTypeParams,
  ListItemTypeResult,
} from './definitions';

export interface SingleTableAdaptor
  extends Pick<IDatabaseProvider, 'createSetEntity'>,
    FromEntityMethods,
    FromCollectionMethods {
  get<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableGetParams<Entity, PKs>,
  ): Promise<Entity | undefined>;

  batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]>;

  create<Entity>(params: SingleTableCreateItemParams<Entity>): Promise<Entity>;

  delete(params: SingleTableKeyReference): Promise<void>;

  update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  listAllFromType<Entity>(type: string): Promise<Entity[]>;
  listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>>;

  listCollection<Entity = SingleTableItem>(
    params: SingleTableCollectionListParams<Entity>,
  ): Promise<CollectionListResult<Entity>>;

  executeTransaction(configs: (SingleTableTransactionConfig | null)[]): Promise<void>;
  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (SingleTableTransactionConfig | null)[],
  ): (SingleTableTransactionConfig | null)[];

  findTableItem<Entity>(items: { _type?: string }[], type: string): Entity | undefined;
  filterTableItens<Entity>(items: { _type?: string }[], type: string): Entity[];
}

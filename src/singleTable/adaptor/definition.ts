import { AnyObject, StringKey } from 'types';

import { IDatabaseProvider, QueryResult } from 'provider';

import {
  SingleTableCreateItemParams,
  SingleTableTransactionConfig,
  SingleTableUpdateParams,
  SingleTableGetParams,
  SingleTableBatchGetParams,
  SingleTableQueryParams,
  ListItemTypeParams,
  ListItemTypeResult,
  SingleTableKeyReference,
  SingleTableConfig,
} from './definitions';

export interface SingleTableProviderParams extends SingleTableConfig {
  databaseProvider?: IDatabaseProvider;
}

export interface ISingleTableProvider<SingleParams extends SingleTableProviderParams>
  extends Pick<IDatabaseProvider, 'createSet'> {
  get<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableGetParams<Entity, PKs>,
  ): Promise<Entity | undefined>;

  batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]>;

  create<Entity>(params: SingleTableCreateItemParams<Entity, SingleParams>): Promise<Entity>;

  delete(params: SingleTableKeyReference): Promise<void>;

  update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  listAllFromType<Entity>(type: string): Promise<Entity[]>;
  listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>>;

  listCollection<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity>,
  ): Promise<QueryResult<Entity>>;

  executeTransaction(configs: (SingleTableTransactionConfig | null)[]): Promise<void>;
  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (SingleTableTransactionConfig | null)[],
  ): (SingleTableTransactionConfig | null)[];

  findTableItem<Entity>(items: { _type?: string }[], type: string): Entity | undefined;
  filterTableItens<Entity>(items: { _type?: string }[], type: string): Entity[];
}

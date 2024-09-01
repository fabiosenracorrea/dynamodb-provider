import { AnyObject, StringKey } from 'types';

import { IDynamodbProvider, QueryResult } from 'provider';

import {
  SingleTableCreateItemParams,
  SingleTableTransactionConfig,
  SingleTableUpdateParams,
  SingleTableGetParams,
  SingleTableBatchGetParams,
  SingleTableQueryParams,
  ListItemTypeParams,
  ListItemTypeResult,
  SingleTableConfig,
  SingleTableDeleteParams,
} from './definitions';

export interface SingleTableProviderParams extends SingleTableConfig {
  databaseProvider?: IDynamodbProvider;
}

export interface ISingleTableProvider<SingleParams extends SingleTableProviderParams>
  extends Pick<IDynamodbProvider, 'createSet'> {
  get<Entity>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined>;

  batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]>;

  create<Entity>(params: SingleTableCreateItemParams<Entity, SingleParams>): Promise<Entity>;

  delete<Entity>(params: SingleTableDeleteParams<Entity>): Promise<void>;

  update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  listAllFromType<Entity>(type: string): Promise<Entity[]>;
  listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>>;

  query<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity, SingleParams>,
  ): Promise<QueryResult<Entity>>;

  executeTransaction(configs: (SingleTableTransactionConfig | null)[]): Promise<void>;
  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (SingleTableTransactionConfig | null)[],
  ): (SingleTableTransactionConfig | null)[];

  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined;
  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[];
}

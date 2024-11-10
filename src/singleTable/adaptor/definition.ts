import { AnyObject, StringKey } from 'types';

import { IDynamodbProvider, QueryResult, TransactionConfig } from 'provider';

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
  SingleTableTransactConfigGenerator,
} from './definitions';

export interface SingleTableParams extends SingleTableConfig {
  /**
   * An instance of `DynamodbProvider`, configured to your needs
   */
  dynamodbProvider: IDynamodbProvider;
}

export interface ISingleTableMethods<SingleParams extends SingleTableParams>
  extends Pick<IDynamodbProvider, 'createSet'> {
  get<Entity = AnyObject>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined>;

  batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]>;

  create<Entity>(params: SingleTableCreateItemParams<Entity, SingleParams>): Promise<Entity>;

  delete<Entity = AnyObject>(params: SingleTableDeleteParams<Entity>): Promise<void>;

  update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  listAllFromType<Entity>(type: string): Promise<Entity[]>;
  listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>>;

  query<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity, SingleParams>,
  ): Promise<QueryResult<Entity>>;

  ejectTransactParams(configs: (SingleTableTransactionConfig | null)[]): TransactionConfig[];
  executeTransaction(configs: (SingleTableTransactionConfig<SingleParams> | null)[]): Promise<void>;

  generateTransactionConfigList<Item extends AnyObject>(
    items: Item[],
    generator: SingleTableTransactConfigGenerator<Item, SingleParams>,
  ): SingleTableTransactionConfig<SingleParams, Item>[];

  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined;
  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[];
}

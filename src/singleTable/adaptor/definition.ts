import { AnyObject, StringKey } from 'types';

import {
  BatchCreateResult,
  BatchDeleteResult,
  BatchMutateResult,
  IDynamodbProvider,
  QueryResult,
  TransactionParams,
} from 'provider';

import {
  SingleTableCreateParams,
  SingleTableTransactionParams,
  SingleTableUpdateParams,
  SingleTableGetParams,
  SingleTableBatchGetParams,
  SingleTableBatchCreateParams,
  SingleTableBatchDeleteParams,
  SingleTableBatchMutateParams,
  SingleTableQueryParams,
  SingleTableQueryOneParams,
  SingleTableQueryAllParams,
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
  get<Entity = AnyObject>(
    params: SingleTableGetParams<Entity>,
  ): Promise<Entity | undefined>;

  batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]>;

  batchCreate<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchCreateParams<Entity, PKs>,
  ): Promise<BatchCreateResult<Entity, PKs>>;

  batchDelete<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchDeleteParams<Entity, PKs>,
  ): Promise<BatchDeleteResult<Entity, PKs>>;

  batchMutate<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchMutateParams<Entity, PKs>,
  ): Promise<BatchMutateResult<Entity, PKs>>;

  create<Entity>(params: SingleTableCreateParams<Entity, SingleParams>): Promise<Entity>;

  delete<Entity = AnyObject>(params: SingleTableDeleteParams<Entity>): Promise<void>;

  update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  listAllFromType<Entity>(type: string): Promise<Entity[]>;
  listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>>;

  query<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity, SingleParams>,
  ): Promise<QueryResult<Entity>>;

  queryOne<Entity = AnyObject>(
    params: SingleTableQueryOneParams<Entity, SingleParams>,
  ): Promise<Entity | undefined>;

  queryAll<Entity = AnyObject>(
    params: SingleTableQueryAllParams<Entity, SingleParams>,
  ): Promise<Entity[]>;

  ejectTransactParams(
    configs: (SingleTableTransactionParams | null)[],
  ): TransactionParams[];

  transaction(
    configs: (SingleTableTransactionParams<SingleParams> | null)[],
  ): Promise<void>;

  toTransactionParams<Item extends AnyObject>(
    items: Item[],
    generator: SingleTableTransactConfigGenerator<Item, SingleParams>,
  ): SingleTableTransactionParams<SingleParams, Item>[];

  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined;
  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, StringKey } from 'types';

import {
  CreateParams,
  DeleteParams,
  UpdateParams,
  QueryParams,
  QueryResult,
  QueryOneParams,
  QueryAllParams,
  TransactionParams,
  DBSet,
  GetItemParams,
  BatchListItemsArgs,
  ListAllOptions,
  ListOptions,
  ListTableResult,
  DynamoDBConfig,
} from './utils';

export interface DynamoDbProviderParams {
  /**
   * DynamoDB Document Client
   *
   * You can pass in either v2 or v3 client
   */
  dynamoDB: DynamoDBConfig;

  /**
   * Defines if we should log the params constructed
   * right before calling a dynamodb action.
   *
   * Useful for debugging param generation and such
   */
  logCallParams?: boolean;
}

export interface IDynamodbProvider<
  Params extends DynamoDbProviderParams = DynamoDbProviderParams,
> {
  target: Params['dynamoDB']['target'];

  list<Entity>(
    tableName: string,
    options?: ListOptions<Entity>,
  ): Promise<ListTableResult<Entity>>;
  listAll<Entity>(tableName: string, options?: ListAllOptions<Entity>): Promise<Entity[]>;

  get<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined>;

  batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]>;

  create<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: CreateParams<Entity, PKs>,
  ): Promise<Entity>;

  update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  delete<Entity extends Record<string, any>>(params: DeleteParams<Entity>): Promise<void>;

  query<Entity = AnyObject>(params: QueryParams<Entity>): Promise<QueryResult<Entity>>;

  queryOne<Entity = AnyObject>(
    params: QueryOneParams<Entity>,
  ): Promise<Entity | undefined>;

  queryAll<Entity = AnyObject>(params: QueryAllParams<Entity>): Promise<Entity[]>;

  transaction(configs: (TransactionParams | null)[]): Promise<void>;

  toTransactionParams<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionParams | null)[],
  ): TransactionParams[];

  createSet<T extends string[] | number[]>(
    items: T,
  ): DBSet<T[number], Params['dynamoDB']['target']>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, StringKey } from 'types';

import {
  CreateItemParams,
  DeleteItemParams,
  UpdateParams,
  QueryParams,
  QueryResult,
  TransactionConfig,
  DBSet,
  GetItemParams,
  BatchListItemsArgs,
  ListAllOptions,
  ListOptions,
  ListTableResult,
} from './utils';

export interface IDynamodbProvider {
  list<Entity>(tableName: string, options?: ListOptions<Entity>): Promise<ListTableResult<Entity>>;
  listAll<Entity>(tableName: string, options?: ListAllOptions<Entity>): Promise<Entity[]>;

  get<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined>;

  batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]>;

  create<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: CreateItemParams<Entity, PKs>,
  ): Promise<Entity>;

  update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  delete<Entity extends Record<string, any>>(params: DeleteItemParams<Entity>): Promise<void>;

  query<Entity = AnyObject>(params: QueryParams<Entity>): Promise<QueryResult<Entity>>;

  executeTransaction(configs: (TransactionConfig | null)[]): Promise<void>;

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[],
  ): TransactionConfig[];

  createSet(items: string[] | number[]): DBSet;
}

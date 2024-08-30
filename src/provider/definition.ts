/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringKey } from 'types';

import {
  CreateItemParams,
  DeleteItemParams,
  UpdateParams,
  CollectionListParams,
  CollectionListResult,
  TransactionConfig,
  DBSet,
  GetItemParams,
  BatchListItemsArgs,
  ListAllOptions,
  ListOptions,
  ListTableResult,
} from './utils';

export interface IDatabaseProvider {
  list<Entity>(tableName: string, options?: ListOptions<Entity>): Promise<ListTableResult<Entity>>;
  listAll<Entity>(tableName: string, options?: ListAllOptions<Entity>): Promise<Entity[]>;

  get<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined>;

  batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]>;

  create<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: CreateItemParams<Entity, PKs>,
  ): Promise<Entity>;

  update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  delete<Entity extends Record<string, any>>(params: DeleteItemParams<Entity>): Promise<void>;

  query<Entity>(params: CollectionListParams<Entity>): Promise<CollectionListResult<Entity>>;

  executeTransaction(configs: (TransactionConfig | null)[]): Promise<void>;

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[],
  ): TransactionConfig[];

  createSet(items: string[]): DBSet;
}

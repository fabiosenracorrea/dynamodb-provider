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
  Filters,
} from './utils';

export interface ListAllOptions<Entity> {
  propertiesToGet?: StringKey<Entity>[];

  filters?: Filters<Entity>;
}

export interface IDatabaseProvider {
  listAll<Entity>(tableName: string, options?: ListAllOptions<Entity>): Promise<Entity[]>;

  get<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined>;

  batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]>;

  // add condition param, option to not use the createdAt etc
  create<Entity>(params: CreateItemParams<Entity>): Promise<Entity>;

  // workout which return params would be interesting to return
  update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined>;

  // add condition param, etc
  delete<Entity extends Record<string, any>>(params: DeleteItemParams<Entity>): Promise<void>;

  listCollection<Entity>(
    params: CollectionListParams<Entity>,
  ): Promise<CollectionListResult<Entity>>;

  executeTransaction(configs: (TransactionConfig | null)[]): Promise<void>;

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[],
  ): TransactionConfig[];

  createSet(items: string[]): DBSet;
}

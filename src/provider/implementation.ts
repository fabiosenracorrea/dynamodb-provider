/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, StringKey } from 'types';

import { DynamoDbProviderParams, IDynamodbProvider } from './definition';

import {
  CreateItemParams,
  DeleteItemParams,
  UpdateParams,
  TransactionParams,
  DBSet,
  BatchListItemsArgs,
  GetItemParams,
  ItemCreator,
  ItemRemover,
  ItemGetter,
  ItemUpdater,
  ItemLister,
  ListTableResult,
  ListOptions,
  ListAllOptions,
  BatchGetter,
  TransactionWriter,
  QueryBuilder,
  QueryParams,
  QueryResult,
  DynamoDBSet,
} from './utils';

export class DynamodbProvider<Params extends DynamoDbProviderParams>
  implements IDynamodbProvider<Params>
{
  private creator: ItemCreator;

  private remover: ItemRemover;

  private getter: ItemGetter;

  private updater: ItemUpdater;

  private lister: ItemLister;

  private batchGetter: BatchGetter;

  private transactWriter: TransactionWriter;

  private queryBuilder: QueryBuilder;

  private set: DynamoDBSet;

  target: Params['dynamoDB']['target'];

  constructor(params: Params) {
    this.creator = new ItemCreator(params);

    this.remover = new ItemRemover(params);

    this.getter = new ItemGetter(params);

    this.updater = new ItemUpdater(params);

    this.lister = new ItemLister(params);

    this.batchGetter = new BatchGetter(params);

    this.transactWriter = new TransactionWriter(params);

    this.queryBuilder = new QueryBuilder(params);

    this.set = new DynamoDBSet(params);

    this.target = params.dynamoDB.target;
  }

  async get<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined> {
    return this.getter.get(params);
  }

  async create<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: CreateItemParams<Entity, PKs>,
  ): Promise<Entity> {
    return this.creator.create(params as CreateItemParams<Entity>);
  }

  async delete<Entity extends Record<string, any>>(
    params: DeleteItemParams<Entity>,
  ): Promise<void> {
    await this.remover.delete(params);
  }

  async update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.updater.update(params);
  }

  async list<Entity = AnyObject>(
    table: string,
    options = {} as ListOptions<Entity>,
  ): Promise<ListTableResult<Entity>> {
    return this.lister.list(table, options);
  }

  async listAll<Entity = AnyObject>(
    table: string,
    options = {} as ListAllOptions<Entity>,
  ): Promise<Entity[]> {
    return this.lister.listAll(table, options);
  }

  async batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]> {
    return this.batchGetter.batchGet(options);
  }

  async query<Entity = AnyObject>(
    params: QueryParams<Entity>,
  ): Promise<QueryResult<Entity>> {
    return this.queryBuilder.query(params);
  }

  /**
   * [Deprecated soon] Prefer the more clean `transaction`
   */
  async executeTransaction(configs: (TransactionParams | null)[]): Promise<void> {
    await this.transactWriter.transaction(configs);
  }

  async transaction(configs: (TransactionParams | null)[]): Promise<void> {
    await this.transactWriter.transaction(configs);
  }

  toTransactionParams<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionParams | null)[],
  ): TransactionParams[] {
    return this.transactWriter.toTransactionParams(items, generator);
  }

  createSet<T extends string[] | number[]>(
    items: T,
  ): DBSet<T[number], Params['dynamoDB']['target']> {
    return this.set.createSet(items) as DBSet<T[number], Params['dynamoDB']['target']>;
  }
}

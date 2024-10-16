/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, StringKey } from 'types';

import { IDynamodbProvider } from './definition';

import {
  CreateItemParams,
  DeleteItemParams,
  UpdateParams,
  TransactionConfig,
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
  DynamoDBConfig,
  DynamoDBSet,
} from './utils';

interface DynamoDbProviderParams {
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

export class DynamodbProvider implements IDynamodbProvider {
  private creator: ItemCreator;

  private remover: ItemRemover;

  private getter: ItemGetter;

  private updater: ItemUpdater;

  private lister: ItemLister;

  private batchGetter: BatchGetter;

  private transactWriter: TransactionWriter;

  private queryBuilder: QueryBuilder;

  private set: DynamoDBSet;

  constructor(params: DynamoDbProviderParams) {
    this.creator = new ItemCreator(params);

    this.remover = new ItemRemover(params);

    this.getter = new ItemGetter(params);

    this.updater = new ItemUpdater(params);

    this.lister = new ItemLister(params);

    this.batchGetter = new BatchGetter(params);

    this.transactWriter = new TransactionWriter(params);

    this.queryBuilder = new QueryBuilder(params);

    this.set = new DynamoDBSet(params);
  }

  async get<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined> {
    return this.getter.get(params);
  }

  async create<Entity>(params: CreateItemParams<Entity>): Promise<Entity> {
    return this.creator.create(params);
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

  async query<Entity = AnyObject>(params: QueryParams<Entity>): Promise<QueryResult<Entity>> {
    return this.queryBuilder.query(params);
  }

  async executeTransaction(configs: (TransactionConfig | null)[]): Promise<void> {
    await this.transactWriter.executeTransaction(configs);
  }

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[],
  ): TransactionConfig[] {
    return this.transactWriter.generateTransactionConfigList(items, generator);
  }

  createSet(items: string[] | number[]): DBSet {
    return this.set.createSet(items);
  }
}

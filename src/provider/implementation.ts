/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDB } from 'aws-sdk';

import { StringKey } from 'types';

import { IDatabaseProvider } from './definition';

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
  CollectionListParams,
  CollectionListResult,
} from './utils';

export class DatabaseProvider implements IDatabaseProvider {
  private dynamoService: DynamoDB.DocumentClient;

  private creator: ItemCreator;

  private remover: ItemRemover;

  private getter: ItemGetter;

  private updater: ItemUpdater;

  private lister: ItemLister;

  private batchGetter: BatchGetter;

  private transactWriter: TransactionWriter;

  private queryBuilder: QueryBuilder;

  // add in constructor params like
  // log
  // future: service/v2-v3
  constructor() {
    this.dynamoService = new DynamoDB.DocumentClient();

    this.creator = new ItemCreator({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.remover = new ItemRemover({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.getter = new ItemGetter({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.updater = new ItemUpdater({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.lister = new ItemLister({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.batchGetter = new BatchGetter({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.transactWriter = new TransactionWriter({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });

    this.queryBuilder = new QueryBuilder({
      logCallParams: true,
      dynamoDB: this.dynamoService,
    });
  }

  async get<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
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

  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.updater.update(params);
  }

  async list<Entity>(
    table: string,
    options = {} as ListOptions<Entity>,
  ): Promise<ListTableResult<Entity>> {
    return this.lister.list(table, options);
  }

  async listAll<Entity>(table: string, options = {} as ListAllOptions<Entity>): Promise<Entity[]> {
    return this.lister.listAll(table, options);
  }

  async batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]> {
    return this.batchGetter.batchGet(options);
  }

  async listCollection<Entity>(
    params: CollectionListParams<Entity>,
  ): Promise<CollectionListResult<Entity>> {
    return this.queryBuilder.listCollection(params);
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

  createSet(items: string[]): DBSet {
    return this.dynamoService.createSet(items) as DBSet;
  }
}

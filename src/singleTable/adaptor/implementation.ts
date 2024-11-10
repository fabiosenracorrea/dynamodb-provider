/* eslint-disable max-classes-per-file */
import { StringKey, AnyObject } from 'types';

import { IDynamodbProvider } from 'provider';

import { QueryResult, TransactionConfig } from 'provider/utils';

import {
  ListItemTypeParams,
  ListItemTypeResult,
  SingleTableBatchGetParams,
  SingleTableQueryParams,
  SingleTableCreateItemParams,
  SingleTableGetParams,
  SingleTableTransactionConfig,
  SingleTableUpdateParams,
  SingleTableLister,
  SingleTableConfig,
  SingleTableBatchGetter,
  SingleTableRemover,
  SingleTableCreator,
  SingleTableGetter,
  SingleTableDeleteParams,
  SingleTableUpdater,
  SingleTableQueryBuilder,
  SingleTableTransactionWriter,
  SingleTableTransactConfigGenerator,
} from './definitions';

import { ISingleTableMethods, SingleTableParams } from './definition';

export class SingleTableMethods<SingleParams extends SingleTableParams>
  implements ISingleTableMethods<SingleParams>
{
  private db: IDynamodbProvider;

  private config: SingleTableConfig;

  private lister: SingleTableLister;

  private batchGetter: SingleTableBatchGetter;

  private remover: SingleTableRemover;

  private creator: SingleTableCreator;

  private getter: SingleTableGetter;

  private updater: SingleTableUpdater;

  private transactWriter: SingleTableTransactionWriter;

  private querBuilder: SingleTableQueryBuilder;

  constructor({ dynamodbProvider, ...config }: SingleParams) {
    this.db = dynamodbProvider;

    this.config = config;

    const params = { db: this.db, config: this.config };

    this.lister = new SingleTableLister(params);
    this.batchGetter = new SingleTableBatchGetter(params);
    this.remover = new SingleTableRemover(params);
    this.creator = new SingleTableCreator(params);
    this.getter = new SingleTableGetter(params);
    this.updater = new SingleTableUpdater(params);
    this.transactWriter = new SingleTableTransactionWriter(params);
    this.querBuilder = new SingleTableQueryBuilder(params);
  }

  async get<Entity = AnyObject>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined> {
    return this.getter.get(params);
  }

  async create<Entity>(params: SingleTableCreateItemParams<Entity, SingleParams>): Promise<Entity> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.creator.create(params as any);
  }

  async update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.updater.update(params);
  }

  async delete<Entity = AnyObject>(params: SingleTableDeleteParams<Entity>): Promise<void> {
    await this.remover.delete(params);
  }

  async batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]> {
    return this.batchGetter.batchGet<Entity, PKs>(params);
  }

  async query<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity, SingleParams>,
  ): Promise<QueryResult<Entity>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.querBuilder.query(params as any);
  }

  ejectTransactParams(configs: (SingleTableTransactionConfig | null)[]): TransactionConfig[] {
    return this.transactWriter.ejectTransactParams(configs);
  }

  async executeTransaction(
    configs: (SingleTableTransactionConfig<SingleParams> | null)[],
  ): Promise<void> {
    return this.transactWriter.executeTransaction(configs);
  }

  generateTransactionConfigList<Item extends AnyObject>(
    items: Item[],
    generator: SingleTableTransactConfigGenerator<Item, SingleParams>,
  ): SingleTableTransactionConfig<SingleParams, Item>[] {
    return this.transactWriter.generateTransactionConfigList(
      items,
      generator,
    ) as SingleTableTransactionConfig<SingleParams, Item>[];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createSet<T extends string[] | number[]>(items: T): any {
    return this.db.createSet(items);
  }

  async listAllFromType<Entity = AnyObject>(type: string): Promise<Entity[]> {
    return this.lister.listAllFromType(type);
  }

  async listType<Entity = AnyObject>(
    params: ListItemTypeParams,
  ): Promise<ListItemTypeResult<Entity>> {
    return this.lister.listType(params);
  }

  private isOfItemType(item: AnyObject, type: string): boolean {
    if (!this.config.typeIndex) return false;

    return type === item[this.config.typeIndex.partitionKey];
  }

  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined {
    return items.find((item) => this.isOfItemType(item, type)) as Entity | undefined;
  }

  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[] {
    return items.filter((item) => this.isOfItemType(item, type)) as Entity[];
  }
}

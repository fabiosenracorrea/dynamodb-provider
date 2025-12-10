/* eslint-disable max-classes-per-file */
import { StringKey, AnyObject, AnyFunction } from 'types';

import { IDynamodbProvider } from 'provider';

import { QueryResult, TransactionParams } from 'provider/utils';

import {
  ListItemTypeParams,
  ListItemTypeResult,
  SingleTableBatchGetParams,
  SingleTableQueryParams,
  SingleTableQueryOneParams,
  SingleTableQueryAllParams,
  SingleTableCreateParams,
  SingleTableGetParams,
  SingleTableTransactionParams,
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

interface SingleTableMethodsExtension {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parser?: (item: any) => any;
}

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

  constructor(
    { dynamodbProvider, ...config }: SingleParams,
    { parser }: SingleTableMethodsExtension = {},
  ) {
    this.db = dynamodbProvider;

    this.config = config;

    const params = { db: this.db, config: this.config, parser };

    this.lister = new SingleTableLister(params);
    this.batchGetter = new SingleTableBatchGetter(params);
    this.remover = new SingleTableRemover(params);
    this.creator = new SingleTableCreator(params);
    this.getter = new SingleTableGetter(params);
    this.updater = new SingleTableUpdater(params);
    this.transactWriter = new SingleTableTransactionWriter(params);
    this.querBuilder = new SingleTableQueryBuilder(params);
  }

  async get<Entity = AnyObject>(
    params: SingleTableGetParams<Entity>,
  ): Promise<Entity | undefined> {
    return this.getter.get(params);
  }

  async create<Entity>(
    params: SingleTableCreateParams<Entity, SingleParams>,
  ): Promise<Entity> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.creator.create(params as any);
  }

  async update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.updater.update(params);
  }

  async delete<Entity = AnyObject>(
    params: SingleTableDeleteParams<Entity>,
  ): Promise<void> {
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

  async queryOne<Entity = AnyObject>(
    params: SingleTableQueryOneParams<Entity, SingleParams>,
  ): Promise<Entity | undefined> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.querBuilder.queryOne(params as any);
  }

  async queryAll<Entity = AnyObject>(
    params: SingleTableQueryAllParams<Entity, SingleParams>,
  ): Promise<Entity[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.querBuilder.queryAll(params as any);
  }

  ejectTransactParams(
    configs: (SingleTableTransactionParams | null)[],
  ): TransactionParams[] {
    return this.transactWriter.ejectTransactParams(configs);
  }

  async transaction(
    configs: (SingleTableTransactionParams<SingleParams> | null)[],
  ): Promise<void> {
    return this.transactWriter.transaction(configs);
  }

  toTransactionParams<Item extends AnyObject>(
    items: Item[],
    generator: SingleTableTransactConfigGenerator<Item, SingleParams>,
  ): SingleTableTransactionParams<SingleParams, Item>[] {
    return this.transactWriter.toTransactionParams(
      items,
      generator as AnyFunction,
    ) as SingleTableTransactionParams<SingleParams, Item>[];
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

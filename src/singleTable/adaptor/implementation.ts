import { StringKey, AnyObject } from 'types';

import { DynamodbProvider, IDatabaseProvider } from 'provider';

import { QueryResult, DBSet } from 'provider/utils';

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
} from './definitions';

import { ISingleTableProvider, SingleTableProviderParams } from './definition';
import { SingleTableTransactionWriter } from './definitions/operations/transactions';

export class SingleTableProvider<SingleParams extends SingleTableProviderParams>
  implements ISingleTableProvider<SingleParams>
{
  private db: IDatabaseProvider;

  private config: SingleTableConfig;

  private lister: SingleTableLister;

  private batchGetter: SingleTableBatchGetter;

  private remover: SingleTableRemover;

  private creator: SingleTableCreator;

  private getter: SingleTableGetter;

  private updater: SingleTableUpdater;

  private transactWriter: SingleTableTransactionWriter;

  private querBuilder: SingleTableQueryBuilder;

  constructor({ databaseProvider, ...config }: SingleParams) {
    this.db = databaseProvider || new DynamodbProvider();

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

  async get<Entity>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined> {
    return this.getter.get(params);
  }

  async create<Entity>(params: SingleTableCreateItemParams<Entity, SingleParams>): Promise<Entity> {
    return this.creator.create(params);
  }

  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.updater.update(params);
  }

  async delete<Entity>(params: SingleTableDeleteParams<Entity>): Promise<void> {
    await this.remover.delete(params);
  }

  async batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]> {
    return this.batchGetter.batchGet<Entity, PKs>(params);
  }

  async listAllFromType<Entity>(type: string): Promise<Entity[]> {
    return this.lister.listAllFromType(type);
  }

  async listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>> {
    return this.lister.listType(params);
  }

  async query<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity, SingleParams>,
  ): Promise<QueryResult<Entity>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.querBuilder.query(params as any);
  }

  async executeTransaction(configs: (SingleTableTransactionConfig | null)[]): Promise<void> {
    return this.transactWriter.executeTransaction(configs);
  }

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (
      item: Item,
    ) => (SingleTableTransactionConfig | null)[] | SingleTableTransactionConfig | null,
  ): SingleTableTransactionConfig[] {
    return this.transactWriter.generateTransactionConfigList(items, generator);
  }

  createSet(items: string[]): DBSet {
    return this.db.createSet(items);
  }

  // helps dealing with TS type checking when building our entity collections
  // v2 will have an auto builder that receives an entity with collection references
  // and create the item ready to be returned by the repo
  isOfItemType(item: AnyObject, type: string): boolean {
    return type === item[this.config.typeIndex.partitionKey];
  }

  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined {
    return items.find((item) => this.isOfItemType(item, type)) as Entity | undefined;
  }

  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[] {
    return items.filter((item) => this.isOfItemType(item, type)) as Entity[];
  }
}

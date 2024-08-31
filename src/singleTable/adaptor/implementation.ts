import { removeUndefinedProps } from 'utils/object';
import { StringKey, AnyObject } from 'types';

import DatabaseProvider, { IDatabaseProvider } from 'provider';

import { QueryResult, DBSet, RangeKeyConfig } from 'provider/utils';

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

  constructor({ databaseProvider, ...config }: SingleParams) {
    this.db = databaseProvider || new DatabaseProvider();

    this.config = config;

    this.lister = new SingleTableLister({ db: this.db, config });
    this.batchGetter = new SingleTableBatchGetter({ db: this.db, config });
    this.remover = new SingleTableRemover({ db: this.db, config });
    this.creator = new SingleTableCreator({ db: this.db, config });
    this.getter = new SingleTableGetter({ db: this.db, config });
    this.updater = new SingleTableUpdater({ db: this.db, config });
    this.transactWriter = new SingleTableTransactionWriter({ db: this.db, config });
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

  private async _listCollection<Entity = SingleTableItem>({
    index,
    partition,
    range,
    cleanDBProps = true,
    ...options
  }: SingleTableQueryParams<Entity> & { cleanDBProps?: boolean }): Promise<QueryResult<Entity>> {
    const { items, paginationToken } = await this.db.query({
      ...options,

      table: this.config.table,

      index: index ? indexNameMapping[index] : undefined,

      hashKey: {
        name: (index ? this.getIndexHashName(index) : this.config.hashKey) as StringKey<Entity>,

        value: this.convertKey(partition),
      },

      rangeKey: range
        ? removeUndefinedProps({
            ...range,

            high: range.operation === 'between' ? this.convertKey(range.high) : undefined,

            low: range.operation === 'between' ? this.convertKey(range.low) : undefined,

            value: range.operation !== 'between' ? this.convertKey(range.value) : undefined,

            name: (index
              ? this.getIndexRangeName(index)
              : this.config.rangeKey) as StringKey<Entity>,
          } as unknown as RangeKeyConfig<Entity>)
        : undefined,
    });

    return {
      paginationToken,

      items: cleanDBProps ? this.cleanInternalPropsFromList(items as AnyObject[]) : items,
    } as QueryResult<Entity>;
  }

  async listCollection<Entity = SingleTableItem>(
    params: SingleTableQueryParams<Entity>,
  ): Promise<QueryResult<Entity>> {
    const result = await this._listCollection<Entity>(params);

    return result;
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
  findTableItem<Entity>(items: { _type?: string }[], type: string): Entity | undefined {
    return items.find(({ _type }) => _type === type) as Entity | undefined;
  }

  filterTableItens<Entity>(items: { _type?: string }[], type: string): Entity[] {
    return items.filter(({ _type }) => _type === type) as Entity[];
  }
}

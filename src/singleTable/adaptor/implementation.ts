import { removeUndefinedProps } from 'utils/object';
import { StringKey, AnyObject } from 'types';

import DatabaseProvider, { IDatabaseProvider } from 'provider';

import {
  QueryResult,
  CreateItemParams,
  DBSet,
  DeleteItemParams,
  RangeKeyConfig,
  UpdateParams,
  ValidateTransactParams,
} from 'provider/utils';

import {
  ListItemTypeParams,
  ListItemTypeResult,
  SingleTableBatchGetParams,
  SingleTableQueryParams,
  SingleTableCreateItemParams,
  SingleTableGetParams,
  SingleTableTransactionConfig,
  SingleTableUpdateParams,
  SingleTableValidateTransactParams,
  UpdateIndexMapping,
  SingleTableLister,
  SingleTableConfig,
  SingleTableBatchGetter,
} from './definitions';

import { SingleTableAdaptor } from './definition';

interface Params extends SingleTableConfig {
  databaseProvider?: IDatabaseProvider;
}

export class SingleTableProvider implements SingleTableAdaptor {
  private db: IDatabaseProvider;

  private config: SingleTableConfig;

  private lister: SingleTableLister;

  private batchGetter: SingleTableBatchGetter;

  constructor({ databaseProvider, ...config }: Params) {
    this.db = databaseProvider || new DatabaseProvider();

    this.config = config;

    this.lister = new SingleTableLister({ db: this.db, config });
    this.batchGetter = new SingleTableBatchGetter({ db: this.db, config });
  }

  private cleanInternalProps<E extends AnyObject>(object: E): E {
    return cleanInternalProps(object);
  }

  private cleanInternalPropsFromList<E extends AnyObject>(list: E[]): E[] {
    return cleanInternalPropsFromList(list);
  }

  private convertKey(key: KeyValue | number): string {
    if (Array.isArray(key)) return key.join(this.config.keySeparator);

    return `${key}`;
  }

  private getIndexHashName(index: TableIndex): string {
    return getIndexHashName(index);
  }

  private getIndexRangeName(index: TableIndex): string {
    return getIndexRangeName(index);
  }

  private getIndexRecord({
    index,
    partitionKey,
    rangeKey,
  }: {
    index: TableIndex;
  } & Partial<SingleTableKeyReference>): Record<string, string> {
    const [hashName, rangeName] = [
      this.getIndexHashName.bind(this),
      this.getIndexRangeName.bind(this),
    ].map((cb) => cb(index));

    const [hashValue, rangeValue] = [partitionKey, rangeKey].map((key) => {
      // this makes sure if we get an partial index update, we only keep what is full
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!key || key.includes(undefined as any)) return;

      return this.convertKey(key);
    });

    return removeUndefinedProps({
      [hashName]: hashValue,

      [rangeName]: rangeValue,
    }) as Record<string, string>;
  }

  getPrimaryKeyRecord<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    partitionKey,
    rangeKey,
  }: SingleTableKeyReference): PKs extends StringKey<Entity>
    ? { [K in PKs]: Entity[K] }
    : Partial<Entity> {
    return {
      [`${this.config.hashKey}`]: this.convertKey(partitionKey),
      [`${this.config.rangeKey}`]: this.convertKey(rangeKey),
    } as PKs extends StringKey<Entity> ? { [K in PKs]: Entity[K] } : Partial<Entity>;
  }

  async get<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    partitionKey,
    rangeKey,
    ...options
  }: SingleTableGetParams<Entity, PKs>): Promise<Entity | undefined> {
    const item = await this.db.get<Entity, PKs>({
      ...options,

      table: this.config.table,

      key: this.getPrimaryKeyRecord({
        partitionKey,
        rangeKey,
      }),
    });

    if (item) return this.cleanInternalProps(item);
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

  private transformIndexMappingToRecord(mapping: UpdateIndexMapping): Record<string, string> {
    const allIndexes = Object.entries(mapping).reduce(
      (acc, [index, key]) => ({
        ...acc,

        ...this.getIndexRecord({
          index: index as TableIndex,
          ...key,
        }),
      }),
      {},
    );

    return allIndexes;
  }

  private getCreateParams<Entity>({
    item,
    key,
    type,
    indexes,
    unixExpiresAt,
  }: SingleTableCreateItemParams<Entity>): CreateItemParams<Entity> {
    return {
      table: this.config.table,

      item: {
        ...item,

        ...(unixExpiresAt ? { [this.config.expiresAt]: unixExpiresAt } : {}),

        [this.config.itemTypeProp]: type,

        ...this.getPrimaryKeyRecord(key),

        ...(indexes ? this.transformIndexMappingToRecord(indexes) : {}),

        // type index
        [this.config.addedAt]: getCurrentFormattedTime(),
      },
    };
  }

  async create<Entity>(params: SingleTableCreateItemParams<Entity>): Promise<Entity> {
    const created = await this.db.create<Entity>(this.getCreateParams(params));

    return this.cleanInternalProps(created as AnyObject) as Entity;
  }

  private getDeleteParams({
    partitionKey,
    rangeKey,
  }: SingleTableKeyReference): DeleteItemParams<SingleTableKeyReference> {
    return {
      table: this.config.table,

      key: this.getPrimaryKeyRecord({
        partitionKey,
        rangeKey,
      }),
    };
  }

  async delete(keyReference: SingleTableKeyReference): Promise<void> {
    await this.db.delete(this.getDeleteParams(keyReference));
  }

  private validateUpdateProps({
    values,
    atomicOperations,
    remove,
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SingleTableUpdateParams<any>): void {
    const allPropertiesMentioned = [
      ...Object.values(values || []),
      ...(remove || []),
      ...(atomicOperations || []).map(({ property }) => property),
    ];

    const anyLowLevelRef = allPropertiesMentioned.some((prop) => `${prop}`.startsWith('_'));

    if (anyLowLevelRef) throw new Error("Can't use any item property that starts with '_'");
  }

  private getUpdateParams<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, PKs>,
  ): UpdateParams<Entity, PKs> {
    this.validateUpdateProps(params);

    const {
      conditions,
      unixExpiresAt,
      indexes,
      atomicOperations,
      remove,
      values,
      returnUpdatedProperties,
    } = params;

    const addValues = !!(params.indexes || params.unixExpiresAt);

    return {
      table: this.config.table,

      key: this.getPrimaryKeyRecord(params),

      atomicOperations,
      conditions,
      remove,
      returnUpdatedProperties,

      values: (addValues
        ? {
            ...params.values,

            ...(unixExpiresAt ? { [this.config.expiresAt]: unixExpiresAt } : {}),

            ...(indexes ? this.transformIndexMappingToRecord(indexes) : {}),
          }
        : values) as UpdateParams<Entity, PKs>['values'],
    };
  }

  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.db.update(this.getUpdateParams(params));
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

  private getValidateParams({
    conditions,
    partitionKey,
    rangeKey,
  }: SingleTableValidateTransactParams): ValidateTransactParams {
    return {
      conditions,

      table: this.config.table,

      key: this.getPrimaryKeyRecord({
        partitionKey,
        rangeKey,
      }),
    };
  }

  async executeTransaction(configs: (SingleTableTransactionConfig | null)[]): Promise<void> {
    await this.db.executeTransaction(
      (configs.filter(Boolean) as SingleTableTransactionConfig[]).map(
        ({ create, erase, update, validate }) => {
          if (erase) return { erase: { ...this.getDeleteParams(erase) } };

          if (create) return { create: { ...this.getCreateParams(create) } };

          if (update) return { update: { ...this.getUpdateParams(update) } };

          if (validate) return { validate: this.getValidateParams(validate) };

          throw new Error('Invalid transaction type');
        },
      ),
    );
  }

  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (SingleTableTransactionConfig<AnyObject, unknown> | null)[],
  ): (SingleTableTransactionConfig<AnyObject, unknown> | null)[] {
    return items.map(generator).flat().filter(Boolean);
  }

  createSetEntity(items: string[]): DBSet {
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

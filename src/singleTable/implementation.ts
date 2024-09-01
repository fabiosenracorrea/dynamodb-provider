import { removeUndefinedProps } from 'utils/object';
import { SingleTableItem } from 'types/general';
import { getCurrentFormattedTime } from 'utils/date';
import { getFirstItem, getLastIndex } from 'utils/array';
import { cascadeEval } from 'utils/conditions';
import { StringKey, AnyObject } from 'types';

import DynamodbProvider, { IDatabaseProvider } from '../provider';

import {
  QueryResult,
  CreateItemParams,
  DBSet,
  DeleteItemParams,
  RangeKeyConfig,
  UpdateParams,
  ValidateTransactParams,
} from '../provider/utils';

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
} from './definitions';

import { SingleTableAdaptor } from './definition';
import {
  ExtendableRegisteredEntity,
  ExtendableWithIndexRegisteredEntity,
  FromCollection,
  FromEntity,
  IndexQueryMethods,
  PartitionQueryMethods,
  ExtendablePartitionCollection,
  JoinResolutionParams,
  GetCollectionResult,
} from './model';
import { Extractor, Sorter } from './model/partitionCollection';
import { SingleTableLister } from './adaptor/definitions';

interface Params extends SingleTableConfig {
  databaseProvider?: IDatabaseProvider;
}

export class SingleTableProvider implements SingleTableAdaptor {
  private db: IDatabaseProvider;

  private config: SingleTableConfig;

  private lister: SingleTableLister;

  constructor({ databaseProvider, ...config }: Params) {
    this.db = databaseProvider || new DynamodbProvider();

    this.config = config;

    this.lister = new SingleTableLister({ db: this.db, config });
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
    const item = await this.databaseProvider.get<Entity, PKs>({
      ...options,

      table: this.config.table,

      key: this.getPrimaryKeyRecord({
        partitionKey,
        rangeKey,
      }),
    });

    if (item) return this.cleanInternalProps(item);
  }

  async batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    keys,
    ...options
  }: SingleTableBatchGetParams<Entity, PKs>): Promise<Entity[]> {
    const items = await this.databaseProvider.batchGet<Entity, PKs>({
      ...options,

      table: this.config.table,

      keys: keys.map((ref) => this.getPrimaryKeyRecord(ref)),
    });

    return this.cleanInternalPropsFromList(items as AnyObject[]) as Entity[];
  }

  async listAllFromType<Entity>(type: string): Promise<Entity[]> {
    const { items } = await this.databaseProvider.listCollection({
      table: this.config.table,

      hashKey: {
        value: type,
        name: this.config.itemTypeProp,
      },

      fullRetrieval: true,

      index: this.config.typeIndex,
    });

    return this.cleanInternalPropsFromList(items as AnyObject[]) as Entity[];
  }

  async listType<Entity>({
    type,
    dateRange,
    ...collectionListConfig
  }: ListItemTypeParams): Promise<ListItemTypeResult<Entity>> {
    const { items, paginationToken } = await this.databaseProvider.listCollection({
      table: this.config.table,

      hashKey: {
        value: type,
        name: this.config.itemTypeProp,
      },

      index: this.config.typeIndex,

      ...collectionListConfig,

      rangeKey: dateRange
        ? {
            ...dateRange,

            name: this.config.rangeKey,
          }
        : undefined,
    });

    return {
      items: this.cleanInternalPropsFromList(items as AnyObject[]) as Entity[],

      paginationToken,
    };
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
    const created = await this.databaseProvider.create<Entity>(this.getCreateParams(params));

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
    await this.databaseProvider.delete(this.getDeleteParams(keyReference));
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
    return this.databaseProvider.update(this.getUpdateParams(params));
  }

  private async _listCollection<Entity = SingleTableItem>({
    index,
    partition,
    range,
    cleanDBProps = true,
    ...options
  }: SingleTableQueryParams<Entity> & { cleanDBProps?: boolean }): Promise<QueryResult<Entity>> {
    const { items, paginationToken } = await this.databaseProvider.query({
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
    const result = this._listCollection<Entity>(params);

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
    await this.databaseProvider.executeTransaction(
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
    return this.databaseProvider.createSet(items);
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

  // --------------------------------- FROM ENTITY ------------------------------ //

  private bindObjectMethods<E extends AnyObject>(object: E): E {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [
        key,
        typeof value === 'function' ? value.bind(this) : value,
      ]),
    ) as E;
  }

  private buildEntityQuery<Registered extends ExtendableRegisteredEntity>(
    entity: Registered,
  ): PartitionQueryMethods<Registered> {
    const callers = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      custom: (config = {} as any) =>
        this.listCollection({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(config as any),

          partition: entity.getPartitionKey(config),
        }),

      ...Object.fromEntries(
        Object.entries(
          (entity.rangeQueries as ExtendableRegisteredEntity['rangeQueries']) ?? {},
        ).map(([rangeQueryName, paramGetter]) => [
          rangeQueryName,
          (queryParams = {}) =>
            this.listCollection({
              ...queryParams,

              partition: entity.getPartitionKey(queryParams),

              range: paramGetter(queryParams),
            }),
        ]),
      ),
    } as PartitionQueryMethods<Registered>;

    return this.bindObjectMethods(callers);
  }

  private getQueryIndexMethods<Registered extends ExtendableRegisteredEntity>(
    entity: Registered,
  ): IndexQueryMethods<ExtendableRegisteredEntity | ExtendableWithIndexRegisteredEntity> {
    const typed = entity as ExtendableWithIndexRegisteredEntity;

    if (!typed.indexes) return {};

    const queryIndex: IndexQueryMethods<ExtendableWithIndexRegisteredEntity>['queryIndex'] = {
      ...Object.fromEntries(
        Object.entries(typed.indexes).map(([index, indexConfig]) => [
          index,

          this.bindObjectMethods({
            custom: (params = {}) =>
              this.listCollection({
                ...params,

                index: indexConfig.index,

                partition: indexConfig.getPartitionKey(params),
              }),

            ...Object.fromEntries(
              Object.entries(
                (indexConfig.rangeQueries as ExtendableRegisteredEntity['rangeQueries']) ?? {},
              ).map(([rangeQueryName, paramGetter]) => [
                rangeQueryName,

                (queryParams = {}) =>
                  this.listCollection({
                    ...queryParams,

                    index: indexConfig.index,

                    partition: indexConfig.getPartitionKey(queryParams),

                    range: paramGetter(queryParams),
                  }),
              ]),
            ),
          }),
        ]),
      ),
    };

    return {
      queryIndex,
    };
  }

  fromEntity<Registered extends ExtendableRegisteredEntity>(
    entity: Registered,
  ): FromEntity<Registered> {
    const methods = {
      get: ((params = {}) =>
        this.get({ ...params, ...entity.getKey(params) } as SingleTableGetParams<
          Registered['__entity']
        >)) as FromEntity<Registered>['get'],

      batchGet: (({ keys, ...options }) =>
        this.batchGet({
          ...options,
          keys: keys.map(entity.getKey),
        })) as FromEntity<Registered>['batchGet'],

      create: ((item, config) =>
        this.create(entity.getCreationParams(item, config))) as FromEntity<Registered>['create'],

      delete: ((params) => this.delete(entity.getKey(params))) as FromEntity<Registered>['delete'],

      listAll: (() => this.listAllFromType(entity.type)) as FromEntity<Registered>['listAll'],

      update: (async (params) => {
        await this.update(entity.getUpdateParams(params));
      }) as FromEntity<Registered>['update'],

      listByCreation: ((params = {}) =>
        this.listType({
          type: entity.type,

          ...params,
        })) as FromEntity<Registered>['listByCreation'],

      query: this.buildEntityQuery(entity),

      ...(this.getQueryIndexMethods(entity) as IndexQueryMethods<Registered>),
    };

    return this.bindObjectMethods(methods);
  }

  // ---------------- FROM COLLECTION -------------------- //

  private findMatching({
    childType,
    method,
    options,
    parent,
    resolver,
    mapping,
  }: {
    parent: SingleTableItem;
    options: SingleTableItem[];
    childType: string;
    mapping: Record<string, SingleTableItem[]>;
  } & Pick<JoinResolutionParams, 'resolver'> &
    Required<Pick<JoinResolutionParams, 'method'>>): SingleTableItem[] {
    if (method === 'BY_TYPE') return mapping[childType] ?? [];

    if (method === 'RESOLVER')
      return mapping[childType].filter(
        (option) => option._type === childType && resolver?.(parent, option),
      );

    const BAD_INDEX = -1;

    // ref: null joins
    const nullParent = !parent._sk;

    // find parent position
    // find next parent type position
    // slice option, filter all by Type

    const parentIndex = nullParent
      ? 0
      : options.findIndex(({ _pk, _sk }) => parent._pk === _pk && parent._sk === _sk);

    if (parentIndex < 0 || parentIndex > getLastIndex(options)) return [];

    const nextParentTypeIndex = options.findIndex(
      ({ _type }, index) => index > parentIndex && _type === parent._type,
    );

    const actualNextParentIndex =
      nextParentTypeIndex === BAD_INDEX ? options.length : nextParentTypeIndex + 1;

    const children = options
      .slice(parentIndex, actualNextParentIndex)
      .filter(({ _type }) => _type === childType);

    return children;
  }

  private cleanCollectionChildren(
    children: SingleTableItem | SingleTableItem[] | undefined | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sorter?: (a: any, b: any) => number,
  ): SingleTableItem | SingleTableItem[] | null {
    if (!children) return null;

    const isList = Array.isArray(children);

    const isPrimitive = typeof (isList ? getFirstItem(children) : children) !== 'object';

    if (isPrimitive) return children;

    return isList
      ? this.cleanInternalPropsFromList(this.applySort(children, sorter))
      : this.cleanInternalProps(children);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applySort<Entity>(list: Entity[], sorter?: (a: any, b: any) => number): Entity[] {
    if (!sorter) return list;

    return list.slice().sort(sorter);
  }

  private buildJoin({
    item,
    join,
    mapping,
    options,
  }: {
    item: SingleTableItem;
    options: SingleTableItem[]; // all the options available to be joined
    join: ExtendablePartitionCollection['join'];
    mapping: Record<string, SingleTableItem[]>; // byType to easily reduce times if method is BY TYPE
  }): AnyObject {
    const joinProps = Object.fromEntries(
      Object.entries(join)
        .map(([prop, config]) => {
          const {
            ref,
            type,
            method = 'POSITION',
            resolver,
            join: childJoin,
            sorter,
            extractor,
          } = config as typeof config & {
            join?: ExtendablePartitionCollection['join'];
            sorter?: Sorter;
            extractor?: Extractor;
          };

          const joinOptions = this.findMatching({
            childType: ref,
            mapping,
            options,
            parent: item,
            method,
            resolver,
          });

          const childrenBase = type === 'SINGLE' ? getFirstItem(joinOptions) : joinOptions;

          const children = cascadeEval([
            {
              is: Array.isArray(childrenBase),
              then: () => [childrenBase].flat().map((c) => extractor?.(c) ?? c),
            },
            {
              is: childrenBase,
              then: () => extractor?.(childrenBase) ?? childrenBase,
            },
            {
              is: true,
              then: null,
            },
          ]);

          if (typeof children !== 'object') return [prop, children];

          if (!childJoin || !children)
            return [prop, this.cleanCollectionChildren(children, sorter)];

          const furtherJoined = Array.isArray(children)
            ? this.applySort(
                children.map((child) =>
                  this.buildJoin({
                    item: child,
                    mapping,
                    join: childJoin,
                    options,
                  }),
                ),
                sorter,
              )
            : this.buildJoin({
                item: children,
                mapping,
                join: childJoin,
                options,
              });

          return [prop, furtherJoined];
        })
        .filter(([, value]) => value),
    );

    return this.cleanInternalProps({
      ...item,

      ...joinProps,
    });
  }

  private buildCollection<Registered extends ExtendablePartitionCollection>(
    { join, startRef, type, ...params }: Registered,
    items: SingleTableItem[],
  ): GetCollectionResult<Registered> {
    const byType = items.reduce(
      (acc, next) => ({
        ...acc,

        [next._type]: [...(acc[next._type] ?? []), next],
      }),
      {} as Record<string, SingleTableItem[]>,
    );

    const start =
      type === 'MULTIPLE' ? byType[startRef] ?? [] : getFirstItem(byType[startRef] ?? []);

    if (type === 'SINGLE' && startRef && !start)
      return undefined as GetCollectionResult<Registered>;

    return Array.isArray(start)
      ? this.applySort(
          start.map(
            (item) =>
              this.buildJoin({
                item,
                mapping: byType,
                join,
                options: items,
              }),
            (params as { sorter?: Sorter }).sorter,
          ),
        )
      : this.buildJoin({
          item: start ?? {},
          mapping: byType,
          join,
          options: items,
        });
  }

  private async getPartitionCollection<Registered extends ExtendablePartitionCollection>(
    collection: Registered,
    ...params: Parameters<FromCollection<Registered>['get']>
  ): Promise<GetCollectionResult<Registered>> {
    const [config] = params;

    const { items } = await this._listCollection({
      ...(config ?? {}),

      partition: collection.getPartitionKey(config),

      fullRetrieval: true, // this method is for this, more complex extractions later

      index: collection.index,

      cleanDBProps: false,

      range: cascadeEval([
        {
          is: collection.narrow === 'RANGE_KEY',

          then: () => ({
            operation: 'begins_with',
            value: collection.originEntity.getRangeKey(config),
          }),
        },
        {
          is: typeof collection.narrow === 'function',
          then: () => collection.narrow(config),
        },
        {
          is: true,
          then: undefined,
        },
      ]),
    });

    return this.buildCollection(collection, items);
  }

  fromCollection<Registered extends ExtendablePartitionCollection>(
    collection: Registered,
  ): FromCollection<Registered> {
    const methods: FromCollection<Registered> = {
      get: (...params) => this.getPartitionCollection(collection, ...params),
    };

    return this.bindObjectMethods(methods);
  }
}

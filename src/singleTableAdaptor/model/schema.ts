/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types/general';
import { KeyValue, SingleTableKeyReference, TableIndex } from '../config';
import {
  BaseCollectionConfig,
  CRUDProps,
  CollectionConfigProps,
  EntityIndexConfig,
  EntityKeyGetters,
  IndexMapping,
  IndexProps,
  RangeQuery,
  RangeQueryConfigProps,
  RegisterEntityParams,
  RegisteredEntity,
  addAutoGenParams,
} from './entity';
import { Partition, PartitionCreationParams, createPartition } from './partition';
import {
  PartitionCollection,
  PartitionCollectionParams,
  createCollection,
} from './partitionCollection';

import { SingleTableCreateItemParams, SingleTableUpdateParams } from '../definitions';
import { DefinedMethods } from './defined';

let invocations = 0;

interface EntityCache {
  params: any;
  entity: any;
}

class SchemaControl {
  private entityTypes: Set<string>;

  private configCache: Map<string, EntityCache>;

  constructor() {
    this.entityTypes = new Set();
    this.configCache = new Map();

    invocations += 1;

    if (invocations > 1)
      throw new Error('Schema Control should be called only once in the application');
  }

  private validateIndexKeyReturn(keyValue: KeyValue): KeyValue | undefined {
    // there are some keys that could be dependant on props that are not present
    // on update
    if (!keyValue) return;

    if (typeof keyValue === 'string') return keyValue.includes('undefined') ? undefined : keyValue;

    const badValue = keyValue.some((part) => !part);

    return badValue ? undefined : keyValue;
  }

  private registerType(type: string): void {
    if (this.entityTypes.has(type)) throw new Error(`Entity ${type} already registered`);

    this.entityTypes.add(type);
  }

  private cacheEntity(config: EntityCache): void {
    this.configCache.set(config.params.type, config);
  }

  createPartition<Params extends PartitionCreationParams>(params: Params): Partition<Params> {
    // later we will improve on how this interacts with everything
    return createPartition(params);
  }

  createCollection<Params extends PartitionCollectionParams>(
    params: Params,
  ): PartitionCollection<Params> {
    return createCollection(params);
  }

  private getCollectionConfigParams<Config extends BaseCollectionConfig | undefined>(
    config: Config,
  ): CollectionConfigProps<Config> {
    if (!config) return {} as CollectionConfigProps<Config>;

    return {
      collectionEntities: config,
    } as CollectionConfigProps<Config>;
  }

  private getRangeQueriesParams<Config extends RangeQuery | undefined>(
    config: Config,
  ): RangeQueryConfigProps<Config> {
    if (!config) return {} as RangeQueryConfigProps<Config>;

    return {
      rangeQueries: Object.fromEntries(
        Object.entries(config).map(([queryName, { getValues, operation }]) => [
          queryName,
          (valueParams: AnyObject) => ({ operation, ...getValues(valueParams) }),
        ]),
      ),
      // this is done due to the 'between' x other operations
      // type difference
    } as RangeQueryConfigProps<Config>;
  }

  private getEntityIndexParams<IndexConfig extends IndexMapping>(
    indexes: IndexConfig,
  ): EntityIndexConfig<IndexConfig> {
    return {
      indexes: Object.fromEntries(
        Object.entries(indexes).map(([indexName, { rangeQueries, ...config }]) => [
          indexName as TableIndex,
          {
            ...config,

            getIndexKey: (keyParams: any) => ({
              partitionKey: config.getPartitionKey(keyParams),
              rangeKey: config.getRangeKey(keyParams),
            }),

            ...this.getRangeQueriesParams(rangeQueries),
          },
        ]),
      ) as unknown as EntityIndexConfig<IndexConfig>['indexes'],

      getCreationIndexMapping: (indexParams) =>
        Object.fromEntries(
          Object.values(indexes).map(({ getPartitionKey, getRangeKey, index }) => {
            const partitionKey = this.validateIndexKeyReturn(getPartitionKey(indexParams));
            const rangeKey = this.validateIndexKeyReturn(getRangeKey(indexParams));

            if (!partitionKey && !rangeKey) return [];

            return [
              index,
              {
                partitionKey,
                rangeKey,
              },
            ] as [TableIndex, SingleTableKeyReference];
          }),
        ),

      getUpdatedIndexMapping: (indexParams) =>
        Object.fromEntries(
          Object.values(indexes).map(({ getPartitionKey, getRangeKey, index }) => {
            const partitionKey = this.validateIndexKeyReturn(getPartitionKey(indexParams));
            const rangeKey = this.validateIndexKeyReturn(getRangeKey(indexParams));

            if (!partitionKey && !rangeKey) return [];

            return [
              index,
              {
                partitionKey,
                rangeKey,
              },
            ] as [TableIndex, Partial<SingleTableKeyReference>];
          }),
        ),
    };
  }

  private resolveKeyGetters<Params extends RegisterEntityParams<any>>({
    getPartitionKey,
    partition,
    getRangeKey,
  }: Params): EntityKeyGetters<Params> {
    const partitionKeyGetter = (partition?.getPartitionKey ??
      getPartitionKey) as EntityKeyGetters<Params>['getPartitionKey'];

    const getKey = ((keyParams: any) => ({
      partitionKey: partitionKeyGetter?.(keyParams),
      rangeKey: getRangeKey(keyParams),
    })) as EntityKeyGetters<Params>['getKey'];

    return {
      getKey,
      getPartitionKey: partitionKeyGetter,
      getRangeKey,
    };
  }

  private getCRUDParamGetters<
    Entity extends AnyObject,
    Params extends RegisterEntityParams<Entity>,
  >({
    type,
    getKey,
    getCreationIndexMapping,
    getUpdatedIndexMapping,
    autoGen,
  }: EntityKeyGetters<Params> & Params & Partial<EntityIndexConfig<IndexMapping>>): CRUDProps<
    Entity,
    Params
  > {
    type WantedParams = CRUDProps<Entity, Params>;

    type CreationParams = Parameters<WantedParams['getCreationParams']>;

    const getCreationParams = (
      item: CreationParams[0],
      config: CreationParams[1] = {},
    ): SingleTableCreateItemParams<AnyObject> => {
      const actualItem = addAutoGenParams({
        values: item,
        when: 'onCreation',
        genConfig: autoGen,
      });

      return {
        ...config,

        key: getKey({ ...item, ...actualItem }),

        type,

        item: actualItem,

        indexes: getCreationIndexMapping?.(actualItem),
      };
    };

    type UpdateParams = Parameters<WantedParams['getUpdateParams']>;

    const getUpdateParams = (updateParams: UpdateParams[0]): SingleTableUpdateParams<AnyObject> => {
      const values = addAutoGenParams({
        values: updateParams.values ?? {},
        when: 'onUpdate',
        genConfig: autoGen,
      });

      return {
        ...updateParams,

        ...getKey(updateParams as Partial<Entity>),

        values,

        indexes: getUpdatedIndexMapping?.({
          ...updateParams,
          ...values,
        }),
      };
    };

    return {
      getUpdateParams,
      getCreationParams,
    } as WantedParams;
  }

  private registerEntity<Entity extends AnyObject, Params extends RegisterEntityParams<Entity>>(
    params: Params,
  ): RegisteredEntity<Entity, Params> {
    this.registerType(params.type);

    const { rangeQueries, indexes, type, collectionEntities } = params;

    const keyParams = this.resolveKeyGetters(params);

    const indexParams = (indexes ? this.getEntityIndexParams(indexes) : {}) as IndexProps<
      Entity,
      Params
    >;

    const collectionProperties = this.getCollectionConfigParams(
      collectionEntities,
    ) as CollectionConfigProps<Params['collectionEntities']>;

    const rangeProperties = this.getRangeQueriesParams(rangeQueries) as RangeQueryConfigProps<
      Params['rangeQueries']
    >;

    const entity = {
      __entity: {} as Entity,

      type: type as RegisteredEntity<Entity, Params>['type'],

      ...keyParams,

      ...collectionProperties,

      ...rangeProperties,

      ...indexParams,

      ...this.getCRUDParamGetters<Entity, Params>({
        ...params,
        ...keyParams,
        ...indexParams,
      } as any),
    };

    // this.cacheEntity({ entity, params });

    return entity;
  }

  /*
    Our registerEntity type is rather complex.

    Adding 'Entity' as a first argument to supply it whenever creating the entity directly
    was breaking type inference on the other 4 arguments, which we don't want to

    TS does not have 'partial inference' as of now, and the behavior that we want when
    calling registerEntity is to pass directly to it every definition (indexes, collection entities, etc)
    and have it infer so our entityRegistered has all the autocomplete, type safety features

    To fix this, we need to add an extra layer to separate the layers, which is what this method
    here is doing. We then provide the Entity to this, we pass down properly, as we only want the
    Entity inference on the return, not on the registerEntity params itself
  */
  defined<Entity extends Record<string, any>>(): DefinedMethods<Entity> {
    return {
      registerEntity: this.registerEntity.bind(this) as DefinedMethods<Entity>['registerEntity'],
    };
  }
}

export const singleTableSchema = new SchemaControl();

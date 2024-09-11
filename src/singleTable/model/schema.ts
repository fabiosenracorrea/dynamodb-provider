/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor/definitions';

import { AnyObject } from 'types';
import { getRangeQueriesParams, getEntityIndexParams } from './definitions';

interface EntityCache {
  params: any;
  entity: any;
}

export class SingleTableSchema<TableConfig extends SingleTableConfig> {
  private entityTypes: Set<string>;

  private configCache: Map<string, EntityCache>;

  private config: TableConfig;

  constructor(config: TableConfig) {
    this.entityTypes = new Set();
    this.configCache = new Map();

    this.config = config;
  }

  private registerType(type: string): void {
    if (this.entityTypes.has(type))
      throw new Error(`Entity ${type} already registered for ${this.config.table}`);

    this.entityTypes.add(type);
  }

  private cacheEntity(config: EntityCache): void {
    this.configCache.set(config.params.type, config);
  }

  // createPartition<Params extends PartitionCreationParams>(params: Params): Partition<Params> {
  //   // later we will improve on how this interacts with everything
  //   return createPartition(params);
  // }

  // createCollection<Params extends PartitionCollectionParams>(
  //   params: Params,
  // ): PartitionCollection<Params> {
  //   return createCollection(params);
  // }

  // private getCollectionConfigParams<Config extends BaseCollectionConfig | undefined>(
  //   config: Config,
  // ): CollectionConfigProps<Config> {
  //   if (!config) return {} as CollectionConfigProps<Config>;

  //   return {
  //     collectionEntities: config,
  //   } as CollectionConfigProps<Config>;
  // }

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

    const keyParams = this.resolveKeyGetters(params);

    const indexParams = getEntityIndexParams(this.config, params);

    const entity = {
      __entity: {} as Entity,

      type: params.type,

      ...keyParams,

      ...indexParams,

      ...getRangeQueriesParams(params),

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

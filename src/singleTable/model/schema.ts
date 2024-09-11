/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { RegisterEntityParams, SingleTableEntity, createEntity } from './definitions';

interface EntityCache {
  params: any;
  entity: any;
}

export interface DefinedMethods<TableConfig extends SingleTableConfig, Entity extends AnyObject> {
  createEntity<Params extends RegisterEntityParams<TableConfig, Entity>>(
    params: Params,
  ): SingleTableEntity<TableConfig, Entity, Params>;
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

  private registerEntity<
    Entity extends AnyObject,
    Params extends RegisterEntityParams<TableConfig, Entity>,
  >(params: Params): SingleTableEntity<TableConfig, Entity, Params> {
    this.registerType(params.type);

    const entity = createEntity<SingleTableConfig, Entity, Params>(this.config, params);

    // this.cacheEntity({ entity, params });

    return entity as SingleTableEntity<TableConfig, Entity, Params>;
  }

  defined<Entity extends Record<string, any>>(): DefinedMethods<TableConfig, Entity> {
    return {
      createEntity: this.registerEntity.bind(this) as DefinedMethods<
        TableConfig,
        Entity
      >['createEntity'],
    };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableParams } from 'singleTable/adaptor';

import { AnyFunction, AnyObject } from 'types';

import { getId } from 'utils/id';
import {
  createCollection,
  createEntity,
  CreatePartitionParams,
  ExtendableCollection,
  ExtendableSingleTableEntity,
  Partition,
  PartitionCollection,
  PartitionCollectionParams,
  PartitionEntityCreateParams,
  PartitionIndexParams,
  RegisterEntityParams,
  resolveKeySwaps,
  SingleTableEntity,
} from './definitions';
import { type From, SchemaFrom } from './from';

interface EntityCache {
  params: any;
  entity: any;
}

export interface DefinedMethods<
  TableConfig extends SingleTableParams,
  Entity extends AnyObject,
> {
  as<Params extends RegisterEntityParams<TableConfig, Entity>>(
    params: Params,
  ): SingleTableEntity<TableConfig, Entity, Params>;
}

type EnsureIndexed<TableConfig extends SingleTableParams> = TableConfig & {
  indexes: NonNullable<TableConfig['indexes']>;
};

export class SingleTableSchema<TableConfig extends SingleTableParams> {
  private entityTypes: Set<string>;

  private configCache: Map<string, EntityCache>;

  private partitionUsages: Set<string>;

  private config: TableConfig;

  private repoCreator: SchemaFrom<TableConfig>;

  constructor(config: TableConfig) {
    this.entityTypes = new Set();
    this.partitionUsages = new Set();
    this.configCache = new Map();

    this.repoCreator = new SchemaFrom(config);

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

  private registerPartitionUsage(name: string, entry: string): void {
    const key = `${name}___${entry}`;

    if (this.partitionUsages.has(key))
      throw new Error(`Entry ${entry} already used for partition ${name}`);

    this.partitionUsages.add(key);
  }

  private bind<Fn extends AnyFunction>(fn: Fn): Fn {
    return fn.bind(this) as Fn;
  }

  private buildPartitionIndexUsage<
    Params extends CreatePartitionParams<EnsureIndexed<TableConfig>> & { index: string },
  >(params: Params): Partition<EnsureIndexed<TableConfig>, Params>['use'] {
    const creator = ((entry) => {
      this.registerPartitionUsage(params.name, entry as string);

      if (!params.entries[entry as keyof typeof params.entries])
        throw new Error(`[PARTITION:${params.name}] - Bad entry referenced on usage`);

      type IndexParams<Entity> = PartitionIndexParams<Params, typeof entry, Entity>;

      return {
        create: <Entity>() => ({
          index: (
            {
              paramMatch,
              ...indexParams
            }: IndexParams<Entity> = {} as IndexParams<Entity>,
          ) => ({
            ...indexParams,

            index: params.index,

            ...resolveKeySwaps({
              paramMatch,
              getPartitionKey: params.getPartitionKey,
              getRangeKey: params.entries[entry as keyof typeof params.entries],
            }),
          }),
        }),
      };
    }) as Partition<EnsureIndexed<TableConfig>, Params>['use'];

    return this.bind(creator);
  }

  private buildPartitionEntityUsage<Params extends CreatePartitionParams<TableConfig>>(
    params: Params,
  ): Partition<TableConfig, Params>['use'] {
    const creator = ((entry) => {
      this.registerPartitionUsage(params.name, entry as string);

      if (!params.entries[entry as keyof typeof params.entries])
        throw new Error(`[PARTITION:${params.name}] - Bad entry referenced on usage`);

      const register = this.bind(this.registerEntity);

      return {
        create: <Entity extends AnyObject>() => ({
          entity: ({
            paramMatch,
            ...entityParams
          }: PartitionEntityCreateParams<TableConfig, Entity, Params, typeof entry>) =>
            register({
              ...entityParams,

              ...resolveKeySwaps({
                paramMatch,
                getPartitionKey: params.getPartitionKey,
                getRangeKey: params.entries[entry as keyof typeof params.entries],
              }),
            } as any),
        }),
      };
    }) as Partition<TableConfig, Params>['use'];

    return this.bind(creator);
  }

  private buildPartitionUsage<Params extends CreatePartitionParams<TableConfig>>(
    params: Params,
  ): Partition<TableConfig, Params>['use'] {
    const isIndex = 'index' in params && this.config.indexes?.[`${params.index}`];

    if (isIndex) return this.buildPartitionIndexUsage(params as any);

    return this.buildPartitionEntityUsage(params);
  }

  createPartition<Params extends CreatePartitionParams<TableConfig>>(
    params: Params,
  ): Partition<TableConfig, Params> {
    const partition = {
      ...params,

      id: getId('UUID'),

      use: this.buildPartitionUsage(params),

      collection: () => ({} as any),
    } as Partition<TableConfig, Params>;

    return {
      ...partition,

      collection: ((collectionParams: any) =>
        this.createCollection({
          ...collectionParams,
          partition,
        })) as any as Partition<TableConfig, Params>['collection'],
    };
  }

  createCollection<Params extends PartitionCollectionParams<TableConfig>>(
    params: Params,
  ): PartitionCollection<Params> {
    return createCollection(params);
  }

  private registerEntity<
    Entity extends AnyObject,
    Params extends RegisterEntityParams<TableConfig, Entity>,
  >(params: Params): SingleTableEntity<TableConfig, Entity, Params> {
    this.registerType(params.type);

    const entity = createEntity<SingleTableParams, Entity, Params>(this.config, params);

    this.cacheEntity({ entity, params });

    return entity as SingleTableEntity<TableConfig, Entity, Params>;
  }

  createEntity<Entity extends Record<string, any>>(): DefinedMethods<
    TableConfig,
    Entity
  > {
    return {
      as: this.registerEntity.bind(this) as DefinedMethods<TableConfig, Entity>['as'],
    };
  }

  getEntityByType(type: string): ExtendableSingleTableEntity | undefined {
    return this.configCache.get(type)?.entity;
  }

  from<Target extends ExtendableSingleTableEntity | ExtendableCollection>(
    target: Target,
  ): From<Target, TableConfig> {
    return this.repoCreator.from(target);
  }
}

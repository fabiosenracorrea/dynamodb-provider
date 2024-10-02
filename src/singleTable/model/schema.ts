/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyFunction, AnyObject } from 'types';

import { getId } from 'utils/id';
import {
  RegisterEntityParams,
  SingleTableEntity,
  createEntity,
  CreatePartitionParams,
  Partition,
  PartitionIndexParams,
  resolveKeySwaps,
  PartitionEntityCreateParams,
} from './definitions';

interface EntityCache {
  params: any;
  entity: any;
}

export interface DefinedMethods<TableConfig extends SingleTableConfig, Entity extends AnyObject> {
  entity<Params extends RegisterEntityParams<TableConfig, Entity>>(
    params: Params,
  ): SingleTableEntity<TableConfig, Entity, Params>;
}

type EnsureIndexed<TableConfig extends SingleTableConfig> = TableConfig & {
  indexes: NonNullable<TableConfig['indexes']>;
};

export class SingleTableSchema<TableConfig extends SingleTableConfig> {
  private entityTypes: Set<string>;

  private configCache: Map<string, EntityCache>;

  private partitionUsages: Set<string>;

  private config: TableConfig;

  constructor(config: TableConfig) {
    this.entityTypes = new Set();
    this.partitionUsages = new Set();
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

      return {
        create: <Entity>() => ({
          index: ({
            paramMatch,
            ...indexParams
          }: PartitionIndexParams<Params, typeof entry, Entity>) => ({
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
    return {
      ...params,

      id: getId('UUID'),

      use: this.buildPartitionUsage(params),
    };
  }

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

  create<Entity extends Record<string, any>>(): DefinedMethods<TableConfig, Entity> {
    return {
      entity: this.registerEntity.bind(this) as DefinedMethods<TableConfig, Entity>['entity'],

      // collection, partition?
    };
  }
}

// const schema = new SingleTableSchema({
//   partitionKey: 'hello',
//   rangeKey: 'key',

//   table: 'my-table',

//   typeIndex: {
//     name: 'TypeIndexName',
//     partitionKey: '_type',
//     rangeKey: '_ts',
//   },

//   expiresAt: '_expires',

//   indexes: {
//     someIndex: {
//       partitionKey: '_indexHash1',
//       rangeKey: '_indexRange1',
//     },

//     anotherIndex: {
//       partitionKey: '_indexHash2',
//       rangeKey: '_indexRange2',
//     },

//     yetAnotherIndex: {
//       partitionKey: '_indexHash3',
//       rangeKey: '_indexRange3',
//     },
//   },
// });

// type User = {
//   name: string;
//   id: string;
//   email: string;
//   address: string;
//   dob: string;
//   createdAt: string;
//   updatedAt?: string;
// };

// const user = schema.create<User>().entity({
//   type: 'USER',

//   getPartitionKey: ({ id }: { id: string }) => ['USER', id],

//   getRangeKey: () => ['#DATA'],

// });

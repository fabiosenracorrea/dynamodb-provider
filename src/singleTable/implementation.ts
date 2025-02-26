import { AnyObject, StringKey } from 'types';

import { DBSet, QueryResult, TransactionConfig } from 'provider';

import { omit } from 'utils/object';
import {
  SingleTableMethods,
  SingleTableParams,
  ListItemTypeParams,
  ListItemTypeResult,
  SingleTableBatchGetParams,
  SingleTableQueryParams,
  SingleTableCreateItemParams,
  SingleTableGetParams,
  SingleTableTransactionConfig,
  SingleTableUpdateParams,
  SingleTableDeleteParams,
  SingleTableTransactConfigGenerator,
} from './adaptor';
import { SingleTableSchema as FullSingleTableSchema } from './model';
import { SingleTableFromEntity } from './fromEntity';
import { SingleTableFromCollection } from './fromCollection';

type SingleTableSchema<SingleParams extends SingleTableParams> = {
  /**
   * Create a repository-like structure from a Collection to easily extract it joined.
   *
   * This could be useful to easily extract item collections and join them.
   *
   * Let's say you have a Kanban app in which the following entries are present in your DB:
   *
   * - PROJECT
   * - TAGS
   * - TASKS
   * - TASK SUBTASKS
   * - TASK TAGS
   *
   * All of which are under the same PROJECT#id partitionKey
   *
   * Create its Collection and the relevant methods by passing it to this method
   * ```
   */
  fromCollection: SingleTableFromCollection<SingleParams>['fromCollection'];

  /**
   * Create a repository-like structure from an entity, easily execute CRUD methods on said entity
   *
   * Every key param will be inferred and queries will be available to directly call
   */
  fromEntity: SingleTableFromEntity<SingleParams>['fromEntity'];

  /**
   * Create a Collection to easily showcase your entities relations and define pre-joined extractions
   */
  createCollection: FullSingleTableSchema<SingleParams>['createCollection'];

  /**
   * Define a Partition more than 1 of your entities share
   *
   * Example: You might have an USER partition with a similar use case:
   *
   * ```ts
   *  const partition = table.schema.createPartition({
   *     name: 'USER_PARTITION',
   *     getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
   *     entries: {
   *       data: () => [`#DATA`],
   *       permissions: () => [`#PERMISSIONS`],
   *       loginAttempts: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
   *     },
   *   });
   * ```
   *
   * By creating a partition, you centralize each Key getter and can easily create the relevant entities out of it
   */
  createPartition: FullSingleTableSchema<SingleParams>['createPartition'];

  /**
   * Define an Entity of your database
   *
   * This can be thought of similar to a TABLE on a regular relational database
   *
   * To ensure type-safety and its checks, this method requires you to pass the Entity Type
   * to it, and only then subsequently call `withParams` to actually execute the creation.
   *
   * ```ts
   *   const User = table.schema.createEntity<UserType>().withParams({
   *     // ... entity creation params
   *   })
   * ```
   */
  createEntity: FullSingleTableSchema<SingleParams>['createEntity'];

  /**
   * A **low level** wrapper to retrieve the entity registered entity for a given type
   *
   * Normally this would be necessary if you want to perform generic operations not knowing ahead of time
   * what type you have
   *
   * Example: Say you have a dynamoDB stream handler that fixes any index partition that may be out-of-sync due to a partial update not containing all
   * the properties for a composite index key (if key if status+date and you provide the status, the index won't be updated correctly)
   *
   * You could then use the stream to read the _type of the modified type, get its entity and check for index presence + values
   */
  getEntityByType: FullSingleTableSchema<SingleParams>['getEntityByType'];
};

export class SingleTable<SingleParams extends SingleTableParams> {
  private methods: SingleTableMethods<SingleParams>;

  private fullSchema: FullSingleTableSchema<SingleParams>;

  public schema: SingleTableSchema<SingleParams>;

  private entityRepo: SingleTableFromEntity<SingleParams>;

  private collectionRepo: SingleTableFromCollection<SingleParams>;

  config: Omit<SingleParams, 'dynamodbProvider'>;

  constructor(params: SingleParams) {
    this.config = omit(params, ['dynamodbProvider']);

    this.methods = new SingleTableMethods(params);

    this.fullSchema = new FullSingleTableSchema(params);

    this.entityRepo = new SingleTableFromEntity(params);
    this.collectionRepo = new SingleTableFromCollection(params);

    this.schema = {
      createEntity: this.fullSchema.createEntity.bind(this.fullSchema),
      createPartition: this.fullSchema.createPartition.bind(this.fullSchema),
      createCollection: this.fullSchema.createCollection.bind(this.fullSchema),
      getEntityByType: this.fullSchema.getEntityByType.bind(this.fullSchema),

      fromCollection: this.collectionRepo.fromCollection.bind(this.collectionRepo),

      fromEntity: this.entityRepo.fromEntity.bind(this.entityRepo),
    };
  }

  async get<Entity = AnyObject>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined> {
    return this.methods.get(params);
  }

  async create<Entity>(params: SingleTableCreateItemParams<Entity, SingleParams>): Promise<Entity> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.methods.create(params as any);
  }

  async update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, SingleParams, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.methods.update(params);
  }

  async delete<Entity = AnyObject>(params: SingleTableDeleteParams<Entity>): Promise<void> {
    await this.methods.delete(params);
  }

  async batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableBatchGetParams<Entity, PKs>,
  ): Promise<Entity[]> {
    return this.methods.batchGet<Entity, PKs>(params);
  }

  async query<Entity = AnyObject>(
    params: SingleTableQueryParams<Entity, SingleParams>,
  ): Promise<QueryResult<Entity>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.methods.query(params as any);
  }

  /**
   *  Useful if you need to merge transactions from other tables
   */
  ejectTransactParams(configs: (SingleTableTransactionConfig | null)[]): TransactionConfig[] {
    return this.methods.ejectTransactParams(configs);
  }

  async executeTransaction(
    configs: (SingleTableTransactionConfig<SingleParams> | null)[],
  ): Promise<void> {
    return this.methods.executeTransaction(configs);
  }

  generateTransactionConfigList<Item extends AnyObject>(
    items: Item[],
    generator: SingleTableTransactConfigGenerator<Item, SingleParams>,
  ): SingleTableTransactionConfig<SingleParams, Item>[] {
    return this.methods.generateTransactionConfigList(
      items,
      generator,
    ) as SingleTableTransactionConfig<SingleParams, Item>[];
  }

  createSet<T extends string[] | number[]>(
    items: T,
  ): DBSet<T[number], SingleParams['dynamodbProvider']['target']> {
    return this.methods.createSet(items);
  }

  async listAllFromType<Entity = AnyObject>(type: string): Promise<Entity[]> {
    return this.methods.listAllFromType(type);
  }

  async listType<Entity = AnyObject>(
    params: ListItemTypeParams,
  ): Promise<ListItemTypeResult<Entity>> {
    return this.methods.listType(params);
  }

  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined {
    return this.methods.findTableItem(items, type);
  }

  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[] {
    return this.methods.filterTableItens(items, type);
  }
}

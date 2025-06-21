import { SingleTableParams } from 'singleTable/adaptor';

import { SingleTableSchema } from './schema';

export type SingleTableSchemaType<SingleParams extends SingleTableParams> = {
  /**
   * [Deprecated soon] Prefer `from` going forward.
   *
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
  fromCollection: SingleTableSchema<SingleParams>['fromCollection'];

  /**
   * [Deprecated soon] Prefer `from` going forward.
   *
   * Create a repository-like structure from an entity, easily execute CRUD methods on said entity
   *
   * Every key param will be inferred and queries will be available to directly call
   */
  fromEntity: SingleTableSchema<SingleParams>['fromEntity'];

  /**
   * Create a repository-like structure for an entity or collection, easily.
   *
   * A better and more direct way than using `fromEntity` and `fromCollection`
   */
  from: SingleTableSchema<SingleParams>['from'];

  /**
   * Create a Collection to easily showcase your entities relations and define pre-joined extractions
   */
  createCollection: SingleTableSchema<SingleParams>['createCollection'];

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
  createPartition: SingleTableSchema<SingleParams>['createPartition'];

  /**
   * Define an Entity of your database
   *
   * This can be thought of similar to a TABLE on a regular relational database
   *
   * To ensure type-safety and its checks, this method requires you to pass the Entity Type
   * to it, and only then subsequently call `as` to actually execute the creation.
   *
   * ```ts
   *   const User = table.schema.createEntity<UserType>().as({
   *     // ... entity creation params
   *   })
   * ```
   */
  createEntity: SingleTableSchema<SingleParams>['createEntity'];

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
  getEntityByType: SingleTableSchema<SingleParams>['getEntityByType'];
};

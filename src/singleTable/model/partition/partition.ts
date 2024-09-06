/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableParams } from 'singleTable/adaptor';

import { FirstParameter } from 'types';

import { KeyGetter } from '../key';

type IndexParams<TableConfig extends SingleTableParams> = undefined extends TableConfig['indexes']
  ? unknown
  : {
      /**
       * Refer to which of your table indexes this partition will exist
       *
       * An Index partition can't create an entity directly, only dump the index
       * into an entity configuration
       */
      index?: keyof TableConfig['indexes'];
    };

type PartitionCreationParams<TableConfig extends SingleTableParams> = IndexParams<TableConfig> & {
  /**
   * Unique name of the partition
   */
  name: string;

  /**
   * A function that builds the partition key
   *
   * Every single entity of this partition will use this getter to build it's partition value
   *
   * Do not worry about if the param name is not present on some of the entities, you can map the correct key
   * when creating an entity
   *
   * @example
   * ```ts
   * {
   *   getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId]
   * }
   * ```
   */
  getPartitionKey: KeyGetter<any>;

  /**
   * Each and every entity inside this partition
   *
   * This definition **does not** define relations, nesting, etc
   *
   * @example say we are creating the USER partition
   * ```ts
   * {
   *   entries: {
   *     permissions: ({ permissionId }: { permissionId }) => ['PERMISSION', permissionId],
   *
   *     loginAttempts: ({ timestamp }: { timestamp }) => ['LOGIN_ATTEMPT', timestamp],
   *   }
   * }
   * ```
   */
  entries: {
    [entryName: string]: KeyGetter<any>;
  };
};

type EntryOptions<Params extends PartitionCreationParams<any>> = keyof Params['entries'];

type PartitionDumpParams<
  Params extends PartitionCreationParams<any>,
  Entry extends EntryOptions<Params>,
> = Params extends {
  index: any;
}
  ? {
      /**
       * Build an index that will be passed to an entity
       *
       * Declare the type to properly indicate key param matches
       */
      useIndex<T>(config?: { paramMatch }): IndexConfigProperlyTyped;
    }
  : {};

type Partition<
  Params extends PartitionCreationParams<any>,
  KeyParams = FirstParameter<Params['getPartitionKey']>,
> = Params & {
  id: string;

  getPartitionKey: Params['getPartitionKey'];

  // build<Entity>(): {
  //   partitionKeyGetter<EntityKeys extends keyof Entity>(
  //     ...params: KeyParams extends undefined ? [] : [{ [Key in keyof KeyParams]: EntityKeys }]
  //   ): KeyGetter<KeyParams extends undefined ? undefined : Pick<Entity, EntityKeys>>;
  // };

  define(entry: EntryOptions<Params>): PartitionDumpParams<Params>;
};

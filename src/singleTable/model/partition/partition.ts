/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue } from 'singleTable/adaptor/definitions';

import { SingleTableParams } from 'singleTable/adaptor';

import { SingleIndex } from '../indexes';
import { FullPartitionKeys, ParamMatchArgs } from '../keySwap';

type CreatePartitionIndexParams<TableConfig extends SingleTableParams> =
  undefined extends TableConfig['indexes']
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

type PartitionCreationParams<TableConfig extends SingleTableParams> =
  CreatePartitionIndexParams<TableConfig> & {
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
    getPartitionKey: (p: any) => KeyValue;

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
      [entryName: string]: (p: any) => KeyValue;
    };
  };

type EntryOptions<Params extends PartitionCreationParams<any>> = keyof Params['entries'];

type PartitionKeyGetters<
  Params extends PartitionCreationParams<any>,
  Entry extends EntryOptions<Params>,
> = {
  getPartitionKey: Params['getPartitionKey'];
  getRangeKey: Params['entries'][Entry];
};

type PartitionIndexParams<
  Params extends PartitionCreationParams<any>,
  Entry extends EntryOptions<Params>,
  Entity,
> = Omit<SingleIndex<any, any>, 'index' | 'getPartitionKey' | 'getRangeKey'> &
  ParamMatchArgs<PartitionKeyGetters<Params, Entry>, Entity>;

type PartitionIndex<
  Params extends PartitionCreationParams<any> & { index: any },
  Entry extends EntryOptions<Params>,
  Entity,
  CreationParams extends PartitionIndexParams<Params, Entry, Entity>,
> = Omit<CreationParams, 'paramMatch'> &
  FullPartitionKeys<PartitionKeyGetters<Params, Entry>, Entity, CreationParams> & {
    index: Params['index'];
  };

type PartitionDumpParams<
  Params extends PartitionCreationParams<any>,
  Entry extends EntryOptions<Params>,
  Entity,
> = Params extends {
  index: any;
}
  ? {
      /**
       * Build an index that will be passed to an entity
       *
       * Declare the type to properly indicate key param matches
       */
      index<T extends PartitionIndexParams<Params, Entry, Entity>>(
        config?: T,
      ): PartitionIndex<Params, Entry, Entity, T>;
    }
  : unknown;

type Partition<Params extends PartitionCreationParams<any>> = Params & {
  id: string;

  /**
   * @param entry One of this partition's `entries`
   *
   * Chose one of the entries to build its reference, Index or Entity,
   * depending on the type of the partition
   */
  use<Entry extends EntryOptions<Params>>(
    entry: Entry,
  ): {
    /**
     * Initiate an instance the partition for a given Type
     *
     * This ensures type-safe references
     */
    create<T = void>(
      ...params: T extends void ? ['You must provided a type parameter'] : []
    ): PartitionDumpParams<Params, Entry, T>;
  };
};

function createPartition<Params extends PartitionCreationParams<any>>(
  params: Params,
): Partition<Params> {
  return params as any;
}

const part = createPartition({
  name: 'hello',

  index: 'hello',

  getPartitionKey: ({ userId }: { userId: string }) => ['HELLO', userId],

  entries: {
    hello: () => ['HAHA'],

    permissions: () => ['PERMISSIONS'],

    logins: ({ timestamp }: { timestamp: string }) => ['LOGIN', timestamp],
  },
});

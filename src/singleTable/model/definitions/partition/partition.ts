/* eslint-disable @typescript-eslint/no-explicit-any */

import { CreatePartitionParams, PartitionEntry } from './params';
import { PartitionIndexCreator } from './indexPartition';

type PartitionDumpParams<
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
  Entity,
> = Params extends {
  index: any;
}
  ? PartitionIndexCreator<Params, Entry, Entity>
  : {
      entity(): unknown;
      // add entity creation params from entity
    };

type Partition<Params extends CreatePartitionParams<any>> = Params & {
  id: string;

  /**
   * @param entry One of this partition's `entries`
   *
   * Chose one of the entries to build its reference, Index or Entity,
   * depending on the type of the partition
   */
  use<Entry extends PartitionEntry<Params>>(
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

// function createPartition<Params extends PartitionCreationParams<any>>(
//   params: Params,
// ): Partition<Params> {
//   return params as any;
// }

// const part = createPartition({
//   name: 'hello',

//   index: 'hello',

//   getPartitionKey: ({ userId }: { userId: string }) => ['HELLO', userId],

//   entries: {
//     hello: () => ['HAHA'],

//     permissions: () => ['PERMISSIONS'],

//     logins: ({ timestamp }: { timestamp: string }) => ['LOGIN', timestamp],
//   },
// });

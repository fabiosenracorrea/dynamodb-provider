/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import { SingleTableConfig } from 'singleTable/adaptor';

import { CreatePartitionParams, PartitionEntry } from './params';
import { PartitionIndexCreator } from './indexPartition';
import { PartitionEntityCreator } from './entityPartition';

type PartitionDumpParams<
  TableConfig extends SingleTableConfig,
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
  Entity,
> = Params extends {
  index: any;
}
  ? PartitionIndexCreator<Params, Entry, Entity>
  : PartitionEntityCreator<TableConfig, Params, Entry, Entity>;

type Partition<
  TableConfig extends SingleTableConfig,
  Params extends CreatePartitionParams<any>,
> = Params & {
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
    ): PartitionDumpParams<TableConfig, Params, Entry, T>;
  };
};

// function createPartition<Params extends CreatePartitionParams<any>>(
//   params: Params,
// ): Partition<SingleTableConfig, Params> {
//   return params as any;
// }

// const part = createPartition({
//   name: 'hello',

//   getPartitionKey: ({ userId }: { userId: string }) => ['HELLO', userId],

//   entries: {
//     hello: () => ['HAHA'],

//     permissions: () => ['PERMISSIONS'],

//     logins: ({ timestamp }: { timestamp: string }) => ['LOGIN', timestamp],
//   },
// });

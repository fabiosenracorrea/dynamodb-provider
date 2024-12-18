/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';
import { CreatePartitionParams, PartitionEntry } from './params';
import { PartitionIndexCreator } from './indexPartition';
import { PartitionEntityCreator } from './entityPartition';

type PartitionDumpParams<
  TableConfig extends SingleTableConfig,
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
  Entity extends AnyObject,
> = Params extends {
  index: any;
}
  ? PartitionIndexCreator<Params, Entry, Entity>
  : PartitionEntityCreator<TableConfig, Params, Entry, Entity>;

export type Partition<
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
    create<
      T extends AnyObject,
    >(): // ...params: T extends void ? ['You must provided a type parameter'] : []
    PartitionDumpParams<TableConfig, Params, Entry, T>;
  };
};

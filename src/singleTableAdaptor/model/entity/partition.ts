import { AnyObject } from 'types/general';
import { KeyGetter } from '../key';
import { Partition, PartitionCreationParams } from '../partition';

type GenericPartition<PartitionParams extends AnyObject | undefined> = Partition<
  PartitionCreationParams & { getPartitionKey: PartitionParams }
>;

export type PartitionRefParams<PartitionParams extends AnyObject | undefined> =
  | {
      getPartitionKey: KeyGetter<PartitionParams>;
      partition?: never;
    }
  | {
      getPartitionKey?: never;
      partition: GenericPartition<PartitionParams>;
    };

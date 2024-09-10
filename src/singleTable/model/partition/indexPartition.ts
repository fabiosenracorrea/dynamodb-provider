/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleIndex } from '../indexes';
import { FullPartitionKeys, ParamMatchArgs } from '../keySwap';

import { CreatePartitionParams, PartitionEntry, PartitionKeyGetters } from './params';

type PartitionIndexParams<
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
  Entity,
> = Omit<SingleIndex<any, any>, 'index' | 'getPartitionKey' | 'getRangeKey'> &
  ParamMatchArgs<PartitionKeyGetters<Params, Entry>, Entity>;

export type PartitionIndex<
  Params extends CreatePartitionParams<any> & { index: any },
  Entry extends PartitionEntry<Params>,
  Entity,
  CreationParams extends PartitionIndexParams<Params, Entry, Entity>,
> = Omit<CreationParams, 'paramMatch'> &
  FullPartitionKeys<PartitionKeyGetters<Params, Entry>, Entity, CreationParams> & {
    index: Params['index'];
  };

export type PartitionIndexCreator<
  Params extends CreatePartitionParams<any> & { index: any },
  Entry extends PartitionEntry<Params>,
  Entity,
> = {
  /**
   * Build an index that will be passed to an entity
   *
   * Declare the type to properly indicate key param matches
   */
  index<T extends PartitionIndexParams<Params, Entry, Entity>>(
    config?: T,
  ): PartitionIndex<Params, Entry, Entity, T>;
};

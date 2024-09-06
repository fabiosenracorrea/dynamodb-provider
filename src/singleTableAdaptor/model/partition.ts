/* eslint-disable @typescript-eslint/no-explicit-any */
import { getId } from 'utils/id';

import { KeyGetter } from './key';
import { TableIndex } from '../config';

export interface PartitionCreationParams {
  name: string;
  getPartitionKey: KeyGetter<any>;

  // have a 'buildIndex' fn on return
  index?: TableIndex;
}

export interface Partition<
  Params extends PartitionCreationParams,
  KeyParams = Parameters<Params['getPartitionKey']>[0],
> extends Pick<Params, 'index'> {
  name: string;
  id: string;
  getPartitionKey: Params['getPartitionKey'];

  build<Entity>(): {
    partitionKeyGetter<EntityKeys extends keyof Entity>(
      ...params: KeyParams extends undefined ? [] : [{ [Key in keyof KeyParams]: EntityKeys }]
    ): KeyGetter<KeyParams extends undefined ? undefined : Pick<Entity, EntityKeys>>;
  };
}

/*
  Why?
    Ensures intellisense across our project
      (
        defining a normal fn => Keyvalue getter to ref it down to our register entity would work,
        but like this we ensure a pattern and make it easier to upgrade our complexity later on
      )
*/
export function createPartition<Params extends PartitionCreationParams>(
  params: Params,
): Partition<Params> {
  return {
    ...params,

    id: getId('UUID'),

    build: (() => ({
      partitionKeyGetter:
        (conversionParams = {}) =>
        (entity = {}) =>
          params.getPartitionKey(
            Object.fromEntries(
              Object.entries(conversionParams).map(([partitionKey, entityKey]) => [
                partitionKey,
                entity[entityKey as keyof typeof entity],
              ]),
            ),
          ),
    })) as unknown as Partition<Params>['build'],
  };
}

/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types/general';

import { Partition, PartitionCreationParams } from '../partition';

import { BaseCollectionConfig } from './collection';
import { RangeQuery } from './range';
import { IndexMapping } from './indexes';
import { AutoGenFieldConfig } from './autoGen';
import { KeyValue } from '../../config';

type PartitionRefParams<Entity extends AnyObject = AnyObject> =
  | {
      getPartitionKey: (...params: Entity[]) => KeyValue;

      partition?: never;
    }
  | {
      getPartitionKey?: never;

      partition: Partition<
        Omit<PartitionCreationParams, 'getPartitionKey'> & {
          getPartitionKey: (...params: Entity[]) => KeyValue;
        }
      >;
    };

type RawEntityRegisterParams<Entity extends AnyObject = AnyObject> = {
  type: Entity['_type'] extends string ? Entity['_type'] : string;

  getRangeKey: (...params: Entity[]) => KeyValue;
} & PartitionRefParams<Entity>;

export type RegisterEntityParams<Entity extends AnyObject = AnyObject> = {
  indexes?: IndexMapping;

  rangeQueries?: RangeQuery;

  collectionEntities?: BaseCollectionConfig;

  autoGen?: AutoGenFieldConfig<Entity>;
} & RawEntityRegisterParams<Entity>;

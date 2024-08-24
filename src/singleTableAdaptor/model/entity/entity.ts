/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, IfAny } from 'types/general';

import { CollectionConfigProps } from './collection';
import { RangeQueryConfigProps } from './range';
import { Partition } from '../partition';
import { RegisterEntityParams } from './register';
import { FullKeyGetter } from '../key';
import { IndexProps } from './indexResult';
import { CRUDProps } from './crud';

type PartitionGetter<Params extends RegisterEntityParams<any>> = NonNullable<
  Params['partition'] extends Partition<any>
    ? Params['partition']['getPartitionKey']
    : Params['getPartitionKey']
>;

export type RawEntity<Entity extends AnyObject, Params extends RegisterEntityParams<Entity>> = {
  type: Entity['_type'] extends string ? IfAny<Entity['_type'], string, Entity['_type']> : string;

  getPartitionKey: PartitionGetter<Params>;

  getRangeKey: Params['getRangeKey'];

  getKey: FullKeyGetter<
    Parameters<PartitionGetter<Params>>[0],
    Parameters<Params['getRangeKey']>[0]
  >;

  __entity: Entity;
};

export type RegisteredEntity<
  Entity extends AnyObject,
  Params extends RegisterEntityParams<Entity>,
> = RawEntity<Entity, Params> &
  CRUDProps<Entity, Params> &
  IndexProps<Entity, Params> &
  CollectionConfigProps<Params['collectionEntities']> &
  RangeQueryConfigProps<Params['rangeQueries']>;

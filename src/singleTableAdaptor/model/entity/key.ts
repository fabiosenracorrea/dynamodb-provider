/* eslint-disable @typescript-eslint/no-explicit-any */
import { FullKeyGetter } from '../key';
import { Partition } from '../partition';
import { RegisterEntityParams } from './register';

type PartitionGetter<Params extends RegisterEntityParams<any>> = NonNullable<
  Params['partition'] extends Partition<any>
    ? Params['partition']['getPartitionKey']
    : Params['getPartitionKey']
>;

export type EntityKeyGetters<Params extends RegisterEntityParams<any>> = {
  getPartitionKey: PartitionGetter<Params>;

  getRangeKey: Params['getRangeKey'];

  getKey: FullKeyGetter<
    Parameters<PartitionGetter<Params>>[0],
    Parameters<Params['getRangeKey']>[0]
  >;
};

export type EntityKeyParams<Params extends RegisterEntityParams<any>> = Parameters<
  EntityKeyGetters<Params>['getKey']
>[0] extends undefined
  ? object
  : Parameters<EntityKeyGetters<Params>['getKey']>[0];

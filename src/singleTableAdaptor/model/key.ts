import { AnyObject } from 'types/general';
import { KeyValue, SingleTableKeyReference } from '../config';

export type KeyGetter<Params extends AnyObject | undefined> = Params extends undefined
  ? () => KeyValue
  : (params: Params) => KeyValue;

// export type FullKeyGetter<
//   PartitionParams extends AnyObject | undefined,
//   RangeParams extends AnyObject | undefined,
// > = PartitionParams extends undefined
//   ? RangeParams extends undefined
//     ? () => SingleTableKeyReference
//     : (params: RangeParams) => SingleTableKeyReference
//   : RangeParams extends undefined
//   ? (params: PartitionParams) => SingleTableKeyReference
//   : (params: PartitionParams & RangeParams) => SingleTableKeyReference;

export type FullKeyGetter<PartitionParams, RangeParams> = PartitionParams extends undefined
  ? RangeParams extends undefined
    ? () => SingleTableKeyReference
    : (params: RangeParams) => SingleTableKeyReference
  : RangeParams extends undefined
  ? (params: PartitionParams) => SingleTableKeyReference
  : (params: PartitionParams & RangeParams) => SingleTableKeyReference;

import { ExpiresAtParams } from 'singleTable/adaptor/definitions';
import type { KeyParams, AnyEntity, AtomicIndexParams } from 'singleTable/model';
import type {
  BatchCreateParams,
  BatchDeleteParams,
  BatchListItemsArgs,
  BatchMutateParams,
  GetItemParams,
  UpdateParams,
  DeleteParams,
} from 'provider/utils';
import { FirstParameter, PrettifyObject, SafeObjMerge } from 'types';

type NoKeyParam<Registered extends AnyEntity> = FirstParameter<
  Registered['getKey']
> extends undefined
  ? true
  : false;

export type EntityGetParams<Registered extends AnyEntity> =
  NoKeyParam<Registered> extends true
    ? [Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'>?]
    : [
        Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'> &
          KeyParams<Registered>,
      ];

export type EntityBatchGetParams<Registered extends AnyEntity> = Omit<
  BatchListItemsArgs<Registered['__entity']>,
  'table' | 'keys'
> & {
  keys: Array<KeyParams<Registered>>;
};

type EntityCreationItem<Registered extends AnyEntity> = FirstParameter<
  Registered['getCreationParams']
>;

export type EntityBatchCreateParams<Registered extends AnyEntity> = Omit<
  BatchCreateParams<Registered['__entity']>,
  'table' | 'items'
> & {
  items: Array<EntityCreationItem<Registered>>;
};

export type EntityBatchDeleteParams<Registered extends AnyEntity> = Omit<
  BatchDeleteParams<Registered['__entity']>,
  'table' | 'items'
> & {
  items: Array<KeyParams<Registered>>;
};

export type EntityBatchMutateParams<Registered extends AnyEntity> = Omit<
  BatchMutateParams<Registered['__entity']>,
  'table' | 'creations' | 'deletes'
> & {
  creations?: Array<EntityCreationItem<Registered>>;
  deletes?: Array<KeyParams<Registered>>;
};

export type DeleteEntityParams<Registered extends AnyEntity> =
  NoKeyParam<Registered> extends true
    ? [Omit<DeleteParams<Registered['__entity']>, 'table' | 'key'>?]
    : [
        KeyParams<Registered> &
          Omit<DeleteParams<Registered['__entity']>, 'table' | 'key'>,
      ];

export type CreateEntityParams<Registered extends AnyEntity> = Parameters<
  Registered['getCreationParams']
>;

export type UpdateEntityParams<Registered extends AnyEntity> = Omit<
  UpdateParams<Registered['__entity']>,
  'table' | 'key'
> &
  KeyParams<Registered> &
  ExpiresAtParams<Registered['__tableConfig'], true> &
  AtomicIndexParams<Registered['__tableConfig'], Registered>;

export type UpdateReturn<
  Entity extends AnyEntity,
  Params extends UpdateEntityParams<Entity>,
> = Params['returnUpdatedProperties'] extends true
  ? PrettifyObject<
      SafeObjMerge<
        Params['values'],
        Pick<
          Entity['__entity'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Params['atomicOperations'] extends any[]
            ? Params['atomicOperations'][number]['property']
            : never
        >
      >
    >
  : void;

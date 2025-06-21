import type { KeyParams, ExtendableSingleTableEntity } from 'singleTable/model';
import type {
  BatchListItemsArgs,
  GetItemParams,
  UpdateParams,
  DeleteItemParams,
} from 'provider/utils';

export type EntityGetParams<Registered extends ExtendableSingleTableEntity> = Parameters<
  Registered['getKey']
>[0] extends undefined
  ? [Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'>?]
  : [Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'> & KeyParams<Registered>];

export type EntityBatchGetParams<Registered extends ExtendableSingleTableEntity> = Omit<
  BatchListItemsArgs<Registered['__entity']>,
  'table' | 'keys'
> & {
  keys: Array<KeyParams<Registered>>;
};

export type DeleteEntityParams<Registered extends ExtendableSingleTableEntity> =
  KeyParams<Registered> & Omit<DeleteItemParams<Registered['__entity']>, 'table' | 'key'>;

export type UpdateEntityParams<Registered extends ExtendableSingleTableEntity> = Omit<
  UpdateParams<Registered['__entity']>,
  'table' | 'key'
> &
  KeyParams<Registered>;

export type CreateEntityParams<Registered extends ExtendableSingleTableEntity> = Parameters<
  Registered['getCreationParams']
>;

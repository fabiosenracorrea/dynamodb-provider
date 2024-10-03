import { EntityKeyParams, ExtendableSingleTableEntity } from 'singleTable/model';
import { BatchListItemsArgs, GetItemParams, UpdateParams, DeleteItemParams } from 'provider/utils';

export type EntityGetParams<Registered extends ExtendableSingleTableEntity> = Parameters<
  Registered['getKey']
>[0] extends undefined
  ? [Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'>?]
  : [Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'> & EntityKeyParams<Registered>];

export type EntityBatchGetParams<Registered extends ExtendableSingleTableEntity> = Omit<
  BatchListItemsArgs<Registered['__entity']>,
  'table' | 'keys'
> & {
  keys: Array<EntityKeyParams<Registered>>;
};

export type DeleteEntityParams<Registered extends ExtendableSingleTableEntity> =
  EntityKeyParams<Registered> & Omit<DeleteItemParams<Registered['__entity']>, 'table' | 'key'>;

export type UpdateEntityParams<Registered extends ExtendableSingleTableEntity> = Omit<
  UpdateParams<Registered['__entity']>,
  'table' | 'key'
> &
  EntityKeyParams<Registered>;

export type CreateEntityParams<Registered extends ExtendableSingleTableEntity> = Parameters<
  Registered['getCreationParams']
>;

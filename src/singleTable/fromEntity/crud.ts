import { EntityKeyParams, ExtendableRegisteredEntity } from 'singleTable/model';
import { BatchListItemsArgs, GetItemParams, UpdateParams } from 'provider/utils';

export type EntityGetParams<Registered extends ExtendableRegisteredEntity> = Parameters<
  Registered['getKey']
>[0] extends undefined
  ? [Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'>?]
  : [Omit<GetItemParams<Registered['__entity']>, 'table' | 'key'> & EntityKeyParams<Registered>];

export type EntityBatchGetParams<Registered extends ExtendableRegisteredEntity> = Omit<
  BatchListItemsArgs<Registered['__entity']>,
  'table' | 'keys'
> & {
  keys: Array<EntityKeyParams<Registered>>;
};

export type DeleteEntityParams<Registered extends ExtendableRegisteredEntity> =
  EntityKeyParams<Registered>;

export type UpdateEntityParams<Registered extends ExtendableRegisteredEntity> = Omit<
  UpdateParams<Registered['__entity']>,
  'table' | 'key'
> &
  EntityKeyParams<Registered>;

export type CreateEntityParams<Registered extends ExtendableRegisteredEntity> = Parameters<
  Registered['getCreationParams']
>;

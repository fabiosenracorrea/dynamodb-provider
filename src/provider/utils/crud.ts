import { StringKey } from 'types';

import { SingleConditionExpression } from './conditions';
import { AtomicOperation } from './updates';

type EntityPK<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = PKs extends StringKey<Entity> ? { [K in PKs]: Entity[K] } : Partial<Entity>;

export interface GetItemParams<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Primary key of the Item
   */
  key: EntityPK<Entity, PKs>;

  /**
   *  If set to `true`, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads.
   *
   * Default is `false`
   */
  consistentRead?: boolean;

  /**
   * Which properties should be retrieved
   *
   * Currently this only supports root-level properties
   */
  propertiesToRetrieve?: StringKey<Entity>[];
}

export interface BatchListItemsArgs<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * An array of all the items primary keys
   */
  keys: EntityPK<Entity, PKs>[];

  /**
   *  If set to `true`, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads.
   *
   * Default is `false`
   */
  consistentRead?: boolean;

  /**
   * Which properties should be retrieved
   *
   * Currently this only supports root-level properties
   */
  propertiesToRetrieve?: StringKey<Entity>[];
}

export interface CreateItemParams<Entity> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Item to create
   */
  item: Entity;
}

export interface DeleteItemParams<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Primary key of the Item
   */
  key: EntityPK<Entity, PKs>;
}

export interface UpdateParams<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Primary key of the Item
   */
  key: EntityPK<Entity, PKs>;

  /**
   * Properties you want to remove from the item
   *
   * Currently, this only supports root-level exclusions
   */
  remove?: PKs extends StringKey<Entity> ? Exclude<StringKey<Entity>, PKs>[] : StringKey<Entity>[];

  /**
   * Values to be directly added to the item
   */
  values?: PKs extends StringKey<Entity> ? Partial<Omit<Entity, PKs>> : Partial<Entity>;

  /**
   * Executes an special operations within the target.
   *
   * Currently supports:
   *
   * *Math operations*
   * - `sum` - sums only-if the prop value exists
   * - `subtract` - subtracts only-if the prop value exists
   * - `add` - this automatically considers the value to be zero if it does no exist
   *
   * *Set Operations*
   * - `add_to_set`
   * - `remove_from_set`
   *
   * *Conditional Operations*
   * - `set_if_not_exists`
   */
  atomicOperations?: AtomicOperation<PKs extends StringKey<Entity> ? Omit<Entity, PKs> : Entity>[];

  /**
   * A set of conditions you want to ensure are fulfilled
   * before the update is executed
   *
   * Currently this does not support nested conditions (parenthesis)
   */
  conditions?: SingleConditionExpression<
    PKs extends StringKey<Entity> ? Omit<Entity, PKs> : Entity
  >[];

  /**
   * Defines wether or not the call will return the properties
   * that were updated, with their new values
   *
   * Could be relevant if you are doing an atomic operation and want to know the result
   *
   * Eg. using and item to hold the unique numeric incremental ID, counts etc
   */
  returnUpdatedProperties?: boolean;
}

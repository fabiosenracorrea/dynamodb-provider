import { IsNever, StringKey } from 'types';

import { ItemExpression } from '../../expressions';
import { EntityPK } from '../types';

import { AtomicOperation } from './atomic';

export interface UpdateParams<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Primary key of the Item to update
   */
  key: EntityPK<NoInfer<Entity>, PKs>;

  /**
   * Properties you want to remove from the item
   *
   * Currently, this only supports root-level exclusions
   */
  remove?: PKs extends StringKey<Entity>
    ? (IsNever<Exclude<StringKey<Entity>, PKs>> extends true
        ? string
        : Exclude<StringKey<NoInfer<Entity>>, PKs>)[]
    : StringKey<NoInfer<Entity>>[];

  /**
   * Values to be directly added to the item
   */
  values?: PKs extends StringKey<Entity>
    ? Partial<Omit<NoInfer<Entity>, PKs>>
    : Partial<NoInfer<Entity>>;

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
  atomicOperations?: AtomicOperation<
    PKs extends StringKey<Entity> ? Omit<NoInfer<Entity>, PKs> : NoInfer<Entity>
  >[];

  /**
   * A set of conditions you want to ensure are fulfilled
   * before the update is executed
   *
   * Note that the
   *
   * Currently this does not support nested conditions (parenthesis)
   *
   * If you are doing `atomicOperations` you can also add a condition
   * to each operation inside each `if` clause
   */
  conditions?: ItemExpression<
    PKs extends StringKey<Entity> ? Omit<NoInfer<Entity>, PKs> : NoInfer<Entity>
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

import { StringKey } from 'types';

import { EntityPK } from './types';

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

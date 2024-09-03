import { StringKey } from 'types';

import { removeUndefinedProps } from 'utils/object';

import { getProjectExpressionParams } from '../projection';

import { EntityPK } from './types';
import { DynamodbExecutor } from '../dynamoDB';

export interface GetItemParams<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Primary key of the Item
   */
  key: EntityPK<NoInfer<Entity>, PKs>;

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
  propertiesToRetrieve?: (keyof NoInfer<Entity>)[];
}

export class ItemGetter extends DynamodbExecutor {
  async get<Entity, PKs extends StringKey<Entity> | unknown = StringKey<Entity>>({
    key,
    table,
    consistentRead,
    propertiesToRetrieve,
  }: GetItemParams<Entity, PKs>): Promise<Entity | undefined> {
    const { Item } = await this._getItem<Entity>(
      removeUndefinedProps({
        TableName: table,

        Key: key,

        ConsistentRead: consistentRead,

        ...getProjectExpressionParams(propertiesToRetrieve as string[]),
      }),
    );

    return Item;
  }
}

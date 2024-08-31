import { DynamoDB, GetItemOutput } from 'aws-sdk';

import { StringKey } from 'types';

import { printLog } from 'utils/log';
import { removeUndefinedProps } from 'utils/object';

import { getProjectExpressionParams } from '../projection';
import { DynamodbExecutor } from '../executor';

import { EntityPK } from './types';

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
  propertiesToRetrieve?: (keyof Entity)[];
}

export class ItemGetter extends DynamodbExecutor {
  private async _getItem<Entity>(
    params: DynamoDB.DocumentClient.GetItemInput,
  ): Promise<GetItemOutput<Entity>> {
    if (this.options.logCallParams) printLog(params, 'getItem - dynamodb call params');

    return this.dynamoDB.get(params).promise() as unknown as Promise<GetItemOutput<Entity>>;
  }

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

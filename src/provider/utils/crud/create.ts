import { AnyObject, StringKey } from 'types';

import { DBCreateItemParams, DynamodbExecutor } from '../dynamoDB';

import { ItemExpression } from '../expressions';
import { getConditionParams } from '../conditions';

export interface CreateItemParams<Entity, PKs extends StringKey<Entity> | unknown = unknown> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Item to create
   */
  item: Entity;

  /**
   * A set of conditions you want to ensure are fulfilled
   * before the creation is executed
   *
   * Currently this does not support nested conditions (parenthesis)
   *
   * This call uses the `PutItem` which by default overwrites any existing item
   *
   * The operation will fail if the condition is not fulfilled
   */
  conditions?: ItemExpression<PKs extends StringKey<Entity> ? Omit<Entity, PKs> : Entity>[];
}

export class ItemCreator extends DynamodbExecutor {
  getCreateParams<Entity>({
    item,
    table,
    conditions,
  }: CreateItemParams<Entity>): DBCreateItemParams['input'] {
    return {
      TableName: table,

      Item: item as AnyObject,

      ...getConditionParams(conditions),
    };
  }

  async create<Entity>(params: CreateItemParams<Entity>): Promise<Entity> {
    await this._insertItem(this.getCreateParams(params));

    return params.item;
  }
}

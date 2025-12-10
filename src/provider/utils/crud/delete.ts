/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringKey } from 'types';

import { DBDeleteItemParams, DynamodbExecutor } from '../dynamoDB';

import { ItemExpression } from '../expressions';
import { getConditionParams } from '../conditions';

import { EntityPK } from './types';

export interface DeleteItemParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> {
  /**
   * Dynamodb Table
   */
  table: string;

  /**
   * Primary key of the Item to delete
   */
  key: EntityPK<Entity, PKs>;

  /**
   * A set of conditions you want to ensure are fulfilled
   * before the deletion is executed
   *
   * The operation will fail if the condition is not met
   */
  conditions?: ItemExpression<
    PKs extends StringKey<Entity> ? Omit<Entity, PKs> : Entity
  >[];
}

export class ItemRemover extends DynamodbExecutor {
  getDeleteParams<Entity>({
    key,
    table,
    conditions,
  }: DeleteItemParams<Entity>): DBDeleteItemParams['input'] {
    return {
      TableName: table,

      Key: key,

      ...getConditionParams(conditions),
    };
  }

  async delete<Entity extends Record<string, any>>(
    params: DeleteItemParams<Entity>,
  ): Promise<void> {
    await this._deleteItem(this.getDeleteParams(params));
  }
}

import { DynamoDB } from 'aws-sdk';

import { printLog } from 'utils/log';

import { StringKey } from 'types';

import { ItemExpression } from '../expressions';
import { getConditionParams } from '../conditions';
import { ExecutorParams } from '../executor';

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

export class ItemCreator {
  private dynamoDB: ExecutorParams['dynamoDB'];

  private options: Pick<ExecutorParams, 'logCallParams'>;

  constructor({ dynamoDB, ...options }: ExecutorParams) {
    this.dynamoDB = dynamoDB;

    this.options = options;
  }

  getCreateParams<Entity>({
    item,
    table,
    conditions,
  }: CreateItemParams<Entity>): DynamoDB.DocumentClient.PutItemInput {
    return {
      TableName: table,

      Item: item as DynamoDB.DocumentClient.PutItemInputAttributeMap,

      ...getConditionParams(conditions),
    };
  }

  private async _insertItem(
    params: DynamoDB.DocumentClient.PutItemInput,
  ): Promise<DynamoDB.DocumentClient.PutItemOutput> {
    if (this.options.logCallParams) printLog(params, 'putItem - dynamodb call params');

    return this.dynamoDB.put(params).promise();
  }

  async create<Entity>(params: CreateItemParams<Entity>): Promise<Entity> {
    await this._insertItem(this.getCreateParams(params));

    return params.item;
  }
}

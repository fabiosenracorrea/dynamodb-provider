/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDB } from 'aws-sdk';

import { StringKey } from 'types';

import { printLog } from 'utils/log';
import { removeUndefinedProps } from 'utils/object';

import {
  buildConditionExpression,
  getConditionExpressionNames,
  getConditionExpressionValues,
} from '../../conditions';
import {
  buildExpressionAttributeNames,
  buildExpressionAttributeValues,
  getExpressionNames,
} from '../../expressions';

import { ExecutorParams } from '../types';

import { buildUpdateExpression } from './updateExpression';
import { validateUpdateParams } from './validate';
import { UpdateParams } from './types';
import { UpdateIfNotExistsOperation } from './atomic';

export class ItemUpdater {
  private dynamoDB: ExecutorParams['dynamoDB'];

  private options: Pick<ExecutorParams, 'logCallParams'>;

  constructor({ dynamoDB, ...options }: ExecutorParams) {
    this.dynamoDB = dynamoDB;

    this.options = options;
  }

  private async _updateItem(
    params: DynamoDB.DocumentClient.UpdateItemInput,
  ): Promise<DynamoDB.DocumentClient.UpdateItemOutput> {
    if (this.options.logCallParams) printLog(params, 'updateItem - dynamodb call params');

    return this.dynamoDB.update(params).promise();
  }

  private convertAtomicValue({
    type,
    value,
  }: Pick<Exclude<UpdateParams<any>['atomicOperations'], undefined>[0], 'type' | 'value'>): any {
    switch (type) {
      case 'add_to_set':
      case 'remove_from_set':
        return this.dynamoDB.createSet(Array.isArray(value) ? value : [value]);
      default:
        return value;
    }
  }

  private buildAtomicAttributeValues(
    atomic: Exclude<UpdateParams<any>['atomicOperations'], undefined>,
  ): Record<string, any> {
    return buildExpressionAttributeValues(
      Object.fromEntries(
        atomic.map(({ property, value, type }) => [
          property,
          this.convertAtomicValue({ type, value }),
        ]),
      ),
    );
  }

  getUpdateParams<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): DynamoDB.DocumentClient.UpdateItemInput {
    validateUpdateParams(params);

    const { key, table, remove, returnUpdatedProperties } = params;

    const atomic = params.atomicOperations || [];
    const values = removeUndefinedProps(params.values || {});
    const conditions = params.conditions || [];

    return {
      TableName: table,

      Key: key,

      UpdateExpression: buildUpdateExpression({
        atomicOperations: atomic,
        remove,
        values,
      }),

      ConditionExpression: conditions.length ? buildConditionExpression(conditions) : undefined,

      ExpressionAttributeNames: {
        ...buildExpressionAttributeNames(values),

        ...getExpressionNames(remove || []),

        ...getExpressionNames(
          atomic
            .map(({ property, ...rest }) =>
              [(rest as UpdateIfNotExistsOperation<any>).refProperty as string, property].filter(
                Boolean,
              ),
            )
            .flat(),
        ),

        ...getConditionExpressionNames(conditions),
      },

      ExpressionAttributeValues: {
        ...buildExpressionAttributeValues(values),

        ...this.buildAtomicAttributeValues(atomic),

        ...getConditionExpressionValues(conditions),
      },

      ReturnValues: returnUpdatedProperties ? 'UPDATED_NEW' : undefined,
    };
  }

  // To: enhance type to enable return type to vary from returnUpdatedProperties
  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    const { Attributes } = await this._updateItem(this.getUpdateParams(params));

    if (params.returnUpdatedProperties) return Attributes as Partial<Entity> | undefined;
  }
}

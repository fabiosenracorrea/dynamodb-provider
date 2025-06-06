/* eslint-disable @typescript-eslint/no-explicit-any */

import { StringKey } from 'types';

import { omitUndefined } from 'utils/object';

import { DBUpdateItemParams, DynamodbExecutor } from '../../dynamoDB';

import { getConditionParams } from '../../conditions';
import {
  buildExpressionAttributeNames,
  buildExpressionAttributeValues,
  getExpressionNames,
} from '../../expressions';

import { buildUpdateExpression } from './updateExpression';
import { validateUpdateParams } from './validate';
import { UpdateParams } from './types';
import { UpdateIfNotExistsOperation } from './atomic';

export class ItemUpdater extends DynamodbExecutor {
  private convertAtomicValue({
    type,
    value,
  }: Pick<Exclude<UpdateParams<any>['atomicOperations'], undefined>[0], 'type' | 'value'>): any {
    switch (type) {
      case 'add_to_set':
      case 'remove_from_set':
        return this._createSet(Array.isArray(value) ? value : [value]);
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

  private getConditionParams({
    atomicOperations = [],
    conditions = [],
  }: Pick<UpdateParams<any>, 'atomicOperations' | 'conditions'>) {
    const atomicConditions = atomicOperations
      .filter((o) => o.if)
      .map((op) => ({
        ...op.if!,
        property: op.if!.property ?? op.property,
      }));

    const allConditions = [...atomicConditions, ...conditions];

    return getConditionParams(allConditions);
  }

  getUpdateParams<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): DBUpdateItemParams['input'] {
    validateUpdateParams(params);

    const { key, table, remove, returnUpdatedProperties } = params;

    const atomic = params.atomicOperations || [];
    const values = omitUndefined(params.values || {});

    const conditionParams = this.getConditionParams(params);

    return omitUndefined({
      TableName: table,

      Key: key,

      UpdateExpression: buildUpdateExpression({
        atomicOperations: atomic,
        remove,
        values,
      }),

      ConditionExpression: conditionParams.ConditionExpression,

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

        ...conditionParams.ExpressionAttributeNames,
      },

      ExpressionAttributeValues: {
        ...buildExpressionAttributeValues(values),

        ...this.buildAtomicAttributeValues(atomic),

        ...conditionParams.ExpressionAttributeValues,
      },

      ReturnValues: returnUpdatedProperties ? 'UPDATED_NEW' : undefined,
    });
  }

  // To: enhance type to enable return type to vary from returnUpdatedProperties
  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    const { Attributes } = await this._updateItem(this.getUpdateParams(params));

    if (params.returnUpdatedProperties) return Attributes as Partial<Entity> | undefined;
  }
}

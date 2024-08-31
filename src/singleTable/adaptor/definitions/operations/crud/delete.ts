import { DeleteItemParams } from 'provider';

import { AnyObject } from 'types';
import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';

export type SingleTableDeleteParams<Entity> = SingleTableKeyReference & {
  conditions?: DeleteItemParams<Entity>['conditions'];
};

export class SingleTableRemover extends BaseSingleTableOperator {
  getDeleteParams({
    partitionKey,
    rangeKey,
    ...config
  }: SingleTableDeleteParams<AnyObject>): DeleteItemParams<SingleTableKeyReference> {
    return {
      ...config,

      table: this.config.table,

      key: getPrimaryKey(
        {
          partitionKey,
          rangeKey,
        },
        this.config,
      ),
    };
  }

  async delete<Entity = AnyObject>(keyReference: SingleTableDeleteParams<Entity>): Promise<void> {
    await this.db.delete(this.getDeleteParams(keyReference));
  }
}
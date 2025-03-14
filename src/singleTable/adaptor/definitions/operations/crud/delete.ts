import { DeleteItemParams } from 'provider';

import { AnyObject } from 'types';
import { omitUndefined } from 'utils/object';
import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';

export type SingleTableDeleteParams<Entity> = SingleTableKeyReference & {
  conditions?: DeleteItemParams<Entity>['conditions'];
};

export class SingleTableRemover extends BaseSingleTableOperator {
  getDeleteParams({
    partitionKey,
    rangeKey,

    conditions,
  }: SingleTableDeleteParams<AnyObject>): DeleteItemParams<SingleTableKeyReference> {
    return omitUndefined({
      conditions,

      table: this.config.table,

      key: getPrimaryKey(
        {
          partitionKey,
          rangeKey,
        },
        this.config,
      ),
    });
  }

  async delete<Entity = AnyObject>(keyReference: SingleTableDeleteParams<Entity>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.db.delete(this.getDeleteParams(keyReference as any));
  }
}

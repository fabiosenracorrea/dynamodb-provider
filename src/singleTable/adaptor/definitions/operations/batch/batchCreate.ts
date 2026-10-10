import { StringKey } from 'types';
import { BatchCreateParams, BatchCreateResult } from 'provider';

import { BaseSingleTableOperator } from '../../executor';

export type SingleTableBatchCreateParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = Omit<BatchCreateParams<Entity, PKs>, 'table'>;

export class SingleTableBatchCreator extends BaseSingleTableOperator {
  async batchCreate<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchCreateParams<Entity, PKs>,
  ): Promise<BatchCreateResult<Entity, PKs>> {
    return this.db.batchCreate<Entity, PKs>({
      ...options,

      table: this.config.table,
    });
  }
}

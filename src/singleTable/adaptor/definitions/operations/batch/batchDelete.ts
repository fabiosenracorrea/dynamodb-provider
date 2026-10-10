import { StringKey } from 'types';
import { BatchDeleteParams, BatchDeleteResult } from 'provider';

import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';

export type SingleTableBatchDeleteParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = Omit<BatchDeleteParams<Entity, PKs>, 'table' | 'items'> & {
  items: SingleTableKeyReference[];
};

export class SingleTableBatchDeleter extends BaseSingleTableOperator {
  async batchDelete<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    items,
    ...options
  }: SingleTableBatchDeleteParams<Entity, PKs>): Promise<BatchDeleteResult<Entity, PKs>> {
    return this.db.batchDelete<Entity, PKs>({
      ...options,

      table: this.config.table,

      items: items.map((ref) => getPrimaryKey<Entity, PKs>(ref, this.config)),
    });
  }
}

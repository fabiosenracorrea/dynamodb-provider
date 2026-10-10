import { StringKey } from 'types';
import { BatchMutateParams, BatchMutateResult } from 'provider';

import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';

export type SingleTableBatchMutateParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = Omit<BatchMutateParams<Entity, PKs>, 'table' | 'deletes'> & {
  deletes?: SingleTableKeyReference[];
};

export class SingleTableBatchMutator extends BaseSingleTableOperator {
  async batchMutate<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    deletes,
    ...options
  }: SingleTableBatchMutateParams<Entity, PKs>): Promise<BatchMutateResult<Entity, PKs>> {
    return this.db.batchMutate<Entity, PKs>({
      ...options,

      table: this.config.table,

      deletes: deletes?.map((ref) => getPrimaryKey<Entity, PKs>(ref, this.config)),
    });
  }
}

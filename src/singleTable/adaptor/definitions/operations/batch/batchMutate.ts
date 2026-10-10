import { StringKey } from 'types';
import { BatchMutateParams, BatchMutateResult } from 'provider';

import { SingleTableConfig } from '../../config';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { SingleTableCreateParams, SingleTableCreator } from '../crud';

export type SingleTableBatchMutateParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = Omit<BatchMutateParams<Entity, PKs>, 'table' | 'creations' | 'deletes'> & {
  creations?: SingleTableCreateParams<Entity>[];
  deletes?: SingleTableKeyReference[];
};

export class SingleTableBatchMutator extends SingleTableCreator {
  async batchMutate<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    creations,
    deletes,
    ...options
  }: SingleTableBatchMutateParams<Entity, PKs>): Promise<BatchMutateResult<Entity, PKs>> {
    return this.db.batchMutate<Entity, PKs>({
      ...options,

      table: this.config.table,

      creations: creations?.map(
        (item) =>
          this.getCreateParams<Entity>(
            item as SingleTableCreateParams<Entity, Required<SingleTableConfig>>,
          ).item,
      ),

      deletes: deletes?.map((ref) => getPrimaryKey<Entity, PKs>(ref, this.config)),
    });
  }
}

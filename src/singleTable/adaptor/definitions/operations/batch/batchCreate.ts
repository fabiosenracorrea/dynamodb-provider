import { StringKey } from 'types';
import { BatchCreateParams, BatchCreateResult } from 'provider';

import { SingleTableConfig } from '../../config';
import { SingleTableCreateParams, SingleTableCreator } from '../crud';

export type SingleTableBatchCreateParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = Omit<BatchCreateParams<Entity, PKs>, 'table' | 'items'> & {
  items: SingleTableCreateParams<Entity>[];
};

export class SingleTableBatchCreator extends SingleTableCreator {
  async batchCreate<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    options: SingleTableBatchCreateParams<Entity, PKs>,
  ): Promise<BatchCreateResult<Entity, PKs>> {
    return this.db.batchCreate<Entity, PKs>({
      ...options,

      table: this.config.table,

      items: options.items.map(
        (item) =>
          this.getCreateParams<Entity>(
            item as SingleTableCreateParams<Entity, Required<SingleTableConfig>>,
          ).item,
      ),
    });
  }
}

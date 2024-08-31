/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringKey } from 'types';
import { BatchListItemsArgs } from 'provider/utils';

import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { cleanInternalPropsFromList } from '../../propRemoval';

export type SingleTableBatchGetParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = Omit<BatchListItemsArgs<Entity, PKs>, 'table' | 'keys'> & {
  keys: SingleTableKeyReference[];
};

export class SingleTableBatchGetter extends BaseSingleTableOperator {
  async batchGet<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    keys,
    ...options
  }: SingleTableBatchGetParams<Entity, PKs>): Promise<Entity[]> {
    const items = await this.db.batchGet<any>({
      ...options,

      table: this.config.table,

      keys: keys.map((ref) => getPrimaryKey(ref, this.config)),
    });

    return cleanInternalPropsFromList(items, this.config);
  }
}

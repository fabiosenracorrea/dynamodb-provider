import { StringKey } from 'types';

import { GetItemParams } from 'provider/utils';

import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { cleanInternalProps } from '../../propRemoval';

export type SingleTableGetParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = SingleTableKeyReference & Omit<GetItemParams<Entity, PKs>, 'table' | 'key'>;

export class SingleTableGetter extends BaseSingleTableOperator {
  async get<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    partitionKey,
    rangeKey,
    ...options
  }: SingleTableGetParams<Entity, PKs>): Promise<Entity | undefined> {
    const item = await this.db.get<Entity, PKs>({
      ...options,

      table: this.config.table,

      key: getPrimaryKey(
        {
          partitionKey,
          rangeKey,
        },
        this.config,
      ),
    });

    if (item) return cleanInternalProps(item, this.config);
  }
}

import { GetItemParams } from 'provider/utils';

import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { cleanInternalProps } from '../../propRemoval';

export type SingleTableGetParams<Entity> = SingleTableKeyReference &
  Omit<GetItemParams<Entity>, 'table' | 'key'>;

export class SingleTableGetter extends BaseSingleTableOperator {
  async get<Entity>({
    partitionKey,
    rangeKey,
    ...options
  }: SingleTableGetParams<Entity>): Promise<Entity | undefined> {
    const item = await this.db.get<Entity>({
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

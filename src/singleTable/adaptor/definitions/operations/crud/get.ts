import { GetItemParams } from 'provider/utils';

import { removeUndefinedProps } from 'utils/object';
import { BaseSingleTableOperator } from '../../executor';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { resolveProps } from '../../parsers';

export type SingleTableGetParams<Entity> = SingleTableKeyReference &
  Omit<GetItemParams<Entity>, 'table' | 'key'>;

export class SingleTableGetter extends BaseSingleTableOperator {
  async get<Entity>({
    partitionKey,
    rangeKey,

    consistentRead,
    propertiesToRetrieve,
  }: SingleTableGetParams<Entity>): Promise<Entity | undefined> {
    const item = await this.db.get<Entity>(
      removeUndefinedProps({
        consistentRead,
        propertiesToRetrieve,

        table: this.config.table,

        key: getPrimaryKey(
          {
            partitionKey,
            rangeKey,
          },
          this.config,
        ),
      }),
    );

    if (item) return resolveProps(item, this.config, this.parser);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import { BasicRangeKeyConfig, BetweenRangeKeyConfig, QueryParams } from 'provider/utils';

import { BaseSingleTableOperator } from '../../executor';
import { cleanInternalPropsFromList } from '../../propRemoval';

type BasicRangeConfig = Pick<BasicRangeKeyConfig<AnyObject>, 'operation' | 'value'>;

type BetweenRangeConfig = Pick<BetweenRangeKeyConfig<AnyObject>, 'high' | 'low' | 'operation'>;

export interface ListItemTypeParams
  extends Partial<
    Pick<
      QueryParams<AnyObject>,
      'fullRetrieval' | 'paginationToken' | 'limit' | 'retrieveOrder' | 'filters'
    >
  > {
  type: string;

  range?: BasicRangeConfig | BetweenRangeConfig;
}

export interface ListItemTypeResult<Entity = AnyObject> {
  items: Entity[];

  paginationToken: string;
}

export class SingleTableLister extends BaseSingleTableOperator {
  private getHashKey(type: string): QueryParams<any>['hashKey'] {
    return {
      value: type,
      name: this.config.typeIndex.partitionKey,
    };
  }

  async listAllFromType<Entity>(type: string): Promise<Entity[]> {
    const { items } = await this.db.query<any>({
      table: this.config.table,

      hashKey: this.getHashKey(type),

      fullRetrieval: true,

      index: this.config.typeIndex.name,
    });

    return cleanInternalPropsFromList(items, this.config);
  }

  async listType<Entity>({
    type,
    range,
    ...collectionListConfig
  }: ListItemTypeParams): Promise<ListItemTypeResult<Entity>> {
    const { items, paginationToken } = await this.db.query<any>({
      table: this.config.table,

      hashKey: this.getHashKey(type),

      index: this.config.typeIndex.name,

      fullRetrieval: false,

      ...collectionListConfig,

      rangeKey: range
        ? {
            ...range,

            name: this.config.typeIndex.rangeKey,
          }
        : undefined,
    });

    return {
      items: cleanInternalPropsFromList(items, this.config),

      paginationToken,
    };
  }
}

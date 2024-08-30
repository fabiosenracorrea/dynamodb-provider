/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import { IDatabaseProvider } from 'provider';
import { BasicRangeKeyConfig, BetweenRangeKeyConfig, QueryParams } from 'provider/utils';

import { SingleTableConfig } from '../../config';
import { SingleTableOperatorParams } from '../../executor';
import { cleanInternalPropsFromList } from '../../propRemoval';

type BasicRangeConfig = {
  value: string;
  operation: Extract<
    BasicRangeKeyConfig<AnyObject>['operation'],
    'lower_than' | 'lower_or_equal_than' | 'bigger_than' | 'bigger_or_equal_than'
  >;
};

type BetweenRangeConfig = Omit<BetweenRangeKeyConfig<AnyObject>, 'name'>;

export interface ListItemTypeParams
  extends Pick<
    QueryParams<AnyObject>,
    'fullRetrieval' | 'paginationToken' | 'limit' | 'retrieveOrder' | 'filters'
  > {
  type: string;

  range?: BasicRangeConfig | BetweenRangeConfig;
}

export interface ListItemTypeResult<Entity = AnyObject> {
  items: Entity[];

  paginationToken: string;
}

export class SingleTableLister {
  db: IDatabaseProvider;

  config: SingleTableConfig;

  constructor({ config, db }: SingleTableOperatorParams) {
    this.db = db;
    this.config = config;
  }

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

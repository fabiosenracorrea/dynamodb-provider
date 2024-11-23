/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import {
  BasicRangeKeyConfig,
  BetweenRangeKeyConfig,
  QueryParams,
  QueryResult,
} from 'provider/utils';

import { removeUndefinedProps } from 'utils/object';

import { convertKey, KeyValue } from '../../key';
import { SingleTableConfig } from '../../config';
import { BaseSingleTableOperator } from '../../executor';
import { resolvePropsFromList } from '../../parsers';
import { getIndexHashName, getIndexRangeName } from '../../tableIndex';

// if we did simply Omit<RangeKeyConfig, 'name'>
// TS would not require the other params for some reason

type BasicRangeKeyOp = Omit<BasicRangeKeyConfig<unknown>, 'name' | 'value'> & {
  value: KeyValue | number;
};

type BetweenRangeKeyOp = Omit<BetweenRangeKeyConfig<unknown>, 'name' | 'high' | 'low'> & {
  low: KeyValue | number;
  high: KeyValue | number;
};

export type DefinedNameRangeKeyConfig = BasicRangeKeyOp | BetweenRangeKeyOp;

type IndexParams<TableConfig extends SingleTableConfig> = undefined extends TableConfig['indexes']
  ? {}
  : {
      index?: keyof TableConfig['indexes'];
    };

export type SingleTableQueryParams<
  Entity,
  TableConfig extends SingleTableConfig = SingleTableConfig,
> = Omit<QueryParams<Entity>, 'index' | 'partitionKey' | 'rangeKey' | 'table'> &
  IndexParams<TableConfig> & {
    partition: KeyValue;

    range?: DefinedNameRangeKeyConfig;
  };

export const singleTableParams = [
  'index',
  'range',
  'retrieveOrder',
  'limit',
  'paginationToken',
  'fullRetrieval',
  'filters',
] as (keyof SingleTableQueryParams<any, any>)[];

export class SingleTableQueryBuilder extends BaseSingleTableOperator {
  private convertKey(prop: any): string {
    return convertKey(prop, this.config);
  }

  private async _listCollection<Entity>({
    partition,
    range,
    index,
    ...options
  }: SingleTableQueryParams<Entity> & { index?: string }): Promise<QueryResult<Entity>> {
    const { items, paginationToken } = await this.db.query<any>({
      ...options,

      table: this.config.table,

      index,

      partitionKey: {
        name: index ? getIndexHashName(index, this.config) : this.config.partitionKey,

        value: this.convertKey(partition),
      },

      rangeKey: range
        ? removeUndefinedProps({
            ...range,

            high: range.operation === 'between' ? this.convertKey(range.high) : undefined,

            low: range.operation === 'between' ? this.convertKey(range.low) : undefined,

            value: range.operation !== 'between' ? this.convertKey(range.value) : undefined,

            name: index ? getIndexRangeName(index, this.config) : this.config.rangeKey,
          } as any)
        : undefined,
    });

    return {
      paginationToken,

      items: resolvePropsFromList(items, this.config, this.parser),
    } as QueryResult<Entity>;
  }

  async query<Entity>(
    params: SingleTableQueryParams<Entity, Required<SingleTableConfig>>,
  ): Promise<QueryResult<Entity>> {
    const result = await this._listCollection<Entity>(params);

    return result;
  }
}

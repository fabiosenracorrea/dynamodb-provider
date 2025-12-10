/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import {
  BasicRangeKeyConfig,
  BetweenRangeKeyConfig,
  QueryConfigParams,
  QueryResult,
} from 'provider/utils';

import { omitUndefined } from 'utils/object';

import { StableOmit } from 'types';
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

type BetweenRangeKeyOp = Omit<
  BetweenRangeKeyConfig<unknown>,
  'name' | 'end' | 'start'
> & {
  start: KeyValue | number;
  end: KeyValue | number;
};

export type DefinedNameRangeKeyConfig = BasicRangeKeyOp | BetweenRangeKeyOp;

type IndexParams<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['indexes']
    ? {}
    : {
        index?: keyof TableConfig['indexes'];
      };

export type SingleTableQueryParams<
  Entity,
  TableConfig extends SingleTableConfig = SingleTableConfig,
> = QueryConfigParams<Entity> &
  IndexParams<TableConfig> & {
    partition: KeyValue;

    range?: DefinedNameRangeKeyConfig;
  };

/**
 * Parameters for single table queryOne operation
 *
 * Returns the first item matching the query or undefined
 */
export type SingleTableQueryOneParams<
  Entity,
  TableConfig extends SingleTableConfig = SingleTableConfig,
> = StableOmit<
  SingleTableQueryParams<Entity, TableConfig>,
  'limit' | 'paginationToken' | 'fullRetrieval'
>;

/**
 * Parameters for single table queryAll operation
 *
 * Returns all items matching the query as a simple array
 */
export type SingleTableQueryAllParams<
  Entity,
  TableConfig extends SingleTableConfig = SingleTableConfig,
> = StableOmit<
  SingleTableQueryParams<Entity, TableConfig>,
  'paginationToken' | 'fullRetrieval'
>;

export const singleTableParams = [
  'index',
  'range',
  'retrieveOrder',
  'limit',
  'paginationToken',
  'fullRetrieval',
  'filters',
  'propertiesToRetrieve',
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
        ? omitUndefined({
            ...range,

            end: range.operation === 'between' ? this.convertKey(range.end) : undefined,

            start:
              range.operation === 'between' ? this.convertKey(range.start) : undefined,

            value:
              range.operation !== 'between' ? this.convertKey(range.value) : undefined,

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

  /**
   * Queries for the first item matching the criteria
   *
   * @param params - Query parameters (without limit, paginationToken, or fullRetrieval)
   * @returns The first matching item or undefined if no items found
   */
  async queryOne<Entity>(
    params: SingleTableQueryOneParams<Entity, Required<SingleTableConfig>>,
  ): Promise<Entity | undefined> {
    const {
      items: [item],
    } = await this.query<Entity>({
      ...params,
      limit: 1,
      fullRetrieval: false,
    });

    return item;
  }

  /**
   * Queries for all items matching the criteria
   *
   * @param params - Query parameters (without paginationToken or fullRetrieval)
   * @returns Array of all matching items
   */
  async queryAll<Entity>(
    params: SingleTableQueryAllParams<Entity, Required<SingleTableConfig>>,
  ): Promise<Entity[]> {
    const { items } = await this.query<Entity>({
      ...params,
      fullRetrieval: true,
    });

    return items;
  }
}

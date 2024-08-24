/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BasicRangeKeyConfig,
  BetweenRangeKeyConfig,
  RangeKeyConfig,
} from 'providers/database/provider/utils';
import { AnyObject } from 'types/general';
import { KeyValue } from '../../config';

import { EmptyObject } from './helpers';

type RangeQueryValues =
  | { value: KeyValue | BasicRangeKeyConfig<unknown>['value'] }
  | {
      low: KeyValue | BetweenRangeKeyConfig<unknown>['low'];
      high: KeyValue | BetweenRangeKeyConfig<unknown>['high'];
    };

export type RangeQuery = Record<
  string,
  {
    operation: RangeKeyConfig<AnyObject>['operation'];
    getValues: (...params: any) => RangeQueryValues;
  }
>;

type RangeQueryParams =
  | (Pick<BasicRangeKeyConfig<AnyObject>, 'operation'> & {
      value: KeyValue | BasicRangeKeyConfig<unknown>['value'];
    })
  | (Pick<BetweenRangeKeyConfig<AnyObject>, 'operation'> & {
      low: KeyValue | BetweenRangeKeyConfig<unknown>['low'];
      high: KeyValue | BetweenRangeKeyConfig<unknown>['high'];
    });

export type RangeQueryGetters<RangeQueryConfig extends RangeQuery> = {
  [Key in keyof RangeQueryConfig]: (
    ...params: Parameters<RangeQueryConfig[Key]['getValues']>
  ) => RangeQueryParams;
};

export type RangeQueryConfigProps<RangeQueryConfig extends RangeQuery | undefined> =
  RangeQueryConfig extends RangeQuery
    ? { rangeQueries: RangeQueryGetters<RangeQueryConfig> }
    : EmptyObject;

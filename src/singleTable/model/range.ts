/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue } from 'singleTable/adaptor/definitions';

import { BasicRangeKeyConfig, BetweenRangeKeyConfig } from 'provider/utils';

type RefBasicConfig = BasicRangeKeyConfig<any>;
type BetweenRefConfig = BetweenRangeKeyConfig<any>;

type SingleRangeConfig =
  | {
      operation: RefBasicConfig['operation'];
      getValues: (...params: any) => { value: KeyValue | BasicRangeKeyConfig<unknown>['value'] };
    }
  | {
      operation: BetweenRefConfig['operation'];
      getValues: (...params: any) => {
        low: KeyValue | BetweenRefConfig['low'];
        high: KeyValue | BetweenRefConfig['high'];
      };
    };

type RangeQuery = Record<string, SingleRangeConfig>;

type ResolvedRangeConfig<Config extends SingleRangeConfig> = Pick<Config, 'operation'> &
  ReturnType<Config['getValues']>;

type RangeQueryGetters<RangeQueryConfig extends RangeQuery> = {
  [Key in keyof RangeQueryConfig]: (
    ...params: Parameters<RangeQueryConfig[Key]['getValues']>
  ) => ResolvedRangeConfig<RangeQueryConfig[Key]>;
};

export type RangeQueryInputProps = {
  /**
   * Configure possible queries to be easily referenced when using the entity
   *
   * Pass in an object in each:
   *
   * - Key: query name
   * - Value: query config, which operation will be performed, and value getter
   *
   * This will produce a query executor with the same name + defined params
   */
  rangeQueries?: RangeQuery;
};

export type RangeQueryResultProps<RangeQueryConfig extends RangeQuery | undefined> =
  RangeQueryConfig extends RangeQuery
    ? { rangeQueries: RangeQueryGetters<RangeQueryConfig> }
    : unknown;

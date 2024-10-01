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

export type RangeQueryGetters<RangeQueryConfig extends RangeQuery> = {
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

export type RangeQueryResultProps<RangeParams extends RangeQueryInputProps | undefined> =
  RangeParams extends RangeQueryInputProps
    ? RangeParams['rangeQueries'] extends RangeQuery
      ? { rangeQueries: RangeQueryGetters<RangeParams['rangeQueries']> }
      : object
    : object;

export function getRangeQueriesParams<Params extends RangeQueryInputProps>({
  rangeQueries,
}: Params): RangeQueryResultProps<Params> {
  if (!rangeQueries) return {} as RangeQueryResultProps<Params>;

  return {
    rangeQueries: Object.fromEntries(
      Object.entries(rangeQueries).map(([queryName, { getValues, operation }]) => [
        queryName,

        (valueParams: any) => ({
          operation,
          ...getValues(valueParams),
        }),
      ]),
    ),
  } as RangeQueryResultProps<Params>;
}

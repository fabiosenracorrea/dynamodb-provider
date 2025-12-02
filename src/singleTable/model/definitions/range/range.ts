/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue } from 'singleTable/adaptor/definitions';

import { BasicRangeKeyConfig, BetweenRangeKeyConfig } from 'provider/utils';
import { AnyFunction } from 'types';

type RefBasicConfig = BasicRangeKeyConfig<any>;
type BetweenRefConfig = BetweenRangeKeyConfig<any>;

type SingleRangeConfig =
  | {
      operation: RefBasicConfig['operation'];
      getValues?: (...params: any) => { value: KeyValue | BasicRangeKeyConfig<unknown>['value'] };
    }
  | {
      operation: BetweenRefConfig['operation'];
      getValues?: (...params: any) => {
        start: KeyValue | BetweenRefConfig['start'];
        end: KeyValue | BetweenRefConfig['end'];
      };
    };

type RangeQuery = Record<string, SingleRangeConfig>;

type RangeOperation = RefBasicConfig['operation'] | BetweenRefConfig['operation'];

/**
 * If `getValues` is not provided,
 * the default function is simply one that
 * take exactly the Range expected params (value or start/end)
 */
type EnsureValueGetter<
  Fn extends AnyFunction | undefined,
  Operation extends RangeOperation,
  //
  // -- system param --
  //
  __RANGE_PARAMS__ = ReturnType<
    Extract<Required<SingleRangeConfig>, { operation: Operation }>['getValues']
  >,
> = Fn extends AnyFunction ? Fn : (p: __RANGE_PARAMS__) => __RANGE_PARAMS__;

type ResolvedRangeConfig<Config extends SingleRangeConfig> = Pick<Config, 'operation'> &
  ReturnType<EnsureValueGetter<Config['getValues'], Config['operation']>>;

export type RangeQueryGetters<Config extends RangeQuery> = {
  [Key in keyof Config]: (
    ...params: Parameters<EnsureValueGetter<Config[Key]['getValues'], Config[Key]['operation']>>
  ) => ResolvedRangeConfig<Config[Key]>;
};

export type RangeQueryInputProps = {
  /**
   * Configure possible queries to be easily referenced when using the entity
   *
   * Pass in an object in which:
   *
   * - Key: query name
   * - Value: query config, which operation will be performed, and value getter
   *
   * This will produce a query executor with the same name + defined params
   */
  rangeQueries?: RangeQuery;
};

export type RangeQueryResultProps<RangeParams extends RangeQueryInputProps | undefined> =
  RangeParams extends Required<RangeQueryInputProps>
    ? { rangeQueries: RangeQueryGetters<RangeParams['rangeQueries']> }
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
          ...(getValues?.(valueParams) ?? valueParams),
        }),
      ]),
    ),
  } as RangeQueryResultProps<Params>;
}

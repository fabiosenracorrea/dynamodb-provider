/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyValue } from 'singleTable/adaptor/definitions';

import { BasicRangeKeyConfig, BetweenRangeKeyConfig } from 'provider/utils';
import { AnyFunction, AnyObject } from 'types';
import { pick } from 'utils/object';

type BetweenRefConfig = BetweenRangeKeyConfig<any>;

type BasicRangeConfig = {
  operation: BasicRangeKeyConfig<any>['operation'];
  getValues?: (...params: any) => {
    value: KeyValue | BasicRangeKeyConfig<unknown>['value'];
  };
};

type BetweenRangeConfig = {
  operation: BetweenRefConfig['operation'];
  getValues?: (...params: any) => {
    start: KeyValue | BetweenRefConfig['start'];
    end: KeyValue | BetweenRefConfig['end'];
  };
};

type SingleRangeConfig = BasicRangeConfig | BetweenRangeConfig;

type RangeQuery = Record<string, SingleRangeConfig>;

type RangeOperation = SingleRangeConfig['operation'];

type DefaultRangeGetter<Op extends RangeOperation> = NonNullable<
  Op extends BetweenRangeConfig['operation']
    ? BetweenRangeConfig['getValues']
    : BasicRangeConfig['getValues']
>;

/**
 * If `getValues` is not provided,
 * the default function is simply one that
 * take exactly the Range expected params (value or start/end)
 */
type EnsureValueGetter<
  Config extends SingleRangeConfig,
  //
  // -- system param --
  //
  __RANGE_PARAMS__ = ReturnType<DefaultRangeGetter<Config['operation']>>,
> = Config['getValues'] extends AnyFunction
  ? Config['getValues']
  : (p: __RANGE_PARAMS__) => __RANGE_PARAMS__;

type RangeGetter<
  Config extends SingleRangeConfig,
  //
  // -- system param --
  //
  __GET_VALUES__ extends AnyFunction = EnsureValueGetter<Config>,
> = (
  ...params: Parameters<__GET_VALUES__>
) => Pick<Config, 'operation'> & ReturnType<__GET_VALUES__>;

export type RangeQueryGetters<Config extends RangeQuery> = {
  [Key in keyof Config]: RangeGetter<Config[Key]>;
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

export function pickRangeParams(operation: RangeOperation, params: AnyObject = {}) {
  return pick(params, operation === 'between' ? ['end', 'start'] : ['value']);
}

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
          ...(getValues?.(valueParams) ?? pickRangeParams(operation, valueParams)),
        }),
      ]),
    ),
  } as RangeQueryResultProps<Params>;
}

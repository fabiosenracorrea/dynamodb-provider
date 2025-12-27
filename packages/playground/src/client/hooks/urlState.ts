/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { useSyncRef } from './syncRef';
import { IsUndefined, MakePartial, OmitUndefined, OnlyOptional } from '../types';

// To do: verify if Date can be accepted inside the parser return (serializable / parser)

type UrlPrimitiveValue = string | string[] | number | boolean;

type UrlConfigValue = {
  /**
   * The initial value
   *
   * Will be used if provided and `parser` returns `null`
   *
   * If not provided its value will be assumed to be string | undefined
   */
  defaultValue?: UrlPrimitiveValue;

  /**
   *
   * @param value the current value found inside the url
   * @param urlState all values extracted from the url - they are cross validated, meaning the urlState will be validated on all other keys before
   * @returns The actual value that will be held inside the state and url. If `null`, the current value is invalid and won't be exposed to the application
   */
  parser?: (
    value: string,
    urlState: Record<string, UrlPrimitiveValue>,
  ) => UrlPrimitiveValue | null;

  /**
   *
   * @param value the current value found inside the url
   * @param urlState all values extracted from the url - they are cross validated, meaning the urlState will be validated on all other keys before
   * @returns A boolean that indicates if the current value withing our state and/or url is valid and should be exposed to the application
   */
  validate?: (value: string, urlState: Record<string, UrlPrimitiveValue>) => boolean;

  /**
   *
   * @param value The new value about to be updated to the url
   *
   * You can use this to sync up with any external store, for example
   */
  onValue?: (value: string) => void;
};

// Concept to build on later!
// type StateValue<T> = T extends UrlConfigValue
//   ? T['parser'] extends (...p: any[]) => infer R
//     ? R
//     : T['defaultValue']
//   : T;

export type UrlStateConfig = Record<string, UrlConfigValue | UrlPrimitiveValue>;

type ExpandType<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type UrlState<T extends UrlStateConfig> = ExpandType<
  MakePartial<
    {
      [Key in keyof OmitUndefined<T>]: T[Key] extends UrlConfigValue
        ? IsUndefined<T[Key]['defaultValue']> extends true
          ? string | undefined
          : T[Key]['defaultValue']
        : T[Key];
    } & {
      [Key in keyof OnlyOptional<T>]?: T[Key] extends UrlConfigValue
        ? IsUndefined<T[Key]['defaultValue']> extends true
          ? string | undefined
          : T[Key]['defaultValue']
        : T[Key];
    }
  >
>;

/**
 * Note: This wont work if you pass an interface
 */
export interface UseUrlState<Values extends UrlStateConfig> {
  urlParams: UrlState<Values>;

  /**
   * Partially update the wanted values
   *
   * Set the value to `null` to remove it
   */
  updateUrlParams: (params: {
    [Key in keyof UrlState<Values>]?: UrlState<Values>[Key] | null;
  }) => void;

  clear: () => void;
}

function purgeConfigValues(values: UrlStateConfig): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(
        ([, value]) =>
          Array.isArray(value) || ['string', 'boolean', 'number'].includes(typeof value),
      )
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, `${value}`]),
  ) as Record<string, string>;
}

function extractConfigValues(values: UrlStateConfig): Record<string, UrlConfigValue> {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        !Array.isArray(value) && !['string', 'boolean', 'number'].includes(typeof value),
    ),
  ) as Record<string, UrlConfigValue>;
}

function removeInvalidValues(
  params: Record<string, string>,
  validators: Record<string, UrlConfigValue>,
): Record<string, string> {
  const validatorEntries = Object.entries(validators);

  if (!validatorEntries.length) return params;

  const filteredEntries = Object.entries(params).filter(
    ([key, value]) =>
      validators[key]?.validate?.(
        value,

        //  Ensure all other fields are validated before getting passed to validation
        removeInvalidValues(
          params,
          Object.fromEntries(validatorEntries.filter(([key2]) => key !== key2)),
        ),
      ) ?? true,
  );

  return Object.fromEntries(filteredEntries);
}

function hasValue(value: any): boolean {
  return ![undefined, null].includes(value);
}

function parseValues(
  params: Record<string, string>,
  validators: Record<string, UrlConfigValue>,
): Record<string, UrlPrimitiveValue> {
  const validatorEntries = Object.entries(validators);

  if (!validatorEntries.length) return params;

  const filteredEntries = Object.entries(params)
    .map(([key, value]) => {
      const { defaultValue, parser } = validators[key] ?? {};

      if (!parser) return [key, value];

      return [
        key,

        parser?.(
          value,

          //  Ensure all other fields are parsed before getting passed to validation
          parseValues(
            params,
            Object.fromEntries(validatorEntries.filter(([key2]) => key2 !== key)),
          ),
        ) ?? defaultValue,
      ];
    })
    .filter(([, value]) => hasValue(value));

  return Object.fromEntries(filteredEntries);
}

function ensureDefaults(
  params: Record<string, UrlPrimitiveValue>,
  validators: Record<string, UrlConfigValue>,
): Record<string, UrlPrimitiveValue> {
  return {
    ...Object.fromEntries(
      Object.entries(validators)
        .filter(([, { defaultValue }]) => hasValue(defaultValue))
        .map(([key, { defaultValue }]) => [key, defaultValue!]),
    ),

    ...params,
  };
}

function ensureUrlParams<Values extends UrlStateConfig = UrlStateConfig>(
  urlParams: URLSearchParams,
  config: Values,
) {
  const validators = extractConfigValues(config);

  const urlState = Object.fromEntries(urlParams.entries());
  const filtered = removeInvalidValues(urlState, validators);
  const parsed = parseValues(filtered, validators);

  return ensureDefaults(parsed, validators);
}

export function useUrlState<Values extends UrlStateConfig = UrlStateConfig>(
  values: Values = {} as Values,
): UseUrlState<Values> {
  const location = useLocation();

  const [urlParams, setParams] = useSearchParams(purgeConfigValues(values));

  /**
   * This is necessary as if you have a side effect that changes the query
   * (eg. an onLoad callback) but change pages before the side effect happens,
   * the `setParams` will change the location/page back to where the hook was called
   *
   * Doing this ensures this hook is safe even on un-wanted (often bugs!) side-effects
   */
  const initialPath = useRef(location.pathname);

  const syncValues = useSyncRef({
    values,
  });

  /**
   * We save it here to ensure we have an active reference of the state that
   * is actually exposed to the application.
   *
   * Ex: if user have page=2 on load, but the validate(page) return false,
   * the value in the urlParams is {page:2} but to the app is exposed {page:defaultValue | undefined}
   */
  const actualUrlParams = useMemo(
    () => ensureUrlParams(urlParams, syncValues.current.values),
    // syncRef is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urlParams],
  );

  const asyncClean = useCallback(
    (key: string) => {
      setTimeout(() => {
        setParams((old) => {
          old.delete(key);

          return old;
        });
      }, 50);
    },
    [setParams],
  );

  const urlParamsRef = useSyncRef({
    urlParams: actualUrlParams,
  });

  const updateUrlParams = useCallback(
    (params: Record<string, any>) => {
      if (window.location.pathname !== initialPath.current) return;

      setParams(
        (old) => {
          const toUpdateEntries = Object.entries(params);

          const hasChange = toUpdateEntries.some(
            ([k, v]) => urlParamsRef.current.urlParams[k] !== v,
          );

          if (!hasChange) return old;

          /**
           * The app is requesting an update to the url that is currently in effect on it,
           * BUT NOT EXPOSED (urlParams !== actualUrlParams)
           *
           * This is due to validate() or parse() calls
           *
           * We know we must update here because we got through the `hasChange`
           * call
           */
          const isForceUpdate = toUpdateEntries.every(([k, v]) => old.get(k) === v);

          if (isForceUpdate) {
            const key = `__u${Math.random()}`;

            old.set(key, '1');
            asyncClean(key);

            return old;
          }

          toUpdateEntries.forEach(([key, value]) => {
            if (value === null || value === '') return old.delete(key);

            const newValue = typeof value === 'string' ? value : JSON.stringify(value);

            (syncValues.current.values[key] as UrlConfigValue)?.onValue?.(newValue);

            old.set(key, newValue);
          });

          return old;
        },
        { replace: true },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  );

  const clear = useCallback(() => {
    if (window.location.pathname !== initialPath.current) return;

    setParams(new URLSearchParams());
  }, [setParams]);

  return useMemo(() => {
    return {
      urlParams: actualUrlParams,

      updateUrlParams,

      clear,
    } as unknown as UseUrlState<Values>;
  }, [actualUrlParams, updateUrlParams, clear]);
}

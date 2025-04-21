/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AnyFunction,
  AnyObject,
  FirstParameter,
  IsNever,
  IsUndefined,
  PrettifyObject,
} from 'types';

import { KeyValue } from 'singleTable/adaptor/definitions';
import { KeyParams, EntityKeyResolvers, KeyResolvers, resolveKeys } from '../key';

export type ParamMatchArgs<KeyGetters extends EntityKeyResolvers<any>, Entity> = {
  /**
   * Use this to match the key getter param to your entity's property.
   *
   * For example, let's say you created a user partition that has the following structure:
   *
   * ```ts
   *  const getter = ({ userId }: { userId: string }) => ['USER', userId]
   * ```
   *
   * As it's recommended to label each param descriptively, this follows the best practices,
   * but the User entity is probably going to have 'id' on it, not 'userId', as opposed to
   * its related entities that might have userId directly.
   *
   * Use this matcher to bind these these 2 values only on your User entity:
   *
   * ```ts
   *  const config = {
   *    paramMatch: {
   *      userId: 'id'
   *    }
   *  }
   * ```
   */
  paramMatch?: {
    [GetterKey in keyof KeyParams<KeyGetters>]?: keyof Entity;
  };
};

// If none = never
type EligibleKeysToSwap<OriginalParams, SwapObj extends AnyObject> = Extract<
  keyof OriginalParams,
  keyof SwapObj
>;

/**
 * The keys from our entity that should be referenced inside the final keyGetter
 *
 * Basically if:
 *
 * - originalParams = { projectId: string, timestamp: string; }
 * - swapParams = { projectId: 'project' }
 * ==> results = 'project' (the valid key from our entity)
 */
type SwappedKeys<OriginalParams, SwapObj extends AnyObject> = IsNever<
  EligibleKeysToSwap<OriginalParams, SwapObj>
> extends true
  ? never
  : Pick<SwapObj, EligibleKeysToSwap<OriginalParams, SwapObj>>[keyof Pick<
      SwapObj,
      EligibleKeysToSwap<OriginalParams, SwapObj>
    >];

type SwappedValues<Entity, OriginalParams, SwapObj extends AnyObject> = IsNever<
  SwappedKeys<OriginalParams, SwapObj>
> extends true
  ? unknown
  : Pick<Entity, SwappedKeys<OriginalParams, SwapObj>>;

type SwapParams<
  Fn extends AnyFunction,
  Entity,
  ParamSwapObj extends Partial<Record<string, keyof Entity>> | undefined,
  FnParams = FirstParameter<Fn>,
> = IsUndefined<FnParams> extends true
  ? Fn
  : ParamSwapObj extends Record<string, keyof Entity>
  ? (
      params: PrettifyObject<
        Omit<FnParams, keyof ParamSwapObj> & SwappedValues<Entity, FnParams, ParamSwapObj>
      >,
    ) => ReturnType<Fn>
  : Fn;

// Ensures the index() call with no params can properly be inferred
type SafeParamMatchRef<RefParams extends ParamMatchArgs<any, any>> = RefParams extends {
  paramMatch: object;
}
  ? RefParams['paramMatch']
  : object;

// get from input params
// exclude paramMatch keys
// add paramMatch values
export type FullPartitionKeys<
  InitialGetters extends EntityKeyResolvers<any>,
  Entity,
  RefParams extends ParamMatchArgs<InitialGetters, Entity>,
> = KeyResolvers<{
  getPartitionKey: SwapParams<
    InitialGetters['getPartitionKey'],
    Entity,
    SafeParamMatchRef<RefParams>
  >;
  getRangeKey: SwapParams<InitialGetters['getRangeKey'], Entity, SafeParamMatchRef<RefParams>>;
}>;

type RefSwapParams = ParamMatchArgs<any, any> & EntityKeyResolvers<any>;

function swapKeys<
  Getter extends EntityKeyResolvers<any>['getPartitionKey'],
  SwapRef extends Record<string, string>,
>(originalGetter: Getter, swapParams: SwapRef): SwapParams<Getter, any, SwapRef> {
  // Overwrites any swap key received, keeping original intact

  const getter = (receivedParams: any = {}): KeyValue =>
    originalGetter({
      ...receivedParams,

      ...Object.fromEntries(
        Object.entries(swapParams).map(([partitionKey, entityKey]) => [
          partitionKey,
          receivedParams[entityKey as keyof typeof receivedParams],
        ]),
      ),
    });

  return getter as any;
}

export function resolveKeySwaps<Entity, RefParams extends RefSwapParams>(
  params: RefParams,
): FullPartitionKeys<Pick<RefParams, keyof EntityKeyResolvers<any>>, Entity, RefParams> {
  if (!params.paramMatch) return resolveKeys(params) as any;

  const { paramMatch } = params;
  const { getPartitionKey, getRangeKey } = resolveKeys(params) as EntityKeyResolvers<any>;

  const [partitionGetter, rangeGetter] = [getPartitionKey, getRangeKey].map((getter) =>
    swapKeys(getter, paramMatch),
  );

  return resolveKeys({
    getPartitionKey: partitionGetter,
    getRangeKey: rangeGetter,
  }) as any;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyFunction, AnyObject, FirstParameter, IsUndefined, PrettifyObject } from 'types';

import { KeyValue } from 'singleTable/adaptor/definitions';
import { EntityKeyParams, EntityKeyResolvers, KeyResolvers, resolveKeys } from '../key';

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
    [GetterKey in keyof EntityKeyParams<KeyGetters>]?: keyof Entity;
  };
};

type SwappedKeys<OriginalParams, SwapObj extends AnyObject> = Pick<
  SwapObj,
  Extract<keyof OriginalParams, string>
>[keyof Pick<SwapObj, Extract<keyof OriginalParams, string>>];

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
        Omit<FnParams, keyof ParamSwapObj> & Pick<Entity, SwappedKeys<FnParams, ParamSwapObj>>
      >,
    ) => ReturnType<Fn>
  : Fn;

// get from input params
// exclude paramMatch keys
// add paramMatch values
export type FullPartitionKeys<
  InitialGetters extends EntityKeyResolvers<any>,
  Entity,
  RefParams extends ParamMatchArgs<InitialGetters, Entity>,
> = KeyResolvers<{
  getPartitionKey: SwapParams<InitialGetters['getPartitionKey'], Entity, RefParams['paramMatch']>;
  getRangeKey: SwapParams<InitialGetters['getRangeKey'], Entity, RefParams['paramMatch']>;
}>;

type RefSwapParams = ParamMatchArgs<any, any> & EntityKeyResolvers<any>;

function swapKeys<
  Getter extends EntityKeyResolvers<any>['getPartitionKey'],
  SwapRef extends Record<string, string>,
>(originalGetter: Getter, swapParams: SwapRef): SwapParams<Getter, any, SwapRef> {
  // Overwrites any swap key received, keeping original intact

  const getter = (receivedParams: any): KeyValue =>
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

  const { getPartitionKey, getRangeKey, paramMatch } = params;

  const [partitionGetter, rangeGetter] = [getPartitionKey, getRangeKey].map((getter) =>
    swapKeys(getter, paramMatch),
  );

  return resolveKeys({
    getPartitionKey: partitionGetter,
    getRangeKey: rangeGetter,
  }) as any;
}

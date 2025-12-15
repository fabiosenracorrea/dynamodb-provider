import {
  FirstParameter,
  IsUndefined,
  PrettifyObject,
  StableOmit,
  StringKey,
} from 'types';
import { AnyEntity } from './entity';

/**
 * Params to successfully retrieve your entity, properly
 * inferred by its keys
 */
export type GetEntityParams<T extends AnyEntity> = FirstParameter<T['getKey']>;

/**
 * Params to successfully create your entity, properly
 * inferred by its keys and auto params
 */
export type CreateEntityParams<T extends AnyEntity> = FirstParameter<
  T['getCreationParams']
>;

type InternalUpdateParams<
  T extends AnyEntity,
  __KEY_PARAMS__ = FirstParameter<T['getKey']>,
> = IsUndefined<__KEY_PARAMS__> extends true
  ? Partial<T['__entity']>
  : PrettifyObject<
      __KEY_PARAMS__ & Partial<StableOmit<T['__entity'], StringKey<__KEY_PARAMS__>>>
    >;

/**
 * Params to perform a standard update on your entity,
 * requiring only its key params
 */
export type UpdateEntityParams<T extends AnyEntity> = InternalUpdateParams<T>;

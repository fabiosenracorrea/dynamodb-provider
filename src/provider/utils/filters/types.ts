/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import { AttributeExistenceOperations, BaseConditions, BetweenOperation } from '../conditions';

export type BasicFilterConfig = Pick<BaseConditions<any>, 'operation' | 'type' | 'value'>;

export type BetweenFilterConfig = Pick<
  BetweenOperation<any>,
  'operation' | 'type' | 'high' | 'low'
>;

export type AttributeExistenceFilterConfig = Pick<
  AttributeExistenceOperations<any>,
  'operation' | 'type'
>;

export type FilterConfig = BasicFilterConfig | BetweenFilterConfig | AttributeExistenceFilterConfig;

// https://stackoverflow.com/questions/54520676/in-typescript-how-to-get-the-keys-of-an-object-type-whose-values-are-of-a-given
// type KeysMatching<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];
type KeysWithValuesOfType<T, V> = keyof { [P in keyof T as T[P] extends V ? P : never]: P };

type GoodFilterTargets = string | number | boolean | null | undefined;

type OrArray<T> = T | T[];

export type Filters<Entity = AnyObject> = {
  [Key in KeysWithValuesOfType<Entity, GoodFilterTargets>]?:
    | OrArray<Key extends keyof Entity ? Entity[Key] : any>
    | FilterConfig;
};

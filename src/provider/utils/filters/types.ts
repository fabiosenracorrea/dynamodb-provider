/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import {
  AttributeExistenceExpression,
  BasicExpression,
  BetweenExpression,
  ListExpression,
  EqualityExpression,
} from '../expressions';

export type BasicFilterConfig = Pick<
  BasicExpression<any>,
  'operation' | 'value' | 'joinAs' | 'nested'
>;

export type EqualityFilterConfig = Pick<
  EqualityExpression<any>,
  'operation' | 'value' | 'joinAs' | 'nested'
>;

export type BetweenFilterConfig = Pick<
  BetweenExpression<any>,
  'operation' | 'start' | 'end' | 'joinAs' | 'nested'
>;

export type AttributeExistenceFilterConfig = Pick<
  AttributeExistenceExpression<any>,
  'operation' | 'joinAs' | 'nested'
>;

export type ListFilterConfig = Pick<
  ListExpression<any>,
  'operation' | 'values' | 'joinAs' | 'nested'
>;

export type FilterConfig =
  | BasicFilterConfig
  | BetweenFilterConfig
  | EqualityFilterConfig
  | AttributeExistenceFilterConfig
  | ListFilterConfig;

// https://stackoverflow.com/questions/54520676/in-typescript-how-to-get-the-keys-of-an-object-type-whose-values-are-of-a-given
// type KeysMatching<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];
type KeysWithValuesOfType<T, V> = keyof { [P in keyof T as T[P] extends V ? P : never]: P };

type GoodFilterTargets = string | number | boolean | null | undefined;

// type SafeTarget<T> = IfAny<T, GoodFilterTargets, T>;

type OrArray<T> = T | T[];

export type Filters<Entity = AnyObject> = {
  [Key in KeysWithValuesOfType<Entity, GoodFilterTargets>]?:
    | OrArray<Key extends keyof Entity ? Entity[Key] : any>
    | FilterConfig;
};

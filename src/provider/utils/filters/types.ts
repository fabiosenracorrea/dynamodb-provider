/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types';

import {
  AttributeExistenceExpression,
  BasicExpression,
  BetweenExpression,
  ListExpression,
} from '../expressions';

export type BasicFilterConfig = Pick<BasicExpression<any>, 'operation' | 'value' | 'joinAs'>;

export type BetweenFilterConfig = Pick<
  BetweenExpression<any>,
  'operation' | 'high' | 'low' | 'joinAs'
>;

export type AttributeExistenceFilterConfig = Pick<
  AttributeExistenceExpression<any>,
  'operation' | 'joinAs'
>;

export type ListFilterConfig = Pick<ListExpression<any>, 'operation' | 'values' | 'joinAs'>;

export type FilterConfig =
  | BasicFilterConfig
  | BetweenFilterConfig
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

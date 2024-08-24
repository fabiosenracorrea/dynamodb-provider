import { AnyObject } from 'types/general';

import {
  StringKey,
  ValidateTransactParams,
  WithTransactionImportance,
} from '../../../provider/utils';
import { SingleTableKeyReference } from '../../config';

import { AsSingleTableParams } from './helpers';
import { SingleTableCreateItemParams, SingleTableUpdateParams } from './crud';

export interface SingleTableUpdateTransaction<
  E extends AnyObject = AnyObject,
  PKs extends StringKey<E> | unknown = unknown,
> {
  update: WithTransactionImportance<SingleTableUpdateParams<E, PKs>>;
  create?: never;
  erase?: never;
  validate?: never;
}

export interface SingleTableCreateTransaction<E extends AnyObject = AnyObject> {
  create: WithTransactionImportance<SingleTableCreateItemParams<E>>;
  update?: never;
  erase?: never;
  validate?: never;
}

export interface SingleTableDeleteTransaction {
  erase: WithTransactionImportance<SingleTableKeyReference>;
  update?: never;
  create?: never;
  validate?: never;
}

export type SingleTableValidateTransactParams<Entity extends AnyObject = AnyObject> =
  AsSingleTableParams<ValidateTransactParams<Entity>, 'key' | 'table'>;

export interface SingleTableConditionCheckTransaction<E extends AnyObject = AnyObject> {
  erase?: never;
  update?: never;
  create?: never;
  validate?: SingleTableValidateTransactParams<E>;
}

export type SingleTableTransactionConfig<
  E extends AnyObject = AnyObject,
  PKs extends StringKey<E> | unknown = unknown,
> =
  | SingleTableUpdateTransaction<E, PKs>
  | SingleTableDeleteTransaction
  | SingleTableCreateTransaction<E>
  | SingleTableConditionCheckTransaction<E>;

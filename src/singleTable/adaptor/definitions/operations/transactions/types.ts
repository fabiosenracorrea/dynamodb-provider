import { AnyObject } from 'types';

import { ValidateTransactParams } from 'provider/utils';

import {
  SingleTableCreateItemParams,
  SingleTableDeleteParams,
  SingleTableUpdateParams,
} from '../crud';
import { SingleTableConfig } from '../../config';
import { SingleTableKeyReference } from '../../key';

export interface SingleTableUpdateTransaction<
  TableConfig extends SingleTableConfig = SingleTableConfig,
> {
  update: SingleTableUpdateParams<AnyObject, TableConfig>;
  create?: never;
  erase?: never;
  validate?: never;
}

export interface SingleTableCreateTransaction<
  TableConfig extends SingleTableConfig = SingleTableConfig,
> {
  create: SingleTableCreateItemParams<AnyObject, TableConfig>;
  update?: never;
  erase?: never;
  validate?: never;
}

export interface SingleTableDeleteTransaction {
  erase: SingleTableDeleteParams<AnyObject>;
  update?: never;
  create?: never;
  validate?: never;
}

export type SingleTableValidateTransactParams<Entity extends AnyObject = AnyObject> =
  SingleTableKeyReference & Omit<ValidateTransactParams<Entity>, 'key' | 'table'>;

export interface SingleTableConditionCheckTransaction<E extends AnyObject = AnyObject> {
  erase?: never;
  update?: never;
  create?: never;
  validate?: SingleTableValidateTransactParams<E>;
}

export type SingleTableTransactionConfig<
  TableConfig extends SingleTableConfig = SingleTableConfig,
> =
  | SingleTableUpdateTransaction<TableConfig>
  | SingleTableDeleteTransaction
  | SingleTableCreateTransaction<TableConfig>
  | SingleTableConditionCheckTransaction;

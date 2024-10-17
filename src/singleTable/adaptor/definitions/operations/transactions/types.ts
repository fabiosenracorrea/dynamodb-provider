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
  Entity extends AnyObject = AnyObject,
> {
  update: SingleTableUpdateParams<Entity, TableConfig>;
  create?: never;
  erase?: never;
  validate?: never;
}

export interface SingleTableCreateTransaction<
  TableConfig extends SingleTableConfig = SingleTableConfig,
  Entity extends AnyObject = AnyObject,
> {
  create: SingleTableCreateItemParams<Entity, TableConfig>;
  update?: never;
  erase?: never;
  validate?: never;
}

export interface SingleTableDeleteTransaction<Entity extends AnyObject = AnyObject> {
  erase: SingleTableDeleteParams<Entity>;
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
  Entity extends AnyObject = AnyObject,
> =
  | SingleTableUpdateTransaction<TableConfig, Entity>
  | SingleTableDeleteTransaction<Entity>
  | SingleTableCreateTransaction<TableConfig, Entity>
  | SingleTableConditionCheckTransaction<Entity>;

export type SingleTableTransactConfigGenerator<
  Item extends AnyObject = AnyObject,
  TableConfig extends SingleTableConfig = SingleTableConfig,
> = (
  item: Item,
) =>
  | (SingleTableTransactionConfig<TableConfig, Item> | null)[]
  | SingleTableTransactionConfig<TableConfig, Item>
  | null;

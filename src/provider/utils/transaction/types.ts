import { StringKey } from 'types';
import { ItemExpression } from '../expressions';
import { CreateItemParams, DeleteItemParams, UpdateParams } from '../crud';

export interface UpdateTransaction<
  E extends Record<string, unknown> = Record<string, unknown>,
  PKs extends StringKey<E> | unknown = unknown,
> {
  update: UpdateParams<E, PKs>;
  create?: never;
  erase?: never;
  validate?: never;
}

export interface CreateTransaction<
  E extends Record<string, unknown> = Record<string, unknown>,
> {
  create: CreateItemParams<E, keyof E>;
  update?: never;
  erase?: never;
  validate?: never;
}

export interface DeleteTransaction<
  E extends Record<string, unknown> = Record<string, unknown>,
  PKs extends StringKey<E> | unknown = unknown,
> {
  erase: DeleteItemParams<E, PKs>;
  update?: never;
  create?: never;
  validate?: never;
}

export interface ValidateTransactParams<
  Entity extends Record<string, unknown> = Record<string, unknown>,
  PKs extends StringKey<Entity> | unknown = unknown,
> {
  table: string;
  key: PKs extends StringKey<Entity> ? { [K in PKs]: Entity[K] } : Partial<Entity>;

  conditions: ItemExpression<
    PKs extends StringKey<Entity> ? Omit<Entity, PKs> : Entity
  >[];
}

export interface ConditionCheckTransaction<
  E extends Record<string, unknown> = Record<string, unknown>,
  PKs extends StringKey<E> | unknown = unknown,
> {
  erase?: never;
  update?: never;
  create?: never;
  validate?: ValidateTransactParams<E, PKs>;
}

export type TransactionParams<
  E extends Record<string, unknown> = Record<string, unknown>,
  PKs extends StringKey<E> | unknown = unknown,
> =
  | UpdateTransaction<E, PKs>
  | DeleteTransaction<E, PKs>
  | CreateTransaction<E>
  | ConditionCheckTransaction<E, PKs>;

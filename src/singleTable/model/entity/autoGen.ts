/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyObject, AtLeastOne } from 'types';

import { getId } from 'utils/id';
import { removeUndefinedProps } from 'utils/object';

type LifeCycleParams = AtLeastOne<{
  onUpdate?: boolean;
  onCreation?: boolean;
}>;

type UUIDGen = {
  /**
   * A v4 UUID
   */
  type: 'UUID';
  onCreation: true;
  onUpdate?: false;
};

type KSUIDGen = {
  /**
   * KSUID is for K-Sortable Unique IDentifier. It is a kind of globally unique identifier similar to a RFC 4122 UUID, built from the ground-up to be "naturally" sorted by generation timestamp without any special type-aware logic
   *
   * This means if you generate an ID today and one tomorrow, they will naturally sort like that by default (ASC)
   *
   * This is very useful if you are using it to sort your data on DynamoDB via sort key.
   *
   */
  type: 'KSUID';
  onCreation: true;
  onUpdate?: false;
};

type TimestampGen = {
  /**
   * The ISO timestamp
   *
   * Equivalent to `date.toISOString()`
   *
   * If you need a different format, use a `custom`
   * generator
   */
  type: 'timestamp';
} & LifeCycleParams;

type CountGen = {
  /**
   * Defaults the value to zero
   */
  type: 'count';
} & LifeCycleParams;

type AutoType = (UUIDGen | KSUIDGen | TimestampGen | CountGen)['type'];

type AutoGenOption = AutoType | (() => any);

type AutoGenFieldConfig<Entity> = {
  [Key in keyof Entity]?: AutoGenOption;
};

export type AutoGenParams<Entity> = {
  /**
   * Map your entity keys to the auto generation method or a custom function generator
   *
   * Runs on create calls
   */
  onCreate?: AutoGenFieldConfig<Entity>;

  /**
   * Map your entity keys to the auto generation method or a custom function generator
   *
   * Runs on update calls
   */
  onUpdate?: AutoGenFieldConfig<Entity>;
};

const generators: Record<AutoType, () => any> = {
  KSUID: () => getId('KSUID'),

  UUID: () => getId('UUID'),

  count: () => 0,

  timestamp: () => new Date().toISOString(),
};

export function addAutoGenParams<Values extends AnyObject>(
  values: Values,
  genConfig?: AutoGenFieldConfig<any>,
): Values {
  if (!genConfig) return values;

  const generated = Object.entries(genConfig).map(([prop, genRef]) => [
    prop,
    typeof genRef === 'function' ? genRef() : generators[genRef!]?.(),
  ]);

  return removeUndefinedProps({
    ...values,

    ...Object.fromEntries(generated),
  });
}

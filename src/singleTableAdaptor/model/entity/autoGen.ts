/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types/general';
import { getUniqueID, getUniqueSortableID } from 'utils/id';
import { getCurrentFormattedTime } from 'utils/date';
import { removeUndefinedProperties } from 'utils/object';
import { AtLeastOne } from './helpers';

type CRUDReference = AtLeastOne<{
  onUpdate?: boolean;
  onCreation?: boolean;
}>;

type UUIDGen = {
  type: 'UUID';
  onCreation: true;
  onUpdate?: false;
};

type KSUIDGen = {
  type: 'KSUID';
  onCreation: true;
  onUpdate?: false;
};

type TimestampGen = {
  type: 'timestamp';
} & CRUDReference;

type CountGen = {
  type: 'count';
} & CRUDReference;

type CustomGen = {
  type: 'custom';
  generator: () => any;
} & CRUDReference;

type AutoGenConfigOptions = UUIDGen | KSUIDGen | TimestampGen | CountGen | CustomGen;

export type AutoGenType = AutoGenConfigOptions['type'];

export type AutoGenFieldConfig<Entity extends AnyObject = AnyObject> = {
  [Key in keyof Entity]?: AutoGenConfigOptions;
};

const generators: Record<Exclude<AutoGenType, 'custom'>, () => any> = {
  KSUID: getUniqueSortableID,

  UUID: getUniqueID,

  count: () => 0,

  timestamp: getCurrentFormattedTime,
};

interface AutoGenAdditionParams<Values extends AnyObject> {
  values: Values;
  genConfig?: AutoGenFieldConfig;
  when: 'onUpdate' | 'onCreation';
}

function generate({ type, ...config }: AutoGenConfigOptions): any {
  if (type === 'custom') return (config as CustomGen).generator();

  return generators[type]();
}

export function addAutoGenParams<Values extends AnyObject>({
  genConfig,
  when,
  values,
}: AutoGenAdditionParams<Values>): Values {
  if (!genConfig) return values;

  const toGenerateEntries = Object.entries(genConfig).filter(
    ([, config]) => config?.[when],
  ) as Array<[string, AutoGenConfigOptions]>;

  return removeUndefinedProperties({
    ...values,

    ...Object.fromEntries(
      toGenerateEntries.map(([prop, config]) => [prop, values[prop] ?? generate(config)]),
    ),
  });
}

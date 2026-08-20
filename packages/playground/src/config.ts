import type { AnyEntity, PlaygroundConfig, ResolvedPlaygroundConfig } from './types';

export class ConfigError extends Error {
  constructor(message: string, readonly hint?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export const CONFIG_EXAMPLE = `   import { table, dynamodbProvider } from './src/db'
   import { User, Product } from './src/entities'

   export default {
     table,
     dynamodbProvider,
     entities: { User, Product },
   }`;

function toEntityList(entities: PlaygroundConfig['entities']): AnyEntity[] {
  return Array.isArray(entities) ? entities : Object.values(entities);
}

function isEntity(value: unknown): value is AnyEntity {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as AnyEntity).type === 'string' &&
    typeof (value as AnyEntity).getPartitionKey === 'function'
  );
}

/**
 * Validates a freshly imported config module and normalizes the shapes we let users
 * be loose about, so nothing downstream has to re-check them.
 */
export function resolvePlaygroundConfig(loaded: unknown): ResolvedPlaygroundConfig {
  if (!loaded || typeof loaded !== 'object') {
    throw new ConfigError('Config must export an object', CONFIG_EXAMPLE);
  }

  const config = loaded as Partial<PlaygroundConfig>;

  if (!config.table) {
    throw new ConfigError(
      'Config must include a "table" property (your SingleTable instance)',
      CONFIG_EXAMPLE,
    );
  }

  if (!config.dynamodbProvider) {
    throw new ConfigError(
      'Config must include a "dynamodbProvider" property',
      'Pass the same provider instance you gave to `new SingleTable({ dynamodbProvider })`.\n' +
        '   SingleTable does not expose it, and the playground needs it to scan the table\n' +
        '   and to check the connection.',
    );
  }

  if (!config.entities || typeof config.entities !== 'object') {
    throw new ConfigError(
      'Config must include "entities" — an array, or an object of named entity exports',
      CONFIG_EXAMPLE,
    );
  }

  const entities = toEntityList(config.entities);

  if (!entities.length) {
    throw new ConfigError('Config must include at least one entity', CONFIG_EXAMPLE);
  }

  const invalid = entities.filter((entity) => !isEntity(entity));

  if (invalid.length) {
    throw new ConfigError(
      `Config "entities" contains ${invalid.length} value(s) that are not entities`,
      'Each entry must come from `schema.createEntity<T>().as({...})` or `partition.use(...).create<T>().entity({...})`.',
    );
  }

  return {
    ...config,
    entities,
    collections: config.collections ?? {},
  } as ResolvedPlaygroundConfig;
}

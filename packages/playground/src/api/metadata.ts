import type {
  PlaygroundConfig,
  MetadataResponse,
  EntityMetadata,
  CollectionMetadata,
  TableMetadata,
} from '../types';

function extractTableMetadata(config: PlaygroundConfig): TableMetadata {
  return config.table.config;
}

function extractEntitiesMetadata(
  config: PlaygroundConfig,
): Record<string, EntityMetadata> {
  const result: Record<string, EntityMetadata> = {};

  for (const [name, entity] of Object.entries(config.entities)) {
    result[name] = extractEntityMetadata(name, entity as EntityInstance);
  }

  return result;
}

function extractEntityMetadata(name: string, entity: EntityInstance): EntityMetadata {
  const indexes = entity.indexes ? Object.keys(entity.indexes) : [];
  const rangeQueries = entity.rangeQueries ? Object.keys(entity.rangeQueries) : [];

  // Extract range queries from indexes
  const indexRangeQueries: Record<string, string[]> = {};
  if (entity.indexes) {
    for (const [indexName, index] of Object.entries(entity.indexes)) {
      if (index.rangeQueries) {
        indexRangeQueries[indexName] = Object.keys(index.rangeQueries);
      }
    }
  }

  return {
    name,
    type: entity.type,
    indexes,
    rangeQueries,
    indexRangeQueries,
  };
}

function extractCollectionsMetadata(
  config: PlaygroundConfig,
): Record<string, CollectionMetadata> {
  const result: Record<string, CollectionMetadata> = {};

  if (!config.collections) {
    return result;
  }

  for (const [name, collection] of Object.entries(config.collections)) {
    result[name] = extractCollectionMetadata(name, collection as CollectionInstance);
  }

  return result;
}

function extractCollectionMetadata(
  name: string,
  collection: CollectionInstance,
): CollectionMetadata {
  const joins = collection.join ? Object.keys(collection.join) : [];
  const originEntityType = collection.startRef || null;

  return {
    name,
    type: collection.type,
    originEntityType,
    joins,
  };
}

export function extractMetadata(config: PlaygroundConfig): MetadataResponse {
  return {
    table: extractTableMetadata(config),
    entities: extractEntitiesMetadata(config),
    collections: extractCollectionsMetadata(config),
  };
}

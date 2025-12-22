import type {
  PlaygroundConfig,
  MetadataResponse,
  EntityMetadata,
  CollectionMetadata,
  TableMetadata,
  EntityInstance,
  CollectionInstance,
} from '../types.js'

export function extractMetadata(config: PlaygroundConfig): MetadataResponse {
  return {
    table: extractTableMetadata(config),
    entities: extractEntitiesMetadata(config),
    collections: extractCollectionsMetadata(config),
  }
}

function extractTableMetadata(config: PlaygroundConfig): TableMetadata {
  // Access config property - SingleTable exposes this publicly
  const table = config.table as unknown as { config?: Record<string, unknown> }
  const tableConfig = table.config

  return {
    name: (tableConfig?.table as string) || 'Unknown',
    partitionKey: (tableConfig?.partitionKey as string) || 'pk',
    rangeKey: (tableConfig?.rangeKey as string) || 'sk',
    indexes: (tableConfig?.indexes as Record<string, { partitionKey: string; rangeKey: string }>) || {},
  }
}

function extractEntitiesMetadata(config: PlaygroundConfig): Record<string, EntityMetadata> {
  const result: Record<string, EntityMetadata> = {}

  for (const [name, entity] of Object.entries(config.entities)) {
    result[name] = extractEntityMetadata(name, entity as EntityInstance)
  }

  return result
}

function extractEntityMetadata(name: string, entity: EntityInstance): EntityMetadata {
  const indexes = entity.indexes ? Object.keys(entity.indexes) : []
  const rangeQueries = entity.rangeQueries ? Object.keys(entity.rangeQueries) : []

  // Extract range queries from indexes
  const indexRangeQueries: Record<string, string[]> = {}
  if (entity.indexes) {
    for (const [indexName, index] of Object.entries(entity.indexes)) {
      if (index.rangeQueries) {
        indexRangeQueries[indexName] = Object.keys(index.rangeQueries)
      }
    }
  }

  return {
    name,
    type: entity.type,
    indexes,
    rangeQueries,
    indexRangeQueries,
  }
}

function extractCollectionsMetadata(config: PlaygroundConfig): Record<string, CollectionMetadata> {
  const result: Record<string, CollectionMetadata> = {}

  if (!config.collections) {
    return result
  }

  for (const [name, collection] of Object.entries(config.collections)) {
    result[name] = extractCollectionMetadata(name, collection as CollectionInstance)
  }

  return result
}

function extractCollectionMetadata(name: string, collection: CollectionInstance): CollectionMetadata {
  const joins = collection.join ? Object.keys(collection.join) : []
  const originEntityType = collection.startRef || null

  return {
    name,
    type: collection.type,
    originEntityType,
    joins,
  }
}

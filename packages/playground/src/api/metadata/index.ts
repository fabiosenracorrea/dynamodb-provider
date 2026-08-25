import type { ResolvedPlaygroundConfig, MetadataResponse, TableMetadata } from '../../types';
import { entityToMetadata } from './entity';
import { inferKeyPieces } from './entity/key';

function extractTableMetadata(config: ResolvedPlaygroundConfig): TableMetadata {
  return config.table.config as TableMetadata;
}

export function extractMetadata(config: ResolvedPlaygroundConfig): MetadataResponse {
  return {
    table: extractTableMetadata(config),

    entities: config.entities.map(entityToMetadata),

    // Projected explicitly: spreading the collection walks its whole join tree,
    // dragging every referenced entity object into the response.
    collections: Object.entries(config.collections).map(([name, collection]) => ({
      name,
      type: collection.type,
      partitionKey: inferKeyPieces(collection.getPartitionKey),
      originEntityType: collection.startRef ?? null,
      joins: Object.keys(collection.join),
    })),

    isUpdateEnabled: !!config.enableMutations?.update,
    isDeleteEnabled: !!config.enableMutations?.delete,
  };
}

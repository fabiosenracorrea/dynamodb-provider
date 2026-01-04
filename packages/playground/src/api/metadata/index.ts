import type { PlaygroundConfig, MetadataResponse, TableMetadata } from '../../types';
import { entityToMetadata } from './entity';
import { inferKeyPieces } from './entity/key';

function extractTableMetadata(config: PlaygroundConfig): TableMetadata {
  return config.table.config;
}

export function extractMetadata(config: PlaygroundConfig): MetadataResponse {
  return {
    table: extractTableMetadata(config),

    entities: config.entities.map(entityToMetadata),

    collections: Object.entries(config.collections ?? {})?.map(([name, collection]) => ({
      ...collection,
      name,
      partitionKey: inferKeyPieces(collection.getPartitionKey),
      originEntityType: collection.startRef ?? null,
      joins: Object.keys(collection.join),
    })),

    isUpdateEnabled: !!config.enableMutations?.update,
    isDeleteEnabled: !!config.enableMutations?.delete,
  };
}

import type { PlaygroundConfig, MetadataResponse, TableMetadata } from '../types';
import { entityToMetadata } from './entity';
import { inferKeyPieces } from './entity/key';

function extractTableMetadata(config: PlaygroundConfig): TableMetadata {
  return config.table.config;
}

export function extractMetadata(config: PlaygroundConfig): MetadataResponse {
  return {
    table: extractTableMetadata(config),

    entities: config.entities.map(entityToMetadata),

    collections:
      config.collections?.map((collection, index) => ({
        ...collection,
        index,
        name: `${index}`,
        partitionKey: inferKeyPieces(collection.getPartitionKey),
        originEntityType: collection.startRef?.type ?? null,
        joins: Object.keys(collection.join),
      })) ?? [],
  };
}

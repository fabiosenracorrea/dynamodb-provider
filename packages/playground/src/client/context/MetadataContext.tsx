import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchMetadata,
  type Metadata,
  type EntityMetadata,
  type CollectionMetadata,
  type TableMetadata,
} from '@/utils/api';
import type { KeyPiece, PartitionGroup } from '@/types';

export interface PartitionInfo {
  id: string;
  name: string;
  type: 'main' | 'index';
  partitionKey: string;
  rangeKey: string;
}

interface MetadataContextValue {
  metadata: Metadata | null;
  isLoading: boolean;
  error: Error | null;

  // Direct accessors
  table: TableMetadata | null;
  entities: EntityMetadata[];
  collections: CollectionMetadata[];

  // Partition groups (entities sharing same partition key pattern)
  partitionGroups: PartitionGroup[];

  // Lookup helpers
  getEntity: (type: string) => EntityMetadata | undefined;
  getCollection: (name: string) => CollectionMetadata | undefined;
  getPartitionInfo: (id: string) => PartitionInfo | null;
  getPartitionGroup: (id: string) => PartitionGroup | undefined;

  // Maps for O(1) lookup
  entityMap: Record<string, EntityMetadata>;
  collectionMap: Record<string, CollectionMetadata>;
  partitionGroupMap: Record<string, PartitionGroup>;
}

const MetadataContext = createContext<MetadataContextValue | null>(null);

function buildPattern(pieces: KeyPiece[]): string {
  return pieces
    .map((piece) => (piece.type === 'CONSTANT' ? piece.value : '{value}'))
    .join('#');
}

function buildPartitionGroups(entities: EntityMetadata[]): PartitionGroup[] {
  const groupMap = new Map<string, { source: string; sourceType: 'main' | 'index'; entities: string[] }>();

  for (const entity of entities) {
    // Main table partition
    const mainPattern = buildPattern(entity.partitionKey);
    const mainKey = `TABLE|${mainPattern}`;

    if (!groupMap.has(mainKey)) {
      groupMap.set(mainKey, { source: 'TABLE', sourceType: 'main', entities: [] });
    }
    groupMap.get(mainKey)!.entities.push(entity.type);

    // Index partitions
    for (const idx of entity.indexes) {
      const indexPattern = buildPattern(idx.partitionKey);
      const indexKey = `${idx.index}|${indexPattern}`;

      if (!groupMap.has(indexKey)) {
        groupMap.set(indexKey, { source: idx.index, sourceType: 'index', entities: [] });
      }
      groupMap.get(indexKey)!.entities.push(entity.type);
    }
  }

  // Filter to only groups with 2+ entities
  const groups: PartitionGroup[] = [];

  for (const [key, value] of groupMap) {
    if (value.entities.length >= 2) {
      const [, pattern] = key.split('|');
      groups.push({
        id: key,
        pattern,
        source: value.source,
        sourceType: value.sourceType,
        entities: value.entities,
      });
    }
  }

  // Sort: TABLE first, then indexes alphabetically, then by pattern
  return groups.sort((a, b) => {
    if (a.sourceType !== b.sourceType) {
      return a.sourceType === 'main' ? -1 : 1;
    }
    if (a.source !== b.source) {
      return a.source.localeCompare(b.source);
    }
    return a.pattern.localeCompare(b.pattern);
  });
}

export function MetadataProvider({ children }: { children: ReactNode }) {
  const {
    data: metadata,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['metadata'],
    queryFn: fetchMetadata,
  });

  const entityMap = useMemo(() => {
    if (!metadata) return {};
    return Object.fromEntries(metadata.entities.map((e) => [e.type, e]));
  }, [metadata]);

  const collectionMap = useMemo(() => {
    if (!metadata) return {};
    return Object.fromEntries(metadata.collections.map((c) => [c.name, c]));
  }, [metadata]);

  const partitionGroups = useMemo(() => {
    if (!metadata) return [];
    return buildPartitionGroups(metadata.entities);
  }, [metadata]);

  const partitionGroupMap = useMemo(() => {
    return Object.fromEntries(partitionGroups.map((g) => [g.id, g]));
  }, [partitionGroups]);

  const getEntity = (type: string) => entityMap[type];

  const getCollection = (name: string) => collectionMap[name];

  const getPartitionInfo = (id: string): PartitionInfo | null => {
    if (!metadata) return null;

    if (id === 'main') {
      return {
        id: 'main',
        name: 'Main Table',
        type: 'main',
        partitionKey: metadata.table.partitionKey,
        rangeKey: metadata.table.rangeKey,
      };
    }

    const indexConfig = metadata.table.indexes[id];
    if (indexConfig) {
      return {
        id,
        name: id,
        type: 'index',
        partitionKey: indexConfig.partitionKey,
        rangeKey: indexConfig.rangeKey,
      };
    }

    return null;
  };

  const getPartitionGroup = (id: string) => partitionGroupMap[id];

  const value: MetadataContextValue = {
    metadata: metadata ?? null,
    isLoading,
    error: error as Error | null,

    table: metadata?.table ?? null,
    entities: metadata?.entities ?? [],
    collections: metadata?.collections ?? [],

    partitionGroups,

    getEntity,
    getCollection,
    getPartitionInfo,
    getPartitionGroup,

    entityMap,
    collectionMap,
    partitionGroupMap,
  };

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}

export function useMetadataContext() {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetadataContext must be used within a MetadataProvider');
  }
  return context;
}

// Convenience hooks for specific data
export function useTable() {
  const { table } = useMetadataContext();
  return table;
}

export function useEntities() {
  const { entities } = useMetadataContext();
  return entities;
}

export function useEntity(type: string) {
  const { getEntity } = useMetadataContext();
  return getEntity(type);
}

export function useCollections() {
  const { collections } = useMetadataContext();
  return collections;
}

export function useCollection(name: string) {
  const { getCollection } = useMetadataContext();
  return getCollection(name);
}

export function usePartitionInfo(id: string) {
  const { getPartitionInfo } = useMetadataContext();
  return getPartitionInfo(id);
}

export function usePartitionGroups() {
  const { partitionGroups } = useMetadataContext();
  return partitionGroups;
}

export function usePartitionGroup(id: string) {
  const { getPartitionGroup } = useMetadataContext();
  return getPartitionGroup(id);
}

/* eslint-disable no-restricted-syntax */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  fetchMetadata,
  type Metadata,
  type EntityMetadata,
  type CollectionMetadata,
  type TableMetadata,
  type KeyPiece,
  type PartitionGroup,
} from '@/utils/api';
import { buildKeyPattern, partitionGroupId } from '@/utils/keys';

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

type GroupDraft = Omit<PartitionGroup, 'id'>;

function buildPartitionGroups(entities: EntityMetadata[], separator: string): PartitionGroup[] {
  const groupMap = new Map<string, GroupDraft>();

  const add = (
    source: string,
    sourceType: GroupDraft['sourceType'],
    pieces: KeyPiece[],
    entityType: string,
  ) => {
    const pattern = buildKeyPattern(pieces, separator);
    const id = partitionGroupId(source, pattern);

    if (!groupMap.has(id)) {
      groupMap.set(id, { pattern, source, sourceType, entities: [] });
    }

    groupMap.get(id)!.entities.push(entityType);
  };

  for (const entity of entities) {
    add('TABLE', 'main', entity.partitionKey, entity.type);

    for (const index of entity.indexes) {
      add(index.index, 'index', index.partitionKey, entity.type);
    }
  }

  // A "shared" partition needs at least two entities in it; a solo entity's partition
  // is just that entity, and is reachable from its own page.
  const groups: PartitionGroup[] = [];

  for (const [id, draft] of groupMap) {
    if (draft.entities.length >= 2) groups.push({ id, ...draft });
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

    return buildPartitionGroups(metadata.entities, metadata.table.keySeparator ?? '#');
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

    const indexConfig = metadata.table.indexes?.[id];

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

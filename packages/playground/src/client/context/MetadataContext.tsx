import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchMetadata,
  type Metadata,
  type EntityMetadata,
  type CollectionMetadata,
  type TableMetadata,
} from '@/utils/api';

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

  // Lookup helpers
  getEntity: (type: string) => EntityMetadata | undefined;
  getCollection: (name: string) => CollectionMetadata | undefined;
  getPartitionInfo: (id: string) => PartitionInfo | null;

  // Maps for O(1) lookup
  entityMap: Record<string, EntityMetadata>;
  collectionMap: Record<string, CollectionMetadata>;
}

const MetadataContext = createContext<MetadataContextValue | null>(null);

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

  const value: MetadataContextValue = {
    metadata: metadata ?? null,
    isLoading,
    error: error as Error | null,

    table: metadata?.table ?? null,
    entities: metadata?.entities ?? [],
    collections: metadata?.collections ?? [],

    getEntity,
    getCollection,
    getPartitionInfo,

    entityMap,
    collectionMap,
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

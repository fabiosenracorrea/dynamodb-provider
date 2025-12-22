// Types for the playground

export interface PlaygroundConfig {
  table: SingleTableInstance;
  entities: Record<string, EntityInstance>;
  collections?: Record<string, CollectionInstance>;
  port?: number;
}

// These are loose types since we're accepting user's instances
export interface SingleTableInstance {
  schema: {
    from: (entityOrCollection: unknown) => unknown;
  };
  query: (params: unknown) => Promise<unknown>;
  // Internal config access
  _config?: {
    table?: string;
    partitionKey?: string;
    rangeKey?: string;
    indexes?: Record<string, { partitionKey: string; rangeKey: string }>;
  };
}

export interface EntityInstance {
  type: string;
  __dbType: 'ENTITY';
  getPartitionKey: (...args: unknown[]) => unknown;
  getRangeKey: (...args: unknown[]) => unknown;
  indexes?: Record<string, IndexInstance>;
  rangeQueries?: Record<string, (...args: unknown[]) => unknown>;
}

export interface CollectionInstance {
  type: 'SINGLE' | 'MULTIPLE';
  __dbType: 'COLLECTION';
  originEntity?: EntityInstance | null;
  startRef?: string | null;
  join?: Record<string, JoinConfig>;
}

export interface IndexInstance {
  index: string;
  getPartitionKey: (...args: unknown[]) => unknown;
  getRangeKey: (...args: unknown[]) => unknown;
  rangeQueries?: Record<string, (...args: unknown[]) => unknown>;
}

export interface JoinConfig {
  ref: string;
  entity: EntityInstance;
  type: 'SINGLE' | 'MULTIPLE';
}

// API Response types
export interface MetadataResponse {
  table: TableMetadata;
  entities: Record<string, EntityMetadata>;
  collections: Record<string, CollectionMetadata>;
}

export interface TableMetadata {
  name: string;
  partitionKey: string;
  rangeKey: string;
  indexes: Record<string, { partitionKey: string; rangeKey: string }>;
}

export interface EntityMetadata {
  name: string;
  type: string;
  indexes: string[];
  rangeQueries: string[];
  indexRangeQueries: Record<string, string[]>;
}

export interface CollectionMetadata {
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  originEntityType: string | null;
  joins: string[];
}

export interface ExecuteRequest {
  target: 'entity' | 'collection' | 'table';
  name: string;
  operation: string;
  index?: string;
  params: Record<string, unknown>;
}

export interface ExecuteResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

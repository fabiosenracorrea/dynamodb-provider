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

export interface Metadata {
  table: TableMetadata;
  entities: Record<string, EntityMetadata>;
  collections: Record<string, CollectionMetadata>;
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

export async function fetchMetadata(): Promise<Metadata> {
  const res = await fetch('/api/metadata');
  if (!res.ok) {
    throw new Error('Failed to fetch metadata');
  }
  return res.json();
}

export async function execute(request: ExecuteRequest): Promise<ExecuteResponse> {
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return res.json();
}

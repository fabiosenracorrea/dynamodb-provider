export interface TableMetadata {
  name: string;
  partitionKey: string;
  rangeKey: string;
  indexes: Record<string, { partitionKey: string; rangeKey: string; numeric?: boolean }>;
  typeIndex?: { name: string; partitionKey: string };
  expiresAt?: string;
}

export interface KeyPiece {
  type: 'CONSTANT' | 'VARIABLE';
  numeric?: boolean;
  value: string;
}

export interface RangeQuery {
  name: string;
  operation: string;
  params: string[];
}

export interface EntityIndex {
  name: string;
  index: string;
  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
  rangeQueries: RangeQuery[];
}

export interface EntityMetadata {
  name: string;
  type: string;
  index: number;
  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
  rangeQueries: RangeQuery[];
  indexes: EntityIndex[];
}

export interface CollectionMetadata {
  index: number;
  name: string;
  partitionKey: KeyPiece[];
  originEntityType: string | null;
  joins: string[];
}

export interface Metadata {
  table: TableMetadata;
  entities: EntityMetadata[];
  collections: CollectionMetadata[];
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

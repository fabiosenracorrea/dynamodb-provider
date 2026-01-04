import { EntityMetadata, MetadataResponse } from '../../types';

export type * from '../../types';

export type EntityIndex = EntityMetadata['indexes'][number];

export type Metadata = MetadataResponse;

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

export interface ResolveKeysRequest {
  entityType: string;
  data: Record<string, unknown>;
}

export interface ResolveKeysResponse {
  success: boolean;
  partitionKey?: string;
  rangeKey?: string;
  error?: string;
}

export async function resolveKeys(
  request: ResolveKeysRequest,
): Promise<ResolveKeysResponse> {
  const res = await fetch('/api/resolve-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return res.json();
}

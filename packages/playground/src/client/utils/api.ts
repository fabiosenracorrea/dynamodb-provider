import { EntityMetadata, MetadataResponse } from '../../types';
import type { CallDescriptor } from '../../api/core/operation';
import type { ConnectionStatus } from '../../api/routes/connection';

export type * from '../../types';
export type { CallDescriptor, ConnectionStatus };

export type EntityIndex = EntityMetadata['indexes'][number];

export type Metadata = MetadataResponse;

export interface ExecuteRequest {
  target: 'entity' | 'collection' | 'table';
  name: string;
  operation: string;
  /** Entity index NAME for entity queries; physical table index for table queries. */
  index?: string;
  /** A named `rangeQuery` on the entity or on the selected index. */
  rangeQuery?: string;
  params: Record<string, unknown>;
}

export interface ExecuteMeta {
  durationMs: number;
  count?: number;
  call: CallDescriptor;
}

export interface ExecuteResponse {
  success: boolean;
  data?: unknown;
  paginationToken?: string;
  meta?: ExecuteMeta;
  error?: string;
  issues?: Array<{ path: string; message: string }>;
}

async function post<T>(path: string, request: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  return res.json();
}

export async function fetchMetadata(): Promise<Metadata> {
  const res = await fetch('/api/metadata');

  if (!res.ok) throw new Error('Failed to fetch metadata');

  return res.json();
}

export async function fetchConnection(): Promise<ConnectionStatus> {
  const res = await fetch('/api/connection');

  return res.json();
}

export function execute(request: ExecuteRequest): Promise<ExecuteResponse> {
  return post('/api/execute', request);
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

export function resolveKeys(request: ResolveKeysRequest): Promise<ResolveKeysResponse> {
  return post('/api/resolve-keys', request);
}

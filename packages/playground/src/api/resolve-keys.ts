import type { PlaygroundConfig } from '../types';

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

function normalizeKeyResult(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  return [result];
}

function joinKeyParts(parts: unknown[], separator: string): string {
  return parts.map((part) => String(part)).join(separator);
}

export function resolveKeys(
  config: PlaygroundConfig,
  request: ResolveKeysRequest,
): ResolveKeysResponse {
  const { entityType, data } = request;

  const entity = config.entities.find((e) => e.type === entityType);

  if (!entity) {
    return { success: false, error: `Entity not found: ${entityType}` };
  }

  const separator = config.table.config.keySeparator ?? '#';

  const pkParts = normalizeKeyResult(entity.getPartitionKey(data));
  const skParts = normalizeKeyResult(entity.getRangeKey(data));

  return {
    success: true,
    partitionKey: joinKeyParts(pkParts, separator),
    rangeKey: joinKeyParts(skParts, separator),
  };
}

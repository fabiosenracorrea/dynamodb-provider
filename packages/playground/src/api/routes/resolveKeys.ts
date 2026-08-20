import { z } from 'zod';

import type { OperationContext } from '../lib/operation';
import { parseWith } from '../lib/validate';
import { keyParamsSchema } from '../schemas/common';
import { resolveEntity } from '../operations/resolveTarget';

const requestSchema = z.object({
  entityType: z.string().min(1),
  data: keyParamsSchema,
});

export interface ResolvedKeys {
  partitionKey: string;
  rangeKey: string;
}

function joinKey(parts: unknown, separator: string): string {
  return (Array.isArray(parts) ? parts : [parts]).map(String).join(separator);
}

export function resolveKeysRoute(ctx: OperationContext, body: unknown): ResolvedKeys {
  const { entityType, data } = parseWith(requestSchema, body, 'request');

  const entity = resolveEntity(ctx, entityType);
  const separator = ctx.metadata.table.keySeparator ?? '#';

  return {
    partitionKey: joinKey(entity.getPartitionKey(data), separator),
    rangeKey: joinKey(entity.getRangeKey(data), separator),
  };
}

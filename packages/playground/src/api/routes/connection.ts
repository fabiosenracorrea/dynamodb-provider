import { toErrorMessage, OperationContext } from '../core';

export interface ConnectionStatus {
  connected: boolean;
  table: string;
  target: string;
  error?: string;
}

/**
 * Cheapest possible read against the configured table. Kept off `/api/metadata` so
 * metadata stays synchronous and the UI can re-check after you start your database.
 */
export async function connectionRoute(ctx: OperationContext): Promise<ConnectionStatus> {
  const { table } = ctx.metadata.table;

  const target = ctx.provider.target ?? 'unknown';

  const base = { table, target };

  try {
    await ctx.provider.list(table, { limit: 1 });

    return { connected: true, ...base };
  } catch (error) {
    return { connected: false, error: toErrorMessage(error), ...base };
  }
}

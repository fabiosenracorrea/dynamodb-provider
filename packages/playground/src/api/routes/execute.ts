/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlaygroundError, parseWith, OperationContext, OperationResult } from '../core';
import { findOperation, operationsFor } from '../operations';
import { resolveCollection, resolveEntity } from '../operations/resolveTarget';
import { executeRequestSchema } from '../schemas/execute';

export interface ExecuteOutcome {
  data: unknown;
  paginationToken?: string;
  meta: {
    durationMs: number;
    count?: number;
    call: OperationResult['call'];
  };
}

function assertMutationAllowed(ctx: OperationContext, kind?: string): void {
  if (!kind) return;

  const enabled = ctx.config.enableMutations?.[kind as 'create' | 'update' | 'delete'];

  if (!enabled) {
    throw PlaygroundError.forbidden(
      `${kind} is disabled. Set enableMutations.${kind} to true in your playground config to allow it.`,
    );
  }
}

function countOf(data: unknown): number | undefined {
  return Array.isArray(data) ? data.length : undefined;
}

function runOperation(
  ctx: OperationContext,
  // eslint-disable-next-line @typescript-eslint/ban-types
  definition: ReturnType<typeof findOperation> & {},
  { name, params, index, rangeQuery }: any,
): Promise<OperationResult> {
  const shared = { ctx, params, index, rangeQuery };

  if (definition.target === 'entity') {
    const entity = resolveEntity(ctx, name);

    return definition.run({
      ...shared,
      entity,
      repo: (ctx.table.schema as any).from(entity),
    });
  }

  if (definition.target === 'collection') {
    const collection = resolveCollection(ctx, name);

    return definition.run({
      ...shared,
      collection,
      collectionName: name,
      repo: (ctx.table.schema as any).from(collection),
    });
  }

  return definition.run(shared);
}

export async function executeRoute(
  ctx: OperationContext,
  body: unknown,
): Promise<ExecuteOutcome> {
  const request = parseWith(executeRequestSchema, body, 'request');

  const { target, name, operation, index, rangeQuery, params: rawParams } = request;

  const definition = findOperation(target, operation);

  if (!definition) {
    throw PlaygroundError.notFound(
      `Unknown ${target} operation "${operation}". Available: ${operationsFor(
        target,
      ).join(', ')}`,
    );
  }

  assertMutationAllowed(ctx, definition.mutation);

  const params = parseWith(definition.params, rawParams, 'params');

  const startedAt = Date.now();

  const { data, paginationToken, call } = await runOperation(ctx, definition, {
    name,
    params,
    index,
    rangeQuery,
  });

  return {
    data,
    paginationToken,
    meta: {
      call,
      count: countOf(data),
      durationMs: Date.now() - startedAt,
    },
  };
}

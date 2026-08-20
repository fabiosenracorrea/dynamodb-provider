import { z } from 'zod';

import { PlaygroundError } from '../../lib/errors';
import { defineEntityOperation } from '../../lib/operation';
import { describeCall, entityCallPath } from '../../lib/callDescriptor';
import { keyParamsSchema, queryOptionsSchema } from '../../schemas/common';

/**
 * Key values, named-range-query values and query options all arrive in one flat
 * object — that is what the library's key getters and `getValues` read from.
 */
const paramsSchema = keyParamsSchema.and(
  queryOptionsSchema.extend({
    mode: z.enum(['page', 'one', 'all']).optional(),
  }),
);

type QueryNode = Record<string, unknown> & {
  custom?: (params: unknown) => Promise<unknown>;
};

function resolveIndexNode(repo: Record<string, QueryNode>, index: string): QueryNode {
  const node = repo.queryIndex?.[index as keyof QueryNode] as QueryNode | undefined;

  if (!node) {
    throw PlaygroundError.notFound(
      `Index "${index}" is not defined on this entity. Use the entity's index name, not the table's.`,
    );
  }

  return node;
}

function resolveRangeQuery(node: QueryNode, rangeQuery: string, where: string): QueryNode {
  const caller = node[rangeQuery];

  if (typeof caller !== 'function') {
    throw PlaygroundError.notFound(`Range query "${rangeQuery}" is not defined on ${where}`);
  }

  return caller as unknown as QueryNode;
}

export const entityQuery = defineEntityOperation({
  operation: 'query',
  params: paramsSchema,

  async run({ repo, entity, params, index, rangeQuery }) {
    const root: QueryNode = index
      ? resolveIndexNode(repo, index)
      : (repo.query as QueryNode);

    // A named range query IS the callable; only the plain query has `.custom`.
    const target = rangeQuery
      ? resolveRangeQuery(root, rangeQuery, index ? `index "${index}"` : 'this entity')
      : root;

    const { mode = 'page', ...queryParams } = params as { mode?: 'page' | 'one' | 'all' };

    const caller =
      // eslint-disable-next-line no-nested-ternary
      mode === 'page'
        ? rangeQuery
          ? (target as unknown as (p: unknown) => Promise<unknown>)
          : target.custom!
        : (target[mode] as (p: unknown) => Promise<unknown>);

    const result = (await caller(queryParams)) as
      | { items?: unknown[]; paginationToken?: string }
      | unknown[]
      | undefined;

    const call = describeCall(
      `${entityCallPath(entity.type, 'query', { index, rangeQuery })}${
        mode === 'page' ? '' : `.${mode}`
      }`,
      [queryParams],
    );

    if (Array.isArray(result) || !result || !('items' in result)) {
      return { data: result ?? null, call };
    }

    return {
      data: result.items ?? [],
      paginationToken: result.paginationToken,
      call,
    };
  },
});

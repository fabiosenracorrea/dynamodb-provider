import { z } from 'zod';

import { PlaygroundError } from '../../core/errors';
import { defineTableOperation } from '../../core/operation';
import { describeCall } from '../../core/callDescriptor';
import { keyValueSchema, queryOptionsSchema } from '../../schemas/common';

const paramsSchema = queryOptionsSchema.extend({
  partition: z.union([keyValueSchema, z.array(keyValueSchema)]),

  /**
   * Bypass SingleTable and query the provider directly, keeping the internal
   * columns (`_pk`, `_sk`, `_type`) that `autoRemoveTableProperties` strips.
   * Browsing a raw partition is exactly when you want to see them — and `_type`
   * is what lets the UI colour a mixed-entity result.
   */
  raw: z.boolean().optional(),
});

export const tableQuery = defineTableOperation({
  operation: 'query',
  params: paramsSchema,

  /**
   * Entity-free partition query. `index` is the physical table index here (the
   * partition view browses raw partitions, not an entity's named indexes) and it
   * has to reach the query — previously it was dropped, so every index partition
   * silently read from the base table.
   */
  async run({ ctx, params, index }) {
    const { indexes, keySeparator = '#', table } = ctx.metadata.table;

    if (index && !indexes?.[index]) {
      throw PlaygroundError.notFound(`Index "${index}" is not configured on this table`);
    }

    const { raw, partition, range, ...options } = params;
    const onIndex = index ? indexes![index] : undefined;

    if (!raw) {
      const queryParams = { partition, range, ...options, ...(index ? { index } : {}) };

      const { items, paginationToken } = await ctx.table.query(queryParams as never);

      return {
        data: items,
        paginationToken,
        call: describeCall('table.query', [queryParams]),
      };
    }

    const providerParams = {
      table,
      ...options,
      ...(index ? { index } : {}),

      partitionKey: {
        name: onIndex ? onIndex.partitionKey : ctx.metadata.table.partitionKey,
        value: (Array.isArray(partition) ? partition : [partition]).join(keySeparator),
      },

      ...(range
        ? {
            rangeKey: {
              ...range,
              name: onIndex ? onIndex.rangeKey : ctx.metadata.table.rangeKey,
            },
          }
        : {}),
    };

    const { items, paginationToken } = await ctx.provider.query(providerParams as never);

    return {
      data: items,
      paginationToken,
      call: describeCall('provider.query', [providerParams]),
    };
  },
});

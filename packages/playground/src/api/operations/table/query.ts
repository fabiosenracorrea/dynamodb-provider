import { z } from 'zod';

import { PlaygroundError } from '../../core/errors';
import { defineTableOperation } from '../../core/operation';
import { describeCall } from '../../core/callDescriptor';
import { keyValueSchema, queryOptionsSchema } from '../../schemas/common';

const paramsSchema = queryOptionsSchema.extend({
  partition: z.union([keyValueSchema, z.array(keyValueSchema)]),
});

export const tableQuery = defineTableOperation({
  operation: 'query',
  params: paramsSchema,

  /**
   * Entity-free partition query. `index` is the physical table index here (the
   * partition view browses raw partitions, not an entity's named indexes) and it
   * has to reach `table.query` — previously it was dropped, so every index
   * partition silently read from the base table.
   */
  async run({ ctx, params, index }) {
    if (index && !ctx.metadata.table.indexes?.[index]) {
      throw PlaygroundError.notFound(`Index "${index}" is not configured on this table`);
    }

    const queryParams = { ...params, ...(index ? { index } : {}) };

    const { items, paginationToken } = await ctx.table.query(queryParams as never);

    return {
      data: items,
      paginationToken,
      call: describeCall('table.query', [queryParams]),
    };
  },
});

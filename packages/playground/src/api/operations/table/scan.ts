import { z } from 'zod';

import { PlaygroundError } from '../../lib/errors';
import { defineTableOperation } from '../../lib/operation';
import { describeCall } from '../../lib/callDescriptor';
import { filtersSchema, paginationSchema } from '../../schemas/common';

const paramsSchema = paginationSchema.omit({ fullRetrieval: true }).extend({
  filters: filtersSchema.optional(),
  propertiesToRetrieve: z.array(z.string()).optional(),
  consistentRead: z.boolean().optional(),
  index: z.string().optional(),
});

export const tableScan = defineTableOperation({
  operation: 'scan',
  params: paramsSchema,

  /**
   * Goes to the provider rather than SingleTable, which has no scan. Works with or
   * without a `typeIndex`, which is the point — it is the "what is actually in
   * there" escape hatch.
   */
  async run({ ctx, params }) {
    const { index } = params;

    if (index && !ctx.metadata.table.indexes?.[index]) {
      throw PlaygroundError.notFound(`Index "${index}" is not configured on this table`);
    }

    const tableName = ctx.metadata.table.table;

    const { items, paginationToken } = await ctx.provider.list(tableName, params as never);

    return {
      data: items,
      paginationToken,
      call: describeCall('provider.list', [tableName, params]),
    };
  },
});

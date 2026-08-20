import { z } from 'zod';

import { PlaygroundError } from '../../core/errors';
import { defineTableOperation } from '../../core/operation';
import { describeCall } from '../../core/callDescriptor';
import { queryOptionsSchema } from '../../schemas/common';

const paramsSchema = queryOptionsSchema.extend({
  type: z.string().min(1),
});

export const tableListType = defineTableOperation({
  operation: 'listType',
  params: paramsSchema,

  async run({ ctx, params }) {
    if (!ctx.metadata.table.typeIndex) {
      throw PlaygroundError.badRequest(
        'Listing by type requires `typeIndex` to be configured on your SingleTable.',
      );
    }

    const { items, paginationToken } = await ctx.table.listType(params as never);

    return {
      data: items,
      paginationToken,
      call: describeCall('table.listType', [params]),
    };
  },
});

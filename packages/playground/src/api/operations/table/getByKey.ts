import { z } from 'zod';

import { defineTableOperation } from '../../core/operation';
import { describeCall } from '../../core/callDescriptor';

const paramsSchema = z.object({
  partitionKey: z.string().min(1),
  rangeKey: z.string().min(1),
  consistentRead: z.boolean().optional(),
});

export const tableGetByKey = defineTableOperation({
  operation: 'getByKey',
  params: paramsSchema,

  /**
   * Fetch by the literal pk/sk strings, for when you have a key out of a log and no
   * interest in which entity it belongs to.
   */
  async run({ ctx, params: { partitionKey, rangeKey, consistentRead } }) {
    const { table, partitionKey: pkName, rangeKey: skName } = ctx.metadata.table;

    const providerParams = {
      table,
      consistentRead,
      key: { [pkName]: partitionKey, [skName]: rangeKey },
    };

    const data = await ctx.provider.get(providerParams as never);

    return {
      data: data ?? null,
      call: describeCall('provider.get', [providerParams]),
    };
  },
});

import { z } from 'zod';

import { defineEntityOperation } from '../../core/operation';
import { describeCall, entityCallPath } from '../../core/callDescriptor';
import { keyParamsSchema } from '../../schemas/common';

const paramsSchema = z.object({
  keys: z.array(keyParamsSchema).min(1),
  consistentRead: z.boolean().optional(),
  propertiesToRetrieve: z.array(z.string()).optional(),
  maxRetries: z.number().int().nonnegative().optional(),
  throwOnUnprocessed: z.boolean().optional(),
});

export const entityBatchGet = defineEntityOperation({
  operation: 'batchGet',
  params: paramsSchema,

  /**
   * Goes through the library's `batchGet` rather than N parallel gets, so DynamoDB's
   * 100-key chunking and the unprocessed-key retries actually happen.
   */
  async run({ repo, entity, params }) {
    const data = await repo.batchGet(params);

    return {
      data,
      call: describeCall(entityCallPath(entity.type, 'batchGet'), [params]),
    };
  },
});

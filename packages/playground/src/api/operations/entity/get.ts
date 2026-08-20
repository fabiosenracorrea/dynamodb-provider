import { z } from 'zod';

import { defineEntityOperation } from '../../lib/operation';
import { describeCall, entityCallPath } from '../../lib/callDescriptor';
import { keyParamsSchema } from '../../schemas/common';

const paramsSchema = keyParamsSchema.and(
  z.object({
    consistentRead: z.boolean().optional(),
    propertiesToRetrieve: z.array(z.string()).optional(),
  }),
);

export const entityGet = defineEntityOperation({
  operation: 'get',
  params: paramsSchema,

  async run({ repo, entity, params }) {
    const data = await repo.get(params);

    return {
      data: data ?? null,
      call: describeCall(entityCallPath(entity.type, 'get'), [params]),
    };
  },
});

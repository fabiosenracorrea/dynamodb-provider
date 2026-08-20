import { z } from 'zod';

import { defineEntityOperation } from '../../lib/operation';
import { describeCall, entityCallPath } from '../../lib/callDescriptor';
import {
  atomicOperationsSchema,
  itemConditionsSchema,
  keyParamsSchema,
} from '../../schemas/common';

const paramsSchema = keyParamsSchema.and(
  z.object({
    values: z.record(z.string(), z.unknown()).optional(),
    remove: z.array(z.string()).optional(),
    atomicOperations: atomicOperationsSchema.optional(),
    conditions: itemConditionsSchema.optional(),
    expiresAt: z.number().optional(),
    returnUpdatedProperties: z.boolean().optional(),
  }),
);

export const entityUpdate = defineEntityOperation({
  operation: 'update',
  params: paramsSchema,
  mutation: 'update',

  async run({ repo, entity, params }) {
    const data = await repo.update(params);

    return {
      data: data ?? null,
      call: describeCall(entityCallPath(entity.type, 'update'), [params]),
    };
  },
});

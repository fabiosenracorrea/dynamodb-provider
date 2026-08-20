import { z } from 'zod';

import { defineEntityOperation } from '../../lib/operation';
import { describeCall, entityCallPath } from '../../lib/callDescriptor';
import { itemConditionsSchema, keyParamsSchema } from '../../schemas/common';

const paramsSchema = keyParamsSchema.and(
  z.object({
    conditions: itemConditionsSchema.optional(),
  }),
);

export const entityDelete = defineEntityOperation({
  operation: 'delete',
  params: paramsSchema,
  mutation: 'delete',

  async run({ repo, entity, params }) {
    await repo.delete(params);

    return {
      data: { deleted: true },
      call: describeCall(entityCallPath(entity.type, 'delete'), [params]),
    };
  },
});

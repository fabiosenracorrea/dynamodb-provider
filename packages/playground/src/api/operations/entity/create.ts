import { z } from 'zod';

import { defineEntityOperation } from '../../core/operation';
import { describeCall, entityCallPath } from '../../core/callDescriptor';

const paramsSchema = z.object({
  item: z.record(z.string(), z.unknown()),
  expiresAt: z.number().optional(),
});

export const entityCreate = defineEntityOperation({
  operation: 'create',
  params: paramsSchema,
  mutation: 'create',

  async run({ repo, entity, params: { item, expiresAt } }) {
    const args = expiresAt === undefined ? [item] : [item, { expiresAt }];

    const data = await repo.create(...args);

    return {
      data,
      call: describeCall(entityCallPath(entity.type, 'create'), [item]),
    };
  },
});

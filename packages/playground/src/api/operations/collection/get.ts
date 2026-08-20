import { defineCollectionOperation } from '../../core/operation';
import { describeCall } from '../../core/callDescriptor';
import { keyParamsSchema } from '../../schemas/common';

export const collectionGet = defineCollectionOperation({
  operation: 'get',
  params: keyParamsSchema,

  async run({ repo, params, collectionName }) {
    const data = await repo.get(params);

    return {
      data: data ?? null,
      call: describeCall(`table.schema.from(${collectionName}).get`, [params]),
    };
  },
});

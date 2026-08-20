import { PlaygroundError } from '../../lib/errors';
import { defineEntityOperation } from '../../lib/operation';
import { describeCall, entityCallPath } from '../../lib/callDescriptor';
import { queryOptionsSchema } from '../../schemas/common';

export const entityList = defineEntityOperation({
  operation: 'list',
  params: queryOptionsSchema,

  /**
   * Always `list`, never `listAll` — `listAll` takes no arguments, so routing here
   * through it silently dropped limit, order, range and pagination. `fullRetrieval`
   * covers the "give me everything" case and still honours the filters.
   */
  async run({ repo, entity, params }) {
    if (typeof repo.list !== 'function') {
      throw PlaygroundError.badRequest(
        'Listing requires `typeIndex` to be configured on your SingleTable, and the index to exist in DynamoDB.',
      );
    }

    const { items, paginationToken } = await repo.list(params);

    return {
      data: items,
      paginationToken,
      call: describeCall(entityCallPath(entity.type, 'list'), [params]),
    };
  },
});

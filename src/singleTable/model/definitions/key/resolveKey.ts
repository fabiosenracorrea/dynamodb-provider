/* eslint-disable @typescript-eslint/no-explicit-any */

import { EntityKeyResolvers, KeyResolvers } from './types';

export function resolveKeys<Params extends EntityKeyResolvers<any>>({
  getPartitionKey,
  getRangeKey,
}: Params): Pick<KeyResolvers<Params>, 'getKey' | 'getPartitionKey' | 'getRangeKey'> {
  return {
    getPartitionKey,
    getRangeKey,

    getKey: (keyParams) => ({
      partitionKey: getPartitionKey(keyParams),
      rangeKey: getRangeKey(keyParams),
    }),
  } as Pick<KeyResolvers<Params>, 'getKey' | 'getPartitionKey' | 'getRangeKey'>;
}

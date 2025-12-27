/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyEntity } from 'dynamodb-provider';
import type { EntityMetadata } from '../../types';
import { inferKeyPieces } from './key';
import { inferRangeQueries } from './rangeQueries';

export function entityToMetadata(
  { type, getPartitionKey, getRangeKey, indexes = {}, ...rest }: AnyEntity,
  index: number,
): EntityMetadata {
  return {
    type,
    name: type,

    partitionKey: inferKeyPieces(getPartitionKey),
    rangeKey: inferKeyPieces(getRangeKey),

    index,

    rangeQueries: inferRangeQueries((rest as any).rangeQueries),

    indexes: Object.entries(indexes).map(([name, config]: [string, any]) => ({
      name,
      index: config.index,
      partitionKey: inferKeyPieces(config.getPartitionKey),
      rangeKey: inferKeyPieces(config.getRangeKey),
      rangeQueries: inferRangeQueries(config.rangeQueries),
    })),
  };
}

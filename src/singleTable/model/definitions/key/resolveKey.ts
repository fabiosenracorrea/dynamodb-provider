/* eslint-disable @typescript-eslint/no-explicit-any */

import { EntityKeyGetters, EntityKeyResolvers } from './types';

function resolveKeyPiece<T>(entity: T, piece: string) {
  if (!piece.startsWith('.')) return piece;

  const entityKey = piece.substring(1) as keyof T;

  return entity[entityKey];
}

function buildGetter(keyRefs: string[]) {
  const getter = (params: any = {}) => {
    return keyRefs.map((keyPiece) => resolveKeyPiece(params, keyPiece) as string);
  };

  return getter;
}

export function resolveKeys<Entity, Params extends EntityKeyResolvers<Entity>>({
  getPartitionKey,
  getRangeKey,
}: Params): EntityKeyGetters<Entity, Params> {
  const partitionGetter =
    typeof getPartitionKey === 'function'
      ? getPartitionKey
      : buildGetter(getPartitionKey);

  const rangeGetter =
    typeof getRangeKey === 'function' ? getRangeKey : buildGetter(getRangeKey);

  return {
    getPartitionKey: partitionGetter,
    getRangeKey: rangeGetter,

    getKey: (keyParams) => ({
      partitionKey: partitionGetter(keyParams as any),
      rangeKey: rangeGetter(keyParams as any),
    }),
  } as EntityKeyGetters<Entity, Params>;
}

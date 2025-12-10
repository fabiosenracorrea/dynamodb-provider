/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ExtendableCollection,
  ExtendableSingleTableEntity,
} from 'singleTable/model';

export type EntityMap = Record<string, ExtendableSingleTableEntity>;

function unwrapJoin(join: ExtendableCollection['join']): EntityMap {
  const ref = Object.values(join ?? {});

  if (!ref.length) return {};

  const mapList = ref.map(({ entity, ...rest }) => ({
    [entity.type]: entity,

    ...((rest as any).join ? unwrapJoin((rest as any).join) : {}),
  }));

  return mapList.reduce((acc, next) => ({
    ...acc,
    ...next,
  }));
}

export function buildCollectionEntityMap(collection: ExtendableCollection): EntityMap {
  const joinEntities = unwrapJoin(collection.join);

  if (!collection.originEntity?.type) return joinEntities;

  return {
    ...joinEntities,

    [collection.originEntity.type]: collection.originEntity,
  };
}

import { PlaygroundError } from '../core/errors';
import type { AnyCollection, AnyEntity } from '../../types';
import type { OperationContext } from '../core/operation';

export function resolveEntity(ctx: OperationContext, name: string): AnyEntity {
  const entity = ctx.entitiesByType.get(name);

  if (!entity) {
    throw PlaygroundError.notFound(
      `No entity registered with type "${name}". Known types: ${[...ctx.entitiesByType.keys()].join(
        ', ',
      )}`,
    );
  }

  return entity;
}

export function resolveCollection(ctx: OperationContext, name: string): AnyCollection {
  const collection = ctx.collectionsByName.get(name);

  if (!collection) {
    const known = [...ctx.collectionsByName.keys()];

    throw PlaygroundError.notFound(
      known.length
        ? `No collection named "${name}". Known collections: ${known.join(', ')}`
        : `No collection named "${name}" — none are configured.`,
    );
  }

  return collection;
}

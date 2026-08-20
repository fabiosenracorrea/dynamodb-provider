import type { Metadata } from '@/utils/api';

export interface ConfigWarning {
  id: string;
  title: string;
  detail: string;
}

/**
 * Problems the metadata already proves, surfaced before you hit them as a confusing
 * empty result. Everything here is derived — nothing probes DynamoDB.
 */
export function deriveWarnings(metadata: Metadata): ConfigWarning[] {
  const warnings: ConfigWarning[] = [];
  const { table, entities, collections } = metadata;

  if (!table.typeIndex) {
    warnings.push({
      id: 'no-type-index',
      title: 'No typeIndex configured',
      detail:
        'Entity list/listAll and the by-type browser are unavailable, and collections cannot join by TYPE or POSITION.',
    });
  }

  const positionJoins = collections.filter((collection) => collection.joins.length > 0);

  if (positionJoins.length && !table.typeIndex?.name) {
    warnings.push({
      id: 'collections-need-type-index',
      title: `${positionJoins.length} collection(s) rely on a typeIndex`,
      detail:
        'joinBy POSITION needs a real typeIndex GSI; joinBy TYPE needs at least typeIndex.partitionKey defined.',
    });
  }

  entities.forEach((entity) => {
    entity.indexes.forEach((index) => {
      const config = table.indexes?.[index.index];

      if (!config) {
        warnings.push({
          id: `${entity.type}-${index.name}-missing`,
          title: `${entity.type}.${index.name} points at an unconfigured index`,
          detail: `"${index.index}" is not in the table's indexes config.`,
        });

        return;
      }

      // A numeric range key that resolved to a constant cannot be written per item —
      // usually a sign the getter references a property the entity does not have.
      const rangeIsConstant = index.rangeKey.every((piece) => piece.type === 'CONSTANT');

      if (config.numeric && rangeIsConstant) {
        warnings.push({
          id: `${entity.type}-${index.name}-numeric`,
          title: `${entity.type}.${index.name} is numeric but its range key is constant`,
          detail:
            'Only atomic index updates will ever set it. Reference a numeric property if that was not intended.',
        });
      }
    });

    const partitionHasNoVariable = entity.partitionKey.every((piece) => piece.type === 'CONSTANT');

    if (partitionHasNoVariable && entity.partitionKey.length) {
      warnings.push({
        id: `${entity.type}-single-partition`,
        title: `${entity.type} lives in a single partition`,
        detail:
          'Its partition key has no variables, so every item shares one partition. Fine for small sets, a hot key otherwise.',
      });
    }
  });

  return warnings;
}

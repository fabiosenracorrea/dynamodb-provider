/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { buildCollectionEntityMap } from './entityMap';

/*
  On theses tests we want simply to test the unwrap, so we
  pass just enough of the props that will be interacted
*/

describe('collection entity map', () => {
  it('should produce a map of all the entities present = Record<ENTITY_TYPE, entity> with origin set', () => {
    const entities = {
      ENTITY_ORIGIN: {
        type: 'ENTITY_ORIGIN',
        checker: Symbol('origin'),
      },
      ENTITY_TASKS: {
        type: 'ENTITY_TASKS',
        checker: Symbol('tasks'),
      },
      ENTITY_TAGS: {
        type: 'ENTITY_TAGS',
        checker: Symbol('tags'),
      },
      ENTITY_OWNER: {
        type: 'ENTITY_OWNER',
        checker: Symbol('owner'),
      },
    };

    const result = buildCollectionEntityMap({
      __dbType: 'COLLECTION',
      __type: {} as any,
      getPartitionKey: () => {},
      type: 'SINGLE',

      originEntity: entities.ENTITY_ORIGIN as any,

      join: {
        tasks: {
          entity: entities.ENTITY_TASKS as any,

          type: 'MULTIPLE',

          join: {
            tags: {
              entity: entities.ENTITY_TAGS as any,

              type: 'MULTIPLE',
            },
          } as any,
        } as any,

        owner: {
          entity: entities.ENTITY_OWNER as any,

          type: 'SINGLE',
        } as any,
      },
    });

    expect(result).toStrictEqual(entities);
  });
});

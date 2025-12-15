/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect } from 'types';
import { SingleTableSchema } from '../../schema';
import { GetCollectionType } from '../../definitions';

/**
 * USE CASE TESTS
 *
 * These tests validate real-world usage scenarios of partitions, entities, and indexes
 * combining multiple features together as they would be used in production
 */

const tableConfig = {
  dynamodbProvider: {} as any,
  partitionKey: '_pk',
  rangeKey: '_sk',
  table: 'MY_TABLE',
  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_ts',
  },
  expiresAt: '_expires',
  indexes: {
    Index1: { partitionKey: '_ih1', rangeKey: '_ir1' },
    Index2: { partitionKey: '_ih2', rangeKey: '_ir2' },
    Index3: { partitionKey: '_ih3', rangeKey: '_ir3' },
  },
};

interface Media {
  id: string;
  name: string;
  description: string;
  fileName: string;
  versionId: string;
  contentType: string;
  s3Key: string;
  uploadedAt: string;
  uploadedBy: string;
  references: number;
}

describe('single table schema - use cases', () => {
  describe('partition entities with indexes and paramMatch', () => {
    it('should create entity from partition with indexes and autoGen', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
          version: ({ versionId }: { versionId: string }) => ['VERSION', versionId],
        },
      });

      const MEDIA = mediaPartition
        .use('data')
        .create<Media>()
        .entity({
          type: 'MEDIA',
          paramMatch: { mediaId: 'id' },

          indexes: {
            ByUploadTime: {
              index: 'Index1',
              getPartitionKey: () => 'MEDIA_BY_UPLOAD_TIME',
              getRangeKey: ({ uploadedAt }: { uploadedAt: string }) => [uploadedAt],

              rangeQueries: {
                optionalDateSlice: {
                  operation: 'between',
                  getValues: ({ end, start }: { start: string; end: string }) => ({
                    end: end ?? '2100-01-01T00:00:00.000Z',
                    start: start ?? '2020-01-01T00:00:00.000Z',
                  }),
                },
              },
            },
          },

          autoGen: {
            onCreate: {
              uploadedAt: 'timestamp',
              references: 'count',
            },
          },
        });

      // Basic key generation with paramMatch
      expect(MEDIA.getPartitionKey({ id: 'media-123' })).toStrictEqual([
        'MEDIA',
        'media-123',
      ]);
      expect(MEDIA.getRangeKey()).toStrictEqual(['#DATA']);
      expect(MEDIA.getKey({ id: 'media-123' })).toStrictEqual({
        partitionKey: ['MEDIA', 'media-123'],
        rangeKey: ['#DATA'],
      });

      // Index mapping
      const indexMapping = MEDIA.getCreationIndexMapping({ uploadedAt: '2024-01-01' });
      expect(indexMapping).toStrictEqual({
        Index1: {
          partitionKey: 'MEDIA_BY_UPLOAD_TIME',
          rangeKey: ['2024-01-01'],
        },
      });

      schema.from(MEDIA);
    });

    it('should create multiple entities from same partition', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
          version: ({ versionId }: { versionId: string }) => ['VERSION', versionId],
        },
      });

      const MEDIA = mediaPartition
        .use('data')
        .create<Media>()
        .entity({
          type: 'MEDIA',
          paramMatch: { mediaId: 'id' },
        });

      const MEDIA_VERSION = mediaPartition
        .use('version')
        .create<Media & { versionId: string }>()
        .entity({
          type: 'MEDIA_VERSION',
          paramMatch: { mediaId: 'id' },
        });

      expect(MEDIA.getPartitionKey({ id: 'media-123' })).toStrictEqual([
        'MEDIA',
        'media-123',
      ]);
      expect(MEDIA.getRangeKey()).toStrictEqual(['#DATA']);

      expect(MEDIA_VERSION.getPartitionKey({ id: 'media-123' })).toStrictEqual([
        'MEDIA',
        'media-123',
      ]);
      expect(MEDIA_VERSION.getRangeKey({ versionId: 'v1' })).toStrictEqual([
        'VERSION',
        'v1',
      ]);

      schema.from(MEDIA);
      schema.from(MEDIA_VERSION);
    });

    it('should handle partial paramMatch when partition has multiple params', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'PARTIAL_MATCH_TEST',
        getPartitionKey: ({ mediaId }: { mediaId: string; s3Key: string }) => [
          'MEDIA',
          mediaId,
        ],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const entity = partition
        .use('data')
        .create<Media>()
        .entity({
          type: 'MEDIA',
          // s3Key should not be required in paramMatch since it exists in Media type
          paramMatch: { mediaId: 'id' },
        });

      // Both params should still be usable in getPartitionKey
      expect(entity.getPartitionKey({ id: 'aaa', s3Key: '11' })).toStrictEqual([
        'MEDIA',
        'aaa',
      ]);

      schema.from(entity);
    });
  });

  describe('dot notation indexes on partition entities', () => {
    it('should create entity with dot notation indexes from partition', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const MEDIA_DOT_INDEX = mediaPartition
        .use('data')
        .create<Media>()
        .entity({
          paramMatch: { mediaId: 'id' },
          type: 'MEDIA_DOT_INDEX',

          indexes: {
            MyDotIndex: {
              index: 'Index1',
              getPartitionKey: ['MEDIA_BY_FILE'],
              getRangeKey: ['.fileName'],

              rangeQueries: {
                fileStartsWith: {
                  operation: 'begins_with',
                  getValues: ({ letter }: { letter: string }) => ({
                    value: letter,
                  }),
                },
              },
            },

            MySecondDotIndex: {
              index: 'Index2',
              getPartitionKey: ['MEDIA_BY_TYPE', '.contentType'],
              getRangeKey: ['.uploadedAt'],
            },
          },
        });

      // Test basic keys
      expect(MEDIA_DOT_INDEX.getPartitionKey({ id: 'media-1' })).toStrictEqual([
        'MEDIA',
        'media-1',
      ]);
      expect(MEDIA_DOT_INDEX.getRangeKey()).toStrictEqual(['#DATA']);

      // Test schema.from() integration
      const {
        queryIndex: {
          MyDotIndex: { fileStartsWith },
          MySecondDotIndex: { custom: customIndexTwoQuery },
        },
      } = schema.from(MEDIA_DOT_INDEX);

      // Verify query methods are properly typed
      expect(fileStartsWith).toBeDefined();
      expect(customIndexTwoQuery).toBeDefined();

      // -- TYPES -- //
      type _Tests = [
        // fileStartsWith should require letter parameter
        Expect<Equal<Parameters<typeof fileStartsWith>[0]['letter'], string>>,
        // customIndexTwoQuery should require contentType
        Expect<Equal<Parameters<typeof customIndexTwoQuery>[0]['contentType'], string>>,
      ];
    });
  });

  describe('transaction operations with partition entities', () => {
    it('should support all transaction operations on partition entities', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const MEDIA = mediaPartition
        .use('data')
        .create<Media>()
        .entity({
          type: 'MEDIA',
          paramMatch: { mediaId: 'id' },
        });

      // Creation params
      const createParams = MEDIA.getCreationParams({} as Media);
      expect(createParams.type).toBe('MEDIA');
      expect(createParams.key).toBeDefined();

      // Key params
      const keyParams = MEDIA.getKey({ id: 'ID' });
      expect(keyParams.partitionKey).toStrictEqual(['MEDIA', 'ID']);
      expect(keyParams.rangeKey).toStrictEqual(['#DATA']);

      // Update params
      const updateParams = MEDIA.getUpdateParams({
        id: 'ID',
        values: { description: 'Updated description' },
      });
      expect(updateParams.partitionKey).toEqual(['MEDIA', 'ID']);
      expect(updateParams.rangeKey).toEqual(['#DATA']);
      expect(updateParams.values).toStrictEqual({ description: 'Updated description' });

      // Validation params
      const validationParams = MEDIA.getValidationParams({
        id: 'ID',
        conditions: [],
      });

      expect(validationParams.partitionKey).toEqual(['MEDIA', 'ID']);
      expect(validationParams.rangeKey).toEqual(['#DATA']);

      // Transact validation params
      const transactValidateParams = MEDIA.transactValidateParams({
        id: 'ID',
        conditions: [],
      });
      expect(transactValidateParams.validate).toBeDefined();

      // Transact delete params
      const transactDeleteParams = MEDIA.transactDeleteParams({
        id: 'ID',
        conditions: [],
      });
      expect(transactDeleteParams.erase).toBeDefined();

      schema.from(MEDIA);
    });

    it('should support nested conditions on partition entities', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const MEDIA = mediaPartition
        .use('data')
        .create<Media>()
        .entity({
          type: 'MEDIA',
          paramMatch: { mediaId: 'id' },
        });

      const updateParams = MEDIA.getUpdateParams({
        id: '1',
        conditions: [
          {
            operation: 'equal',
            property: 'description',
            value: 'any',
            nested: [
              {
                property: 's3Key',
                operation: 'begins_with',
                value: 'private',
              },
            ],
          },
          {
            joinAs: 'or',
            operation: 'equal',
            property: 'description',
            value: 'other-desc',
          },
        ],
      });

      expect(updateParams.conditions).toBeDefined();
      expect(updateParams.conditions?.length).toBe(2);

      schema.from(MEDIA);
    });
  });

  describe('collection creation with partition entities', () => {
    it('should create collections from partition entities', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
          version: ({ versionId }: { versionId: string }) => ['VERSION', versionId],
        },
      });

      const MEDIA = mediaPartition
        .use('data')
        .create<Media>()
        .entity({
          type: 'MEDIA',
          paramMatch: { mediaId: 'id' },
        });

      const MEDIA_VERSION = mediaPartition
        .use('version')
        .create<Media & { versionId: string }>()
        .entity({
          type: 'MEDIA_VERSION',
          paramMatch: { mediaId: 'id' },
        });

      const collection = mediaPartition.collection({
        ref: MEDIA,
        type: 'SINGLE',
        join: {
          versions: {
            entity: MEDIA_VERSION,
            type: 'MULTIPLE',
          },
        },
      });

      expect(collection).toBeDefined();

      // -- TYPES -- //
      type MediaCollection = GetCollectionType<typeof collection>;

      type CheckCollection<
        T extends Media & { versions: (typeof MEDIA_VERSION)['__entity'][] },
      > = T;

      type _Tests = [
        // Collection should include Media and versions array
        Expect<Equal<CheckCollection<MediaCollection>, MediaCollection>>,
      ];
    });
  });

  describe('index partition integration', () => {
    it('should create index from partition with paramMatch and range queries', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaIndexPartition = schema.createPartition({
        name: 'MEDIA_INDEX_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        index: 'Index3',
        entries: {
          byUploadTime: ({ uploadedAt }: { uploadedAt: string }) => [
            'UPLOADED',
            uploadedAt,
          ],
        },
      });

      const MEDIA_BY_UPLOAD_INDEX = mediaIndexPartition
        .use('byUploadTime')
        .create<Media>()
        .index({
          paramMatch: { mediaId: 'id' },

          rangeQueries: {
            uploadedAfter: {
              operation: 'bigger_than',
              getValues: ({ timestamp }: { timestamp: string }) => ({
                value: timestamp,
              }),
            },
          },
        });

      // Verify index property
      expect(MEDIA_BY_UPLOAD_INDEX.index).toBe('Index3');

      // Test key generation with paramMatch
      expect(
        MEDIA_BY_UPLOAD_INDEX.getPartitionKey({ id: 'media-123' } as Media),
      ).toStrictEqual(['MEDIA', 'media-123']);

      expect(
        MEDIA_BY_UPLOAD_INDEX.getRangeKey({ uploadedAt: '2024-01-01' } as Media),
      ).toStrictEqual(['UPLOADED', '2024-01-01']);

      expect(
        MEDIA_BY_UPLOAD_INDEX.getKey({
          id: 'media-123',
          uploadedAt: '2024-01-01',
        } as Media),
      ).toStrictEqual({
        partitionKey: ['MEDIA', 'media-123'],
        rangeKey: ['UPLOADED', '2024-01-01'],
      });

      // Verify range queries
      expect(MEDIA_BY_UPLOAD_INDEX.rangeQueries).toBeDefined();
      expect(MEDIA_BY_UPLOAD_INDEX.rangeQueries?.uploadedAfter).toBeDefined();

      // -- TYPES -- //
      type _Tests = [
        // Index name should be properly typed
        Expect<Equal<typeof MEDIA_BY_UPLOAD_INDEX.index, 'Index3'>>,
      ];
    });

    it('should create index partition without paramMatch when params in entity', () => {
      const schema = new SingleTableSchema(tableConfig);

      const indexPartition = schema.createPartition({
        name: 'SIMPLE_INDEX_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        index: 'Index1',
        entries: {
          data: () => ['#DATA'],
        },
      });

      const simpleIndex = indexPartition.use('data').create<Media>().index();

      expect(simpleIndex.index).toBe('Index1');
      expect(simpleIndex.getPartitionKey({ id: 'media-1' } as Media)).toStrictEqual([
        'MEDIA',
        'media-1',
      ]);
      expect(simpleIndex.getRangeKey()).toStrictEqual(['#DATA']);
    });
  });

  describe('paramMatch type validation across use cases', () => {
    it('should require paramMatch when partition params not in entity type', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION_VALIDATION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          version: ({ versionId }: { versionId: string }) => ['VERSION', versionId],
          invalid: () => ['#INVALID'],
        },
      });

      // This should compile - paramMatch is provided
      const validEntity = mediaPartition
        .use('version')
        .create<Media>()
        .entity({
          type: 'MEDIA_MUST_MATCH',
          paramMatch: { mediaId: 'id' },
        });

      expect(validEntity).toBeDefined();
      schema.from(validEntity);

      // -- TYPES -- //
      // This should fail to compile - paramMatch is missing
      mediaPartition
        .use('invalid')
        .create<Media>()
        // @ts-expect-error `paramMatch` should be required since mediaId is not a key on entity
        .entity({
          type: 'MEDIA_INVALID',
        });
    });

    it('should not require paramMatch when all params exist in entity type', () => {
      const schema = new SingleTableSchema(tableConfig);

      interface MediaWithMediaId extends Media {
        mediaId: string;
      }

      const mediaPartition = schema.createPartition({
        name: 'MEDIA_PARTITION_OPTIONAL',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
        },
      });

      // This should compile without paramMatch
      const entity = mediaPartition.use('data').create<MediaWithMediaId>().entity({
        type: 'MEDIA_NO_MATCH_NEEDED',
      });

      expect(entity).toBeDefined();
      expect(
        entity.getPartitionKey({ mediaId: 'test' } as MediaWithMediaId),
      ).toStrictEqual(['MEDIA', 'test']);

      schema.from(entity);
    });
  });

  describe('key generation type safety', () => {
    it('should enforce required parameters on key generation', () => {
      const schema = new SingleTableSchema(tableConfig);

      const mediaPartition = schema.createPartition({
        name: 'KEY_SAFETY_PARTITION',
        getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const MEDIA = mediaPartition
        .use('data')
        .create<Media>()
        .entity({
          type: 'MEDIA',
          paramMatch: { mediaId: 'id' },
        });

      // -- TYPES -- //
      // @ts-expect-error partition key requires id parameter
      MEDIA.getPartitionKey();

      // Valid call
      MEDIA.getPartitionKey({ id: 'test' });

      // Range key has no params, so these should fail
      MEDIA.getRangeKey();
      // @ts-expect-error no parameters expected on range key
      MEDIA.getRangeKey({ no: true });
    });
  });

  describe('transaction validation type safety', () => {
    it('should require conditions on transactValidateParams', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'TRANSACT_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['ITEM', id],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const ENTITY = partition.use('data').create<Media>().entity({
        type: 'ENTITY',
      });

      // -- TYPES -- //
      // Valid - conditions provided
      ENTITY.transactValidateParams({
        id: 'test',
        conditions: [],
      });

      // @ts-expect-error conditions are required on validation transactions
      ENTITY.transactValidateParams({
        id: 'test',
      });
    });
  });

  describe('collection parameter validation', () => {
    it('should enforce required collection configuration', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'COLLECTION_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['ITEM', id],
        entries: {
          data: () => ['#DATA'],
          sub: ({ subId }: { subId: string }) => ['SUB', subId],
        },
      });

      const MAIN = partition.use('data').create<Media>().entity({
        type: 'MAIN',
      });

      const SUB = partition.use('sub').create<Media & { subId: string }>().entity({
        type: 'SUB',
      });

      // Valid collection
      const validCollection = partition.collection({
        ref: MAIN,
        type: 'SINGLE',
        join: {
          subs: {
            entity: SUB,
            type: 'MULTIPLE',
          },
        },
      });

      expect(validCollection).toBeDefined();

      // -- TYPES -- //
      // These should fail to compile - type-only validation
      if (false as any) {
        // @ts-expect-error must require collection params
        partition.collection({});

        // @ts-expect-error incomplete params - missing type
        partition.collection({
          join: {},
        });

        // @ts-expect-error incomplete params - missing join
        partition.collection({
          ref: null,
          type: 'SINGLE',
        });
      }
    });
  });

  describe('schema.from() method completeness', () => {
    it('should expose all expected CRUD and query methods', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'COMPLETE_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['ITEM', id],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const ENTITY = partition
        .use('data')
        .create<Media>()
        .entity({
          type: 'ENTITY',
          indexes: {
            ByName: {
              index: 'Index1',
              getPartitionKey: ['BY_NAME', '.name'],
              getRangeKey: ['.uploadedAt'],
              rangeQueries: {
                startsWith: {
                  operation: 'begins_with',
                  getValues: ({ prefix }: { prefix: string }) => ({ value: prefix }),
                },
              },
            },
          },
        });

      const methods = schema.from(ENTITY);

      // Verify all expected methods exist
      expect(methods.get).toBeDefined();
      expect(methods.batchGet).toBeDefined();
      expect(methods.create).toBeDefined();
      expect(methods.update).toBeDefined();
      expect(methods.delete).toBeDefined();
      expect(methods.list).toBeDefined();
      expect(methods.listAll).toBeDefined();
      expect(methods.query).toBeDefined();
      expect(methods.query.custom).toBeDefined();
      expect(methods.queryIndex).toBeDefined();
      expect(methods.queryIndex.ByName).toBeDefined();
      expect(methods.queryIndex.ByName.custom).toBeDefined();
      expect(methods.queryIndex.ByName.startsWith).toBeDefined();

      // -- TYPES -- //
      type _Tests = [
        // Custom range query should require prefix parameter
        Expect<
          Equal<
            Parameters<typeof methods.queryIndex.ByName.startsWith>[0]['prefix'],
            string
          >
        >,

        // Index query should require name from partition key
        Expect<
          Equal<
            Parameters<typeof methods.queryIndex.ByName.startsWith>[0]['name'],
            string
          >
        >,
      ];
    });

    it('should enforce required parameters on index query methods', () => {
      const schema = new SingleTableSchema(tableConfig);

      const partition = schema.createPartition({
        name: 'QUERY_PARTITION',
        getPartitionKey: ({ id }: { id: string }) => ['ITEM', id],
        entries: {
          data: () => ['#DATA'],
        },
      });

      const ENTITY = partition
        .use('data')
        .create<Media>()
        .entity({
          type: 'ENTITY',
          indexes: {
            ByType: {
              index: 'Index2',
              getPartitionKey: ['BY_TYPE', '.contentType'],
              getRangeKey: ['.uploadedAt'],
            },
          },
        });

      const { queryIndex } = schema.from(ENTITY);

      // Verify query index exists
      expect(queryIndex.ByType).toBeDefined();
      expect(queryIndex.ByType.custom).toBeDefined();

      // -- TYPES -- //
      type _Tests = [
        // contentType should be required on ByType custom query
        Expect<
          //
          Equal<Parameters<typeof queryIndex.ByType.custom>[0]['contentType'], string>
        >,
      ];
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Equal, Expect } from 'types';
import { SingleTableSchema } from '../../schema';

/**
 * ENTITY USE CASE TESTS
 *
 * Validates entity creation patterns, key generation, range queries,
 * and integration with schema.from() in production-like scenarios
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
  },
};

interface Media {
  id: string;
  name: string;
  description: string;
  fileName: string;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
  references: number;
}

describe('single table schema - entity use cases', () => {
  describe('entity definition variations', () => {
    it('should support function-based key getters', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],

        indexes: {
          ByUploadTime: {
            index: 'Index1',
            getPartitionKey: () => 'MEDIA_BY_UPLOAD_TIME',
            getRangeKey: ({ uploadedAt }: { uploadedAt: string }) => [uploadedAt],
          },
        },

        autoGen: {
          onCreate: {
            uploadedAt: 'timestamp',
            references: 'count',
          },
        },
      });

      schema.from(MEDIA);

      expect(MEDIA.getPartitionKey({ id: 'media-1' })).toStrictEqual(['MEDIA', 'media-1']);
      expect(MEDIA.getRangeKey()).toStrictEqual(['#DATA']);
      expect(MEDIA.type).toBe('MEDIA');
    });

    it('should support dot notation for all key getters', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA_DOT',
        getPartitionKey: ['MEDIA', '.id'],
        getRangeKey: ['#DATA'],

        indexes: {
          ByUploadTime: {
            index: 'Index1',
            getPartitionKey: ['MEDIA_BY_UPLOAD_TIME'],
            getRangeKey: ['.uploadedAt'],
          },
        },

        autoGen: {
          onCreate: {
            uploadedAt: 'timestamp',
            references: 'count',
          },
        },
      });

      schema.from(MEDIA);

      expect(MEDIA.getPartitionKey({ id: 'media-2' } as Media)).toStrictEqual(['MEDIA', 'media-2']);
      expect(MEDIA.getRangeKey()).toStrictEqual(['#DATA']);
      expect(MEDIA.type).toBe('MEDIA_DOT');
    });

    it('should support mixed function and dot notation', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA_MIXED',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],

        indexes: {
          ByUploadTime: {
            index: 'Index1',
            getPartitionKey: ['MEDIA_BY_UPLOAD_TIME'],
            getRangeKey: ['.uploadedAt'],
          },
        },

        autoGen: {
          onCreate: {
            uploadedAt: 'timestamp',
            references: 'count',
          },
        },
      });

      schema.from(MEDIA);

      expect(MEDIA.getPartitionKey({ id: 'media-3' })).toStrictEqual(['MEDIA', 'media-3']);
      expect(MEDIA.getRangeKey()).toStrictEqual(['#DATA']);
      expect(MEDIA.type).toBe('MEDIA_MIXED');
    });
  });

  describe('key generation type safety', () => {
    it('should enforce required parameters on partition key', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA_FUNC = schema.createEntity<Media>().as({
        type: 'MEDIA_FUNC',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      const MEDIA_DOT = schema.createEntity<Media>().as({
        type: 'MEDIA_DOT',
        getPartitionKey: ['MEDIA', '.id'],
        getRangeKey: ['#DATA'],
      });

      schema.from(MEDIA_FUNC);
      schema.from(MEDIA_DOT);

      // Valid calls
      expect(MEDIA_FUNC.getPartitionKey({ id: 'test' })).toStrictEqual(['MEDIA', 'test']);
      expect(MEDIA_DOT.getPartitionKey({ id: 'test' } as Media)).toStrictEqual(['MEDIA', 'test']);

      // -- TYPES -- //
      // Type-only validation - prevent runtime execution
      if (false as any) {
        // @ts-expect-error partition key requires id parameter
        MEDIA_FUNC.getPartitionKey();

        // @ts-expect-error partition key requires id parameter
        MEDIA_DOT.getPartitionKey();
      }
    });

    it('should reject invalid parameters on range key', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      schema.from(MEDIA);

      // Valid - no params expected
      expect(MEDIA.getRangeKey()).toStrictEqual(['#DATA']);

      // -- TYPES -- //

      // @ts-expect-error Type-only validation
      MEDIA.getRangeKey({ no: true });
    });
  });

  describe('index mappings', () => {
    it('should generate creation and update index mappings', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],

        indexes: {
          ByUploadTime: {
            index: 'Index1',
            getPartitionKey: () => 'MEDIA_BY_UPLOAD_TIME',
            getRangeKey: ({ uploadedAt }: { uploadedAt: string }) => [uploadedAt],
          },
        },
      });

      schema.from(MEDIA);

      const creationMapping = MEDIA.getCreationIndexMapping({ uploadedAt: '2024-01-01' });
      expect(creationMapping).toStrictEqual({
        Index1: {
          partitionKey: 'MEDIA_BY_UPLOAD_TIME',
          rangeKey: ['2024-01-01'],
        },
      });

      const updateMapping = MEDIA.getUpdatedIndexMapping({ uploadedAt: '2024-01-02' });
      expect(updateMapping).toStrictEqual({
        Index1: {
          partitionKey: 'MEDIA_BY_UPLOAD_TIME',
          rangeKey: ['2024-01-02'],
        },
      });
    });
  });

  describe('creation params validation', () => {
    it('should require entity properties in creation params', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      schema.from(MEDIA);

      const params = MEDIA.getCreationParams({} as Media);
      expect(params.type).toBe('MEDIA');
      expect(params.item).toBeDefined();

      // -- TYPES -- //

      // @ts-expect-error Type-only validation
      MEDIA.getCreationParams({});
    });
  });

  describe('range queries', () => {
    it('should validate entity-level range query parameters', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],

        rangeQueries: {
          dateSliceParams: {
            operation: 'between',
            getValues: ({ endDate, startDate }: { startDate: string; endDate: string }) => ({
              end: endDate ?? '2100-01-01T00:00:00.000Z',
              start: startDate ?? '2020-01-01T00:00:00.000Z',
            }),
          },

          dateSliceDefaultParams: {
            operation: 'between',
          },
        },
      });

      schema.from(MEDIA);

      // Verify range queries exist
      expect(MEDIA.rangeQueries).toBeDefined();
      expect(MEDIA.rangeQueries?.dateSliceParams).toBeDefined();
      expect(MEDIA.rangeQueries?.dateSliceDefaultParams).toBeDefined();

      // Valid calls
      const customResult = MEDIA.rangeQueries!.dateSliceParams({
        endDate: '2024-12-31',
        startDate: '2024-01-01',
      });
      expect(customResult).toBeDefined();

      const defaultResult = MEDIA.rangeQueries!.dateSliceDefaultParams({
        end: '2024-12-31',
        start: '2024-01-01',
      });
      expect(defaultResult).toBeDefined();

      // -- TYPES -- //

      type _Tests = [
        // dateSliceParams should require startDate and endDate
        Expect<
          Equal<Parameters<typeof MEDIA.rangeQueries.dateSliceParams>[0]['startDate'], string>
        >,
        Expect<Equal<Parameters<typeof MEDIA.rangeQueries.dateSliceParams>[0]['endDate'], string>>,
      ];
    });

    it('should validate index-level range query parameters', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],

        indexes: {
          ByUploadTime: {
            index: 'Index1',
            getPartitionKey: () => 'MEDIA_BY_UPLOAD_TIME',
            getRangeKey: ({ uploadedAt }: { uploadedAt: string }) => [uploadedAt],

            rangeQueries: {
              dateSliceParams: {
                operation: 'between',
                getValues: ({ endDate, startDate }: { startDate: string; endDate: string }) => ({
                  end: endDate ?? '2100-01-01T00:00:00.000Z',
                  start: startDate ?? '2020-01-01T00:00:00.000Z',
                }),
              },

              dateSliceDefaultParams: {
                operation: 'between',
              },
            },
          },
        },
      });

      schema.from(MEDIA);

      // Verify index range queries exist
      expect(MEDIA.indexes.ByUploadTime.rangeQueries).toBeDefined();
      expect(MEDIA.indexes.ByUploadTime.rangeQueries?.dateSliceParams).toBeDefined();
      expect(MEDIA.indexes.ByUploadTime.rangeQueries?.dateSliceDefaultParams).toBeDefined();

      // Valid calls
      const customResult = MEDIA.indexes.ByUploadTime.rangeQueries!.dateSliceParams({
        endDate: '2024-12-31',
        startDate: '2024-01-01',
      });
      expect(customResult).toBeDefined();

      const defaultResult = MEDIA.indexes.ByUploadTime.rangeQueries!.dateSliceDefaultParams({
        end: '2024-12-31',
        start: '2024-01-01',
      });
      expect(defaultResult).toBeDefined();

      // -- TYPES -- //
      type _Tests = [
        // Index dateSliceParams should require startDate and endDate
        Expect<
          Equal<
            Parameters<
              typeof MEDIA.indexes.ByUploadTime.rangeQueries.dateSliceParams
            >[0]['startDate'],
            string
          >
        >,
        Expect<
          Equal<
            Parameters<
              typeof MEDIA.indexes.ByUploadTime.rangeQueries.dateSliceParams
            >[0]['endDate'],
            string
          >
        >,
      ];
    });
  });

  describe('schema.from() integration', () => {
    it('should work with from() for all entity variations', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA_FUNC = schema.createEntity<Media>().as({
        type: 'MEDIA_FUNC',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      const MEDIA_DOT = schema.createEntity<Media>().as({
        type: 'MEDIA_DOT',
        getPartitionKey: ['MEDIA', '.id'],
        getRangeKey: ['#DATA'],
      });

      const MEDIA_MIXED = schema.createEntity<Media>().as({
        type: 'MEDIA_MIXED',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      // All variations should work with from()
      const fromFunc = schema.from(MEDIA_FUNC);
      const fromDot = schema.from(MEDIA_DOT);
      const fromMixed = schema.from(MEDIA_MIXED);

      expect(fromFunc).toBeDefined();
      expect(fromFunc.get).toBeDefined();
      expect(fromFunc.create).toBeDefined();
      expect(fromFunc.update).toBeDefined();
      expect(fromFunc.delete).toBeDefined();

      expect(fromDot).toBeDefined();
      expect(fromMixed).toBeDefined();
    });
  });

  describe('transaction param builders', () => {
    it('should generate valid transaction parameters', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      schema.from(MEDIA);

      // Creation params
      const createParams = MEDIA.getCreationParams({} as Media);
      expect(createParams.type).toBe('MEDIA');
      expect(createParams.key).toBeDefined();

      // Key params for erase
      const keyParams = MEDIA.getKey({ id: 'test-id' });
      expect(keyParams.partitionKey).toStrictEqual(['MEDIA', 'test-id']);
      expect(keyParams.rangeKey).toStrictEqual(['#DATA']);

      // Update params
      const updateParams = MEDIA.getUpdateParams({
        id: 'test-id',
        values: { description: 'Updated' },
      });
      expect(updateParams.partitionKey).toStrictEqual(['MEDIA', 'test-id']);
      expect(updateParams.values).toStrictEqual({ description: 'Updated' });

      // Validation params
      const validateParams = MEDIA.getValidationParams({
        id: 'test-id',
        conditions: [],
      });
      expect(validateParams.partitionKey).toStrictEqual(['MEDIA', 'test-id']);
      expect(validateParams.conditions).toStrictEqual([]);

      // Transact builders
      const transactCreate = MEDIA.transactCreateParams({} as Media);
      expect(transactCreate.create).toBeDefined();

      const transactUpdate = MEDIA.transactUpdateParams({
        id: 'test-id',
        values: { name: 'New Name' },
      });
      expect(transactUpdate.update).toBeDefined();

      const transactDelete = MEDIA.transactDeleteParams({
        id: 'test-id',
        conditions: [],
      });
      expect(transactDelete.erase).toBeDefined();

      const transactValidate = MEDIA.transactValidateParams({
        id: 'test-id',
        conditions: [],
      });
      expect(transactValidate.validate).toBeDefined();
    });

    it('should enforce conditions on validate transactions', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      schema.from(MEDIA);

      // Valid with conditions
      const validateParams = MEDIA.transactValidateParams({
        id: 'test',
        conditions: [],
      });
      expect(validateParams.validate).toBeDefined();

      // -- TYPES -- //

      // @ts-expect-error conditions are required on validation transactions
      MEDIA.transactValidateParams({
        id: 'test',
      });
    });
  });

  describe('nested conditions support', () => {
    it('should support nested conditions in update params', () => {
      const schema = new SingleTableSchema(tableConfig);

      const MEDIA = schema.createEntity<Media>().as({
        type: 'MEDIA',
        getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],
        getRangeKey: ['#DATA'],
      });

      schema.from(MEDIA);

      const updateParams = MEDIA.getUpdateParams({
        id: 'test-id',
        conditions: [
          {
            operation: 'equal',
            property: 'description',
            value: 'specific-value',
            nested: [
              {
                property: 'fileName',
                operation: 'begins_with',
                value: 'private',
              },
            ],
          },
          {
            joinAs: 'or',
            operation: 'equal',
            property: 'description',
            value: 'other-value',
          },
        ],
      });

      expect(updateParams.conditions).toBeDefined();
      expect(updateParams.conditions?.length).toBe(2);
      expect(updateParams.conditions?.[0].nested).toBeDefined();
    });
  });
});

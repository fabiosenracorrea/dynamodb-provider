// eslint-disable-next-line import/no-extraneous-dependencies
import { DynamodbProvider } from 'provider';
import { SingleTable } from 'singleTable/implementation';

/**
 * ----------------- USE CASE TEST FILE -----------------
 *
 * This file simulates different use cases of a real world application,
 * exactly as it would. For that reason, we do not use `jest` or as as a `.spec` or `.test`
 * file, as those can sometimes have TS inference bugs and differences from within its own
 * project
 *
 * If any modification breaks the real usage TS acceptance/result, it will generate a TS
 * error here, which will be caught by the `check-usage` script that runs before build/publish
 *
 * This file is not meant to be run, rather just catch TS errors
 *
 * ==> This is removed during build <==
 */

const dynamodbProvider = new DynamodbProvider({
  dynamoDB: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance: {} as any,
    target: 'v2',
  },

  logCallParams: true,
});

const singleTable = new SingleTable({
  dynamodbProvider,

  table: 'MY_SINGLE_TABLE',

  partitionKey: '_pk',
  rangeKey: '_sk',

  keySeparator: '#',

  indexes: {
    Index1: { partitionKey: '_ih1', rangeKey: '_ir1' },
    Index2: { partitionKey: '_ih2', rangeKey: '_ir2' },
    Index3: { partitionKey: '_ih3', rangeKey: '_ir3' },
    Index4: { partitionKey: '_ih4', rangeKey: '_ir4' },
    Index5: { partitionKey: '_ih5', rangeKey: '_ir5' },
  },

  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_timestamp',
  },

  expiresAt: '_expiresOn',

  autoRemoveTableProperties: true,
  keepTypeProperty: true,
});

type Media = {
  id: string;

  name: string;
  description: string;

  searchTerms: string;

  fileName: string;
  contentType: string;

  s3Key: string;

  references: number;

  uploadedAt: string;
  uploadedBy: string;

  data:
    | {
        type: 'IMAGE';

        data: {
          height: number;
          width: number;

          durationSeconds?: never;
          thumbnailKey?: never;
        };
      }
    | {
        type: 'VIDEO';

        data: {
          height: number;
          width: number;
          durationSeconds: number;
          thumbnailKey: string;
        };
      }
    | {
        type: 'AUDIO';

        data: {
          durationSeconds: number;

          height?: never;
          width?: never;
          thumbnailKey?: never;
        };
      };
};

const MEDIA = singleTable.schema.createEntity<Media>().as({
  type: 'MEDIA',

  getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],

  getRangeKey: ['#DATA'],

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

/**
 * Array key - should work EXACTLY like MEDIA
 */
const MEDIA2 = singleTable.schema.createEntity<Media>().as({
  type: 'MEDIA',

  getPartitionKey: ['MEDIA', '.id'],

  getRangeKey: ['#DATA'],

  indexes: {
    ByUploadTime: {
      index: 'Index1',
      getPartitionKey: ['MEDIA_BY_UPLOAD_TIME'],
      getRangeKey: ['.uploadedAt'],

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

/**
 * Array key + getter - should work EXACTLY like MEDIA
 */
const MEDIA3 = singleTable.schema.createEntity<Media>().as({
  type: 'MEDIA',

  getPartitionKey: ({ id }: { id: string }) => ['MEDIA', id],

  getRangeKey: ['#DATA'],

  indexes: {
    ByUploadTime: {
      index: 'Index1',
      getPartitionKey: ['MEDIA_BY_UPLOAD_TIME'],
      getRangeKey: ['.uploadedAt'],

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

// @ts-expect-error partition has param
MEDIA.getPartitionKey();
// @ts-expect-error partition has param
MEDIA2.getPartitionKey();
// @ts-expect-error partition has param
MEDIA3.getPartitionKey();

MEDIA.getPartitionKey({ id: '' });
MEDIA2.getPartitionKey({ id: '' });
MEDIA3.getPartitionKey({ id: '' });

MEDIA.getRangeKey();
MEDIA2.getRangeKey();
MEDIA3.getRangeKey();

// @ts-expect-error no param is on range
MEDIA.getRangeKey({ no: true });
// @ts-expect-error no param is on range
MEDIA2.getRangeKey({ no: true });
// @ts-expect-error no param is on range
MEDIA3.getRangeKey({ no: true });

MEDIA.getCreationIndexMapping({ uploadedAt: '' });
MEDIA2.getCreationIndexMapping({ uploadedAt: '' });
MEDIA3.getCreationIndexMapping({ uploadedAt: '' });
MEDIA.getUpdatedIndexMapping({ uploadedAt: '' });
MEDIA2.getUpdatedIndexMapping({ uploadedAt: '' });
MEDIA3.getUpdatedIndexMapping({ uploadedAt: '' });

// @ts-expect-error Media should be inside
MEDIA.getCreationParams({});

const _paramAcceptances_ = [
  singleTable.schema.fromEntity(MEDIA),
  singleTable.schema.fromEntity(MEDIA2),
  singleTable.schema.fromEntity(MEDIA3),

  singleTable.executeTransaction([
    {
      create: MEDIA.getCreationParams({} as Media),
    },
    {
      create: MEDIA2.getCreationParams({} as Media),
    },
    {
      create: MEDIA3.getCreationParams({} as Media),
    },
  ]),

  singleTable.executeTransaction([
    {
      erase: MEDIA.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA2.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA3.getKey({ id: 'ID' }),
    },
  ]),

  singleTable.executeTransaction([
    {
      update: MEDIA.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA2.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA3.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
  ]),

  // conditions
  singleTable.executeTransaction([
    MEDIA.transactValidateParams({
      id: 'ID',

      conditions: [],
    }),
    MEDIA2.transactValidateParams({
      id: 'ID',

      conditions: [],
    }),
    MEDIA3.transactValidateParams({
      id: 'ID',

      conditions: [],
    }),
  ]),

  // MIXED
  singleTable.executeTransaction([
    {
      create: MEDIA.getCreationParams({} as Media),
    },
    {
      create: MEDIA2.getCreationParams({} as Media),
    },
    {
      create: MEDIA3.getCreationParams({} as Media),
    },
    {
      erase: MEDIA.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA2.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA3.getKey({ id: 'ID' }),
    },
    {
      update: MEDIA.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA2.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA3.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      validate: MEDIA.getValidationParams({
        id: 'ID',

        conditions: [],
      }),
    },
    {
      validate: MEDIA2.getValidationParams({
        id: 'ID',

        conditions: [],
      }),
    },
    {
      validate: MEDIA3.getValidationParams({
        id: 'ID',

        conditions: [],
      }),
    },

    MEDIA.transactDeleteParams({
      id: 'ID',

      conditions: [],
    }),

    MEDIA2.transactDeleteParams({
      id: 'ID',

      conditions: [],
    }),

    MEDIA3.transactDeleteParams({
      id: 'ID',

      conditions: [],
    }),

    // @ts-expect-error conditions are required on validations...
    MEDIA.transactValidateParams({
      id: 'ID',
    }),
  ]),

  singleTable.transaction([
    {
      create: MEDIA.getCreationParams({} as Media),
    },
    {
      create: MEDIA2.getCreationParams({} as Media),
    },
    {
      create: MEDIA3.getCreationParams({} as Media),
    },
  ]),

  singleTable.transaction([
    {
      erase: MEDIA.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA2.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA3.getKey({ id: 'ID' }),
    },
  ]),

  singleTable.transaction([
    {
      update: MEDIA.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA2.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA3.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
  ]),

  // conditions
  singleTable.transaction([
    MEDIA.transactValidateParams({
      id: 'ID',

      conditions: [],
    }),
    MEDIA2.transactValidateParams({
      id: 'ID',

      conditions: [],
    }),
    MEDIA3.transactValidateParams({
      id: 'ID',

      conditions: [],
    }),
  ]),

  // MIXED
  singleTable.transaction([
    {
      create: MEDIA.getCreationParams({} as Media),
    },
    {
      create: MEDIA2.getCreationParams({} as Media),
    },
    {
      create: MEDIA3.getCreationParams({} as Media),
    },
    {
      erase: MEDIA.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA2.getKey({ id: 'ID' }),
    },
    {
      erase: MEDIA3.getKey({ id: 'ID' }),
    },
    {
      update: MEDIA.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA2.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      update: MEDIA3.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
    {
      validate: MEDIA.getValidationParams({
        id: 'ID',

        conditions: [],
      }),
    },
    {
      validate: MEDIA2.getValidationParams({
        id: 'ID',

        conditions: [],
      }),
    },
    {
      validate: MEDIA3.getValidationParams({
        id: 'ID',

        conditions: [],
      }),
    },

    MEDIA.transactDeleteParams({
      id: 'ID',

      conditions: [],
    }),

    MEDIA2.transactDeleteParams({
      id: 'ID',

      conditions: [],
    }),

    MEDIA3.transactDeleteParams({
      id: 'ID',

      conditions: [],
    }),

    // @ts-expect-error conditions are required on validations...
    MEDIA.transactValidateParams({
      id: 'ID',
    }),
  ]),
];

// nested conditions reference
MEDIA.getUpdateParams({
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

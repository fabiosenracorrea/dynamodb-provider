/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
// eslint-disable-next-line import/no-extraneous-dependencies
import { DynamodbProvider } from 'provider';
import { SingleTable } from 'singleTable/implementation';
import { GetCollectionType } from '../definitions';

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

// -------------------------------------------------------
// ENTITY PARTITION - Integration with indexes and transactions
// -------------------------------------------------------

const mediaPartition = singleTable.schema.createPartition({
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

const MEDIA_VERSION = mediaPartition
  .use('version')
  .create<Media & { versionId: string }>()
  .entity({
    type: 'MEDIA_VERSION',
    paramMatch: { mediaId: 'id' },
  });

// Basic key generation with paramMatch
// @ts-expect-error partition has param
MEDIA.getPartitionKey();

MEDIA.getPartitionKey({ id: '' });

MEDIA.getRangeKey();

// @ts-expect-error no param is on range
MEDIA.getRangeKey({ no: true });

// Index mapping
MEDIA.getCreationIndexMapping({ uploadedAt: '' });
MEDIA.getUpdatedIndexMapping({ uploadedAt: '' });

// -------------------------------------------------------
// TRANSACTION INTEGRATION
// -------------------------------------------------------

const _transactionAcceptance_ = [
  singleTable.schema.from(MEDIA),

  singleTable.executeTransaction([
    {
      create: MEDIA.getCreationParams({} as Media),
    },
  ]),

  singleTable.executeTransaction([
    {
      erase: MEDIA.getKey({ id: 'ID' }),
    },
  ]),

  singleTable.executeTransaction([
    {
      update: MEDIA.getUpdateParams({
        id: 'ID',
        values: { description: 'Hello?' },
      }),
    },
  ]),

  singleTable.transaction([
    {
      create: MEDIA.getCreationParams({} as Media),
    },
  ]),

  singleTable.transaction([
    {
      erase: MEDIA.getKey({ id: 'ID' }),
    },
  ]),

  singleTable.transaction([
    {
      update: MEDIA.getUpdateParams({
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
  ]),

  singleTable.transaction([
    MEDIA.transactValidateParams({
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
      erase: MEDIA.getKey({ id: 'ID' }),
    },

    {
      update: MEDIA.getUpdateParams({
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

    MEDIA.transactDeleteParams({
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
      erase: MEDIA.getKey({ id: 'ID' }),
    },

    {
      update: MEDIA.getUpdateParams({
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

    MEDIA.transactDeleteParams({
      id: 'ID',

      conditions: [],
    }),

    // @ts-expect-error conditions are required on validations...
    MEDIA.transactValidateParams({
      id: 'ID',
    }),
  ]),
];

// -------------------------------------------------------
// NESTED CONDITIONS
// -------------------------------------------------------

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

// -------------------------------------------------------
// PARAM MATCH TYPE VALIDATION
// -------------------------------------------------------

mediaPartition
  .use('version')
  .create<Media>()
  // @ts-expect-error `paramMatch` should be required since mediaId is not a key on entity
  .entity({
    type: 'MEDIA_MUST_MATCH',

    // paramMatch: { mediaId: 'id' }, // <--- obligatory
  });

// Partial param match - when partition has multiple params but only some need matching
singleTable.schema
  .createPartition({
    name: 'PARTIAL_MATCH_TEST',

    getPartitionKey: ({ mediaId }: { mediaId: string; s3Key: string }) => ['MEDIA', mediaId],

    entries: {
      data: () => ['#DATA'],
    },
  })
  .use('data')
  .create<Media>()
  .entity({
    type: 'MEDIA_PARTIAL_MATCH',

    // s3Key should not be required since it exists in Media type
    paramMatch: { mediaId: 'id' },
  })
  // and still shown and used
  .getPartitionKey({ id: 'aaa', s3Key: '11' });

// -------------------------------------------------------
// DOT NOTATION INDEXES ON PARTITION ENTITIES
// -------------------------------------------------------

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

      MySecondsDotIndex: {
        index: 'Index2',

        getPartitionKey: ['MEDIA_BY_TYPE', '.contentType'],
        getRangeKey: ['.uploadedAt'],
      },
    },
  });

MEDIA_DOT_INDEX.getPartitionKey({ id: '!' });
MEDIA_DOT_INDEX.getRangeKey();
MEDIA_DOT_INDEX.getKey({ id: '12' });

// -------------------------------------------------------
// SCHEMA.FROM() INTEGRATION - Query methods
// -------------------------------------------------------

const {
  batchGet,
  create,
  delete: remove,
  get,
  list,
  query: { custom: customQuery },
  listAll,
  queryIndex: {
    MyDotIndex: { custom: customIndexOneQuery, fileStartsWith },

    MySecondsDotIndex: { custom: customIndexTwoQuery },
  },
  update,
} = singleTable.schema.from(MEDIA_DOT_INDEX);

fileStartsWith({ letter: '1', fullRetrieval: false });

// @ts-expect-error contentType needs to be required
customIndexTwoQuery();

customIndexTwoQuery({ contentType: 'Yes!' });

// -------------------------------------------------------
// COLLECTION INTEGRATION
// -------------------------------------------------------

// @ts-expect-error must require params
mediaPartition.collection({});

// @ts-expect-error incomplete params
mediaPartition.collection({
  join: {},
});

// @ts-expect-error incomplete params
mediaPartition.collection({
  join: {},
  ref: null,
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

type MediaCollection = GetCollectionType<typeof collection>;

type CheckCollection<T extends Media & { versions: (typeof MEDIA_VERSION)['__entity'][] }> = T;

type CollectionOk = CheckCollection<MediaCollection>;

// @ts-expect-error versions needed
type CollectionBad = CheckCollection<Media>;

// -------------------------------------------------------
// INDEX PARTITION - Integration scenarios
// -------------------------------------------------------

const mediaIndexPartition = singleTable.schema.createPartition({
  name: 'MEDIA_INDEX_PARTITION',

  getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],

  index: 'Index3',

  entries: {
    byUploadTime: ({ uploadedAt }: { uploadedAt: string }) => ['UPLOADED', uploadedAt],
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

// Verify index property exists
const _indexName: 'Index3' = MEDIA_BY_UPLOAD_INDEX.index;

// Key generation - type assertions needed as index getters may require full entity type
MEDIA_BY_UPLOAD_INDEX.getPartitionKey({ id: 'media-123' } as Media);
MEDIA_BY_UPLOAD_INDEX.getRangeKey({ uploadedAt: '2024-01-01' } as Media);
MEDIA_BY_UPLOAD_INDEX.getKey({ id: 'media-123', uploadedAt: '2024-01-01' } as Media);

// Range queries
MEDIA_BY_UPLOAD_INDEX.rangeQueries?.uploadedAfter;

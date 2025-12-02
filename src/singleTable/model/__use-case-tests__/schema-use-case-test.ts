/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
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
      getPartitionKey: ['MEDIA_BY_UPLOAD_TIME'],
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

        fixedUploads: {
          operation: 'between',
          getValues: () => ({ start: '2025-01-01', end: '2025-02-01' }),
        },
      },
    },
  },

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

  autoGen: {
    onCreate: {
      uploadedAt: 'timestamp',
      references: 'count',
    },
  },
});

// Correct types

const methods = singleTable.schema.from(MEDIA);

const {
  batchGet,
  create,
  delete: deleteCall,
  get,
  list,
  listAll,
  query: { custom: queryCustom, dateSliceDefaultParams, dateSliceParams },
  queryIndex,
  update,
} = methods;

// @ts-expect-error param is required (media id)
queryCustom();

// @ts-expect-error startDate/endDate/id are required
dateSliceParams();
dateSliceParams({ endDate: '', startDate: '', id: '' });

// @ts-expect-error start/end/id is required
dateSliceDefaultParams();
dateSliceDefaultParams({ start: '', end: '', id: '' });

queryIndex.ByUploadTime.custom();

// @ts-expect-error startDate/endDate/id required
queryIndex.ByUploadTime.dateSliceParams();
queryIndex.ByUploadTime.dateSliceParams({ endDate: '', startDate: '' });

// @ts-expect-error start/end/id required
queryIndex.ByUploadTime.dateSliceDefaultParams();
queryIndex.ByUploadTime.dateSliceDefaultParams({ end: '', start: '' });

// optional
queryIndex.ByUploadTime.fixedUploads();

const fixedHash = singleTable.schema.createEntity<Media>().as({
  getPartitionKey: ['FIXED'],
  getRangeKey: ['.uploadedAt'],
  type: 'MEDIA_',
  rangeQueries: {
    param: {
      operation: 'begins_with',
      getValues: (p: { name: string }) => ({ value: p.name }),
    },
  },
});

singleTable.schema.from(fixedHash).query.custom();

// @ts-expect-error range needs params
singleTable.schema.from(fixedHash).query.param();

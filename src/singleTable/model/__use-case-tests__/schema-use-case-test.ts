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

// Correct types

const methods = singleTable.schema.from(MEDIA);

const {
  batchGet,
  create,
  delete: deleteCall,
  get,
  list,
  listAll,
  query: { custom: queryCustom },
  queryIndex,
  update,
} = methods;

// @ts-expect-error param is required (media id)
queryCustom();

queryIndex.ByUploadTime.optionalDateSlice();

queryIndex.ByUploadTime.custom();

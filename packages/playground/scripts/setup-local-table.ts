/* eslint-disable no-console */
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  type GlobalSecondaryIndex,
} from '@aws-sdk/client-dynamodb';

/**
 * Creates the table `playground.config.ts` expects, against dynamodb-local:
 *   docker run -p 8000:8000 amazon/dynamodb-local
 *
 * Run with: yarn setup:local
 */
const TABLE = 'ProjectManagementTable';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.PLAYGROUND_DYNAMO_ENDPOINT ?? 'http://localhost:8000',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

function index(
  name: string,
  partitionKey: string,
  rangeKey: string,
): GlobalSecondaryIndex {
  return {
    IndexName: name,
    KeySchema: [
      { AttributeName: partitionKey, KeyType: 'HASH' },
      { AttributeName: rangeKey, KeyType: 'RANGE' },
    ],
    Projection: { ProjectionType: 'ALL' },
  };
}

async function exists(): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  if (await exists()) {
    console.log(`✅ ${TABLE} already exists`);
    return;
  }

  await client.send(
    new CreateTableCommand({
      TableName: TABLE,
      BillingMode: 'PAY_PER_REQUEST',

      AttributeDefinitions: [
        { AttributeName: '_pk', AttributeType: 'S' },
        { AttributeName: '_sk', AttributeType: 'S' },
        { AttributeName: '_type', AttributeType: 'S' },
        { AttributeName: '_createdAt', AttributeType: 'S' },
        { AttributeName: '_gsi1pk', AttributeType: 'S' },
        { AttributeName: '_gsi1sk', AttributeType: 'S' },
        { AttributeName: '_gsi2pk', AttributeType: 'S' },
        { AttributeName: '_gsi2sk', AttributeType: 'S' },
        { AttributeName: '_gsi3pk', AttributeType: 'S' },
        // GSI3 is the `numeric: true` index
        { AttributeName: '_gsi3sk', AttributeType: 'N' },
      ],

      KeySchema: [
        { AttributeName: '_pk', KeyType: 'HASH' },
        { AttributeName: '_sk', KeyType: 'RANGE' },
      ],

      GlobalSecondaryIndexes: [
        index('TypeIndex', '_type', '_createdAt'),
        index('GSI1', '_gsi1pk', '_gsi1sk'),
        index('GSI2', '_gsi2pk', '_gsi2sk'),
        index('GSI3', '_gsi3pk', '_gsi3sk'),
      ],
    }),
  );

  console.log(`✅ created ${TABLE}`);
}

main().catch((error) => {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
});

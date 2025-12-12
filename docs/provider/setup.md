# Provider Setup

Configure the DynamoDB Provider with either AWS SDK v2 or v3.

## Using AWS SDK v3 (Recommended)

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  GetCommand,
  DeleteCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

import { DynamodbProvider } from 'dynamodb-provider';

const ddbClient = new DynamoDBClient({
  region: 'us-east-1',
  // Add any config you may need: credentials, endpoint, etc.
});

const documentClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
      // this is important if using v3
      removeUndefinedValues: true,
  },
});

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',
    instance: documentClient,
    commands: {
      BatchGetCommand,
      GetCommand,
      DeleteCommand,
      PutCommand,
      UpdateCommand,
      ScanCommand,
      QueryCommand,
      TransactWriteCommand,
    }
  }
});
```

### Required Commands

You must provide all command classes that the provider uses:

- `BatchGetCommand` - For batch operations
- `GetCommand` - For single item retrieval
- `DeleteCommand` - For delete operations
- `PutCommand` - For create operations
- `UpdateCommand` - For update operations
- `ScanCommand` - For list/scan operations
- `QueryCommand` - For query operations
- `TransactWriteCommand` - For transactions

## Using AWS SDK v2

```typescript
import { DynamoDB } from 'aws-sdk';
import { DynamodbProvider } from 'dynamodb-provider';

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v2',
    instance: new DynamoDB.DocumentClient({
      region: 'us-east-1',
      // Add any config you may need: credentials, endpoint, etc.
    })
  }
});
```

## Configuration Parameters

```typescript
interface DynamoDbProviderParams {
  dynamoDB: DynamoDBConfig;
  logCallParams?: boolean;
}
```

### `dynamoDB` (required)

The DynamoDB client configuration.

**For v3:**
```typescript
{
  target: 'v3',
  instance: DynamoDBDocumentClient,
  commands: {
    BatchGetCommand,
    GetCommand,
    DeleteCommand,
    PutCommand,
    UpdateCommand,
    ScanCommand,
    QueryCommand,
    TransactWriteCommand,
  }
}
```

**For v2:**
```typescript
{
  target: 'v2',
  instance: DynamoDB.DocumentClient
}
```

### `logCallParams` (optional)

- **Type**: `boolean`
- **Default**: `false`

Logs the parameters sent to DynamoDB before each operation. Useful for debugging.

```typescript
const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',
    instance: documentClient,
    commands: { /* ... */ }
  },
  logCallParams: true  // Enable debug logging
});
```

When enabled, you'll see output like:

```
[DynamoDB] GetItem {
  TableName: 'Users',
  Key: { userId: '12345' }
}
```

## Important Notes

### AWS SDK Not Bundled

This library doesn't bundle AWS SDK packages—you must install the version you need:

::: code-group
```bash [SDK v3]
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

```bash [SDK v2]
npm install aws-sdk
```
:::

### DocumentClient Only

The provider only works with **DocumentClient instances**, not the raw DynamoDB client.

## Next Steps

- [get](/provider/get) - Retrieve items
- [create](/provider/create) - Create items with conditions
- [update](/provider/update) - Update items with atomic operations
- [Examples](/examples/basic-usage) - See complete examples

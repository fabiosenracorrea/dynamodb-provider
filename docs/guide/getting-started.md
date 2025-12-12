# Getting Started

## Installation

Install the library using npm or yarn:

::: code-group
```bash [npm]
npm install dynamodb-provider
```

```bash [yarn]
yarn add dynamodb-provider
```

```bash [pnpm]
pnpm add dynamodb-provider
```
:::

## AWS SDK Installation

This library doesn't bundle AWS SDK packages—install the version you need:

::: code-group
```bash [SDK v3 (recommended)]
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

```bash [SDK v2]
npm install aws-sdk
```
:::

## Quick Start

### With AWS SDK v3

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
} from '@aws-sdk/lib-dynamodb';
import { DynamodbProvider } from 'dynamodb-provider';

// Create DynamoDB client
const ddbClient = new DynamoDBClient({
  region: 'us-east-1',
  // Add your credentials config
});

const documentClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
      removeUndefinedValues: true,
  },
});

// Create provider
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

// Use the provider
interface User {
  userId: string;
  name: string;
  email: string;
}

// Create a user
const newUser = await provider.create<User>({
  table: 'Users',
  item: {
    userId: '12345',
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// Get a user
const user = await provider.get<User>({
  table: 'Users',
  key: { userId: '12345' }
});

// Update a user
await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: { name: 'Jane Doe' }
});
```

### With AWS SDK v2

```typescript
import { DynamoDB } from 'aws-sdk';
import { DynamodbProvider } from 'dynamodb-provider';

// Create provider
const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v2',
    instance: new DynamoDB.DocumentClient({
      region: 'us-east-1',
      // Add your credentials config
    })
  }
});

// Use the provider (same API as v3 example above)
interface User {
  userId: string;
  name: string;
  email: string;
}

const user = await provider.get<User>({
  table: 'Users',
  key: { userId: '12345' }
});
```

## What's Next?

Now that you have the library installed, you can:

1. **Learn the Architecture** - Understand the [three-part architecture](/guide/architecture) and which layer fits your needs
2. **Use the Provider** - Explore [DynamoDB Provider methods](/provider/) for table-per-entity designs
3. **Try SingleTable** - Set up [SingleTable](/single-table/) for single-table designs
4. **Explore Schemas** - Use [Schema system](/schema/) for advanced type-safe patterns
5. **See Examples** - Check out [complete examples](/examples/basic-usage)

## Configuration Options

You can enable debug logging to see the parameters sent to DynamoDB:

```typescript
const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',
    instance: documentClient,
    commands: { /* ... */ }
  },
  logCallParams: true  // Logs all DynamoDB operation parameters
});
```

This is useful for debugging and understanding what's being sent to DynamoDB.

For complete setup details, see [Provider Setup](/provider/setup).

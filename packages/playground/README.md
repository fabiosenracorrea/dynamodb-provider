# DynamoDB Provider Playground

A development tool for interacting with your DynamoDB tables configured with `dynamodb-provider`.

## Installation

```bash
npm install -D dynamodb-provider-playground
```

## Quick Start

1. Create a `playground.config.ts` file in your project root:

```typescript
import { table } from './src/db'
import { User, Product, Order } from './src/entities'
import { userWithOrders } from './src/collections'

export default {
  table,
  entities: { User, Product, Order },
  collections: { userWithOrders },  // optional
  port: 3030,  // optional, default: 3030
}
```

2. Run the playground:

```bash
npx dynamodb-playground
```

3. Open your browser at `http://localhost:3030`

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `table` | `SingleTable` | Yes | Your SingleTable instance |
| `entities` | `Entity[]` | Yes | Named exports of your entities |
| `collections` | `Collection[]` | No | Named exports of your collections |
| `port` | `number` | No | Server port (default: 3030) |

## Features

### Entity Operations

- **Get**: Retrieve a single item by key
- **Create**: Create a new item
- **Update**: Update an existing item
- **Delete**: Delete an item by key
- **Query**: Query items by partition key with optional range filters
- **List All**: List all items of an entity type

### Collection Operations

- **Get**: Retrieve collection data with all joined entities

### Index Support

- Query entities using GSI indexes
- Execute range queries on indexes

## Example Config

```typescript
// playground.config.ts
import { DynamodbProvider, SingleTable } from 'dynamodb-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand, BatchGetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

// Your existing provider setup
const client = new DynamoDBClient({ region: 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',
    instance: docClient,
    commands: {
      GetCommand,
      PutCommand,
      UpdateCommand,
      DeleteCommand,
      QueryCommand,
      ScanCommand,
      BatchGetCommand,
      TransactWriteCommand,
    },
  },
})

const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'MyTable',
  partitionKey: 'pk',
  rangeKey: 'sk',
})

// Your entities
const User = table.schema.createEntity({
  type: 'USER',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  getRangeKey: () => ['#DATA'],
})

const Order = table.schema.createEntity({
  type: 'ORDER',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  getRangeKey: ({ orderId }: { orderId: string }) => ['ORDER', orderId],
})

export default {
  table,
  entities: [User, Order],
}
```

## Development

```bash
# Install dependencies
cd packages/playground
yarn install

# Run in development mode
yarn dev
```

## License

MIT

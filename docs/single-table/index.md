# Single Table

SingleTable provides table configuration and reduces boilerplate for single-table designs. Create one instance per table.

## Overview

SingleTable is the second layer that adds:

- **Table Configuration**: Centralized setup for table name, keys, and indexes
- **Key Management**: Automatic partition and sort key handling
- **Type System**: Entity type tracking via `typeIndex`
- **Property Cleanup**: Removes internal keys from returned items
- **TTL Support**: Built-in expiration handling
- **Index Support**: Simplified secondary index operations

## When to Use

Use SingleTable for **single-table designs** where multiple entity types share one DynamoDB table:

- ✅ Multiple entities in one table (Users, Orders, Products in `AppData`)
- ✅ You want automatic key management
- ✅ You use partition key + sort key patterns
- ✅ You want cleaner returned items (no internal keys)

If you're using **table-per-entity design**, use [Provider](/provider/) instead.

For **complex entity relationships**, consider the [Schema](/schema/) layer.

## Requirements

Requires a `DynamodbProvider` instance:

```typescript
import { DynamodbProvider, SingleTable } from 'dynamodb-provider';

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',
    instance: documentClient,
    commands: { /* ... */ }
  }
});

const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'YOUR_TABLE_NAME',
  partitionKey: 'pk',
  rangeKey: 'sk'
});
```

## Quick Example

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  keySeparator: '#',
  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_timestamp'
  }
});

// Create a user
await table.create({
  key: {
    partitionKey: ['USER', '12345'],
    rangeKey: '#DATA'
  },
  item: {
    userId: '12345',
    name: 'John Doe',
    email: 'john@example.com'
  },
  type: 'USER'
});

// Get the user
const user = await table.get({
  partitionKey: ['USER', '12345'],
  rangeKey: '#DATA'
});
// Returns: { userId: '12345', name: 'John Doe', email: 'john@example.com' }
// (pk, sk, _type, _timestamp automatically removed)

// Query users
const { items } = await table.query({
  partition: ['USER', '12345'],
  range: {
    operation: 'begins_with',
    value: 'ORDER#'
  }
});
```

## Key Features

### Automatic Key Management

```typescript
// Array keys are automatically joined with keySeparator
await table.create({
  key: {
    partitionKey: ['USER', userId],  // Becomes: USER#userId
    rangeKey: ['ORDER', orderId]     // Becomes: ORDER#orderId
  },
  item: { /* ... */ }
});
```

### Property Cleanup

Internal properties are removed from results:

```typescript
// In DynamoDB:
{
  pk: 'USER#123',
  sk: '#DATA',
  _type: 'USER',
  _timestamp: '2024-01-15T10:30:00Z',
  userId: '123',
  name: 'John'
}

// Returned to you:
{
  userId: '123',
  name: 'John'
}
```

### Type-Based Queries

With `typeIndex` configured:

```typescript
// Get all users
const users = await table.listAllFromType('USER');

// Query users with pagination
const { items, paginationToken } = await table.listType({
  type: 'USER',
  limit: 100
});
```

## Available Methods

### Data Operations
- [get](/single-table/get) - Retrieve item by keys
- [batchGet](/single-table/batch-get) - Retrieve multiple items
- [create](/single-table/create) - Create item with automatic key handling
- [update](/single-table/update) - Update item with index management
- [delete](/single-table/delete) - Delete item

### Query Operations
- [query](/single-table/query) - Query by partition with range filters
- [Type Methods](/single-table/type-methods) - Query by entity type

### Batch Operations
- [transaction](/single-table/transaction) - Atomic multi-item operations

### Helpers
- [createSet](/single-table/helpers#create-set) - Create DynamoDB Sets
- [toTransactionParams](/single-table/helpers#to-transaction-params) - Map items to transactions
- [ejectTransactParams](/single-table/transaction#eject-transact-params) - Convert to provider configs

## Benefits Over Provider

| Feature | Provider | SingleTable |
|---------|----------|-------------|
| Table name | Specified per call | Configured once |
| Key columns | Manual | Automatic |
| Key joining | Manual | Automatic (`keySeparator`) |
| Property cleanup | Manual | Automatic |
| Type tracking | Manual | Built-in (`typeIndex`) |
| TTL handling | Manual | Built-in (`expiresAt`) |
| Index management | Manual | Configured once |

## Next Steps

1. [Configuration](/single-table/configuration) - Set up SingleTable with all options
2. [Methods](/single-table/get) - Learn about operations
3. [Schema](/schema/) - For advanced entity modeling
4. [Examples](/examples/single-table-patterns) - See complete patterns

## See Also

- [Provider](/provider/) - For table-per-entity designs
- [Schema](/schema/) - For complex single-table patterns
- [Configuration](/single-table/configuration) - Complete configuration reference

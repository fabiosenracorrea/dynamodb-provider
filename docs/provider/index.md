# DynamoDB Provider

The provider wraps AWS SDK clients (v2 or v3) with type-safe methods. Only DocumentClient instances are supported.

## Overview

The DynamoDB Provider is the foundation layer that provides:

- **Type Safety**: Full TypeScript support for all DynamoDB operations
- **Expression Building**: Simplified condition and update expressions
- **Attribute Handling**: Automatic attribute name collision prevention
- **SDK Compatibility**: Works with both AWS SDK v2 and v3
- **Zero Dependencies**: Apart from `ksuid` for ID generation

## When to Use

Use the Provider for **table-per-entity designs** where each entity type has its own DynamoDB table:

- You have separate `Users`, `Products`, `Orders` tables
- You want minimal abstraction over DynamoDB
- You need type-safe operations without complex modeling

If you're using **single-table design**, consider [SingleTable](/single-table/) or [Schema](/schema/) layers instead.

## Quick Example

```typescript
import { DynamodbProvider } from 'dynamodb-provider';

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',
    instance: documentClient,
    commands: { /* ... */ }
  }
});

interface User {
  userId: string;
  name: string;
  email: string;
}

// Type-safe operations
const user = await provider.get<User>({
  table: 'Users',
  key: { userId: '12345' }
});

await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: { email: 'new@example.com' }
});
```

## Available Methods

### Data Operations
- [get](/provider/get) - Retrieve a single item by primary key
- [create](/provider/create) - Create a new item with conditions
- [update](/provider/update) - Update item with atomic operations
- [delete](/provider/delete) - Delete an item
- [batchGet](/provider/batch-get) - Retrieve multiple items at once

### Listing Operations
- [list](/provider/list) - Scan table with filters and pagination
- [query](/provider/query) - Query items by partition key with range filters

### Batch Operations
- [transaction](/provider/transaction) - Atomic multi-item operations

### Helpers
- [createSet](/provider/helpers#create-set) - Create DynamoDB Sets
- [toTransactionParams](/provider/helpers#to-transaction-params) - Map items to transaction configs

## Next Steps

1. [Setup](/provider/setup) - Configure the provider with AWS SDK v2 or v3
2. [Methods](/provider/get) - Learn about individual operations
3. [Examples](/examples/basic-usage) - See complete working examples

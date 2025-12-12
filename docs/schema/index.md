# Schema System

The schema system provides entity definitions, partition management, and collection joins for single-table designs.

## Overview

Access the schema system via `table.schema`:

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk'
});

// Access schema system
const User = table.schema.createEntity<UserType>().as({
  type: 'USER',
  getPartitionKey: ({ id }) => ['USER', id],
  getRangeKey: () => '#DATA'
});
```

## What It Provides

### 1. Entities

Define data types with automatic key generation:

```typescript
const User = table.schema.createEntity<UserType>().as({
  type: 'USER',
  getPartitionKey: ({ id }) => ['USER', id],
  getRangeKey: () => '#DATA',
  autoGen: {
    onCreate: {
      id: 'UUID',
      createdAt: 'timestamp'
    }
  }
});

// Type-safe operations
await table.schema.from(User).create({
  name: 'John Doe',
  email: 'john@example.com'
  // id and createdAt auto-generated
});
```

[Learn more about Entities →](/schema/entities)

### 2. Partitions

Group related entities sharing the same partition key:

```typescript
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }) => ['USER', userId],
  entries: {
    mainData: () => '#DATA',
    orders: ({ orderId }) => ['ORDER', orderId],
    settings: () => 'SETTINGS'
  }
});

const User = userPartition.use('mainData').create<User>().entity({
  type: 'USER',
  paramMatch: { userId: 'id' }
});
```

[Learn more about Partitions →](/schema/partitions)

### 3. Collections

Define joined entity structures for complex queries:

```typescript
const userWithOrders = userPartition.collection({
  ref: User,
  type: 'SINGLE',
  join: {
    orders: {
      entity: Order,
      type: 'MULTIPLE',
      joinBy: 'TYPE'
    }
  }
});

const result = await table.schema.from(userWithOrders).get({
  userId: '123'
});
// Returns: { id: '123', name: 'John', orders: [...] }
```

[Learn more about Collections →](/schema/collections)

## When to Use

Use the Schema system when:

- ✅ You have complex single-table designs
- ✅ You need type-safe entity operations
- ✅ You want auto-generated properties (IDs, timestamps)
- ✅ You have entity relationships to model
- ✅ You need partition-based data organization

For simpler single-table designs, [SingleTable](/single-table/) may be sufficient.

## Benefits

### Type Safety

Full TypeScript support with type inference:

```typescript
const user = await table.schema.from(User).create({
  name: 'John',
  email: 'john@example.com'
});

console.log(user.name);    // ✅ Type-safe
console.log(user.invalid); // ❌ TypeScript error
```

### Auto-Generation

Automatic property generation:

```typescript
autoGen: {
  onCreate: {
    id: 'UUID',           // Auto-generate UUID
    createdAt: 'timestamp' // Auto-generate timestamp
  },
  onUpdate: {
    updatedAt: 'timestamp' // Update on every update
  }
}
```

### Partition Management

Centralized partition key logic:

```typescript
// Define once
const partition = table.schema.createPartition({
  getPartitionKey: ({ userId }) => ['USER', userId],
  entries: { /* ... */ }
});

// Use for multiple entities
const User = partition.use('mainData').create<User>().entity({/*...*/});
const Order = partition.use('orders').create<Order>().entity({/*...*/});
```

### Collection Joins

Query and join related data:

```typescript
const userWithData = await table.schema.from(collection).get({
  userId: '123'
});
// Automatically retrieves and joins user + profile + permissions
```

## Quick Example

```typescript
// Define entity
const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }) => ['USER', id],
  getRangeKey: () => '#DATA',
  autoGen: {
    onCreate: {
      id: 'UUID',
      createdAt: 'timestamp'
    }
  }
});

// Create user
const user = await table.schema.from(User).create({
  name: 'John Doe',
  email: 'john@example.com'
});

// Get user
const retrieved = await table.schema.from(User).get({
  id: user.id
});

// Update user
await table.schema.from(User).update({
  id: user.id,
  values: { email: 'newemail@example.com' }
});

// Query all users
const users = await table.schema.from(User).listAll();
```

## Components

1. **[Entities](/schema/entities)** - Define entity types with key generators and auto-generation
2. **[Partitions](/schema/partitions)** - Group entities by shared partition keys
3. **[Collections](/schema/collections)** - Model entity relationships and joins

## Next Steps

- [Entities](/schema/entities) - Create and use entities
- [Partitions](/schema/partitions) - Organize entities by partition
- [Collections](/schema/collections) - Model relationships
- [Examples](/examples/advanced-patterns) - See advanced patterns

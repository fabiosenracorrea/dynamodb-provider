# Architecture

The library has three parts that build on each other. Use only what you need. The provider works standalone, and SingleTable works without schemas.

## The Three Layers

### 1. DynamoDB Provider

Type-safe wrappers around DynamoDB operations (get, update, query, transaction, etc.)

**Key features**:
- Full TypeScript support for all operations
- Simplified expression building
- Automatic attribute name handling
- Works with both AWS SDK v2 and v3

[Learn more about Provider →](/provider/)

### 2. SingleTable

Table configuration layer that removes repetition when all operations target the same table with fixed keys and indexes

**Key features**:
- Centralized table configuration
- Automatic key management (partition key, sort key, indexes)
- Type property for entity identification (think of it as shorta "Table Name")
- Property cleanup (removes internal keys from results)
- TTL management

[Learn more about SingleTable →](/single-table/)

### 3. Schema System

Entity and collection definitions for single-table designs, with partition and access pattern management

**Key features**:
- Entity definitions with type-safe key generators
- Partition management for related entities
- Collection joins for retrieving related data
- Auto-generation of properties (IDs, timestamps, etc.)
- Type-safe access patterns

**Example use case**: You have complex relationships like User → Profile → Permissions → AuditLogs and want to query and join them efficiently.

[Learn more about Schema →](/schema/)

## How They Work Together

Each layer builds on the previous:

1. **Provider** is the foundation - it works with any table design
2. **SingleTable** uses the Provider but adds table-specific configuration
3. **Schema** uses SingleTable but adds entity modeling and relationships

## Example Progression

### Level 1: Provider (Table-per-Entity)

```typescript
const provider = new DynamodbProvider({ /* config */ });

// Direct table operations
await provider.create({
  table: 'Users',
  item: { userId: '123', name: 'John' }
});

await provider.create({
  table: 'Orders',
  item: { orderId: '456', userId: '123', total: 100 }
});

// or as transaction:

await provider.transaction([
  {
    create: {
      table: 'Users',
      item: { userId: '123', name: 'John' },
    },
  },
  {
    create: {
      table: 'Orders',
      item: { orderId: '456', userId: '123', total: 100 },
    },
  },
]);
```

### Level 2: SingleTable

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',

  // EXTREMELY recommended to have a "table name" per entity
  // You do not need to create an index to the DB table, just
  // add this configuration to enable your items to be tagged
  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_timestamp',
  },
});

// Simplified operations with automatic key management
await table.create({
  key: { partitionKey: ['USER', '123'], rangeKey: '#DATA' },
  item: { userId: '123', name: 'John' },
  type: 'USER'
});

await table.create({
  key: { partitionKey: ['USER','123'], rangeKey: ['ORDER','456'] },
  item: { orderId: '456', total: 100 },
  type: 'ORDER'
});
```

### Level 3: Schema

```typescript
const User = table.schema.createEntity<UserType>().as({
  type: 'USER',

  // use getter pattern for key logic (or by preference)
  getPartitionKey: ({ id }: Pick<UserType, 'id'>) => ['USER', id],
  getRangeKey: () => '#DATA'
});

const Order = table.schema.createEntity<OrderType>().as({
  type: 'ORDER',

  // use .dot notation (with autocompletion!)
  // for ease of reference + correct type inference
  getPartitionKey: ['USER', '.userId'],
  getRangeKey: ['ORDER', '.orderId']
});

// Type-safe operations with automatic key generation
await table.schema.from(User).create({
  id: '123',
  name: 'John'
});

await table.schema.from(Order).create({
  userId: '123',
  orderId: '456',
  total: 100
});

// Define collection with joins
const userWithOrders = table.schema.createCollection({
  ref: User,
  type: 'SINGLE',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  join: {
    orders: {
      entity: Order,
      type: 'MULTIPLE',
      joinBy: 'TYPE'
    }
  }
});

// Retrieve user with orders joined
const result = await table.schema.from(userWithOrders).get({
  userId: '123'
});
// Returns: { id: '123', name: 'John', orders: [...] }
```

::: tip
This pattern can be further improved using [Partitions](/schema/partitions) to centralize the partition key logic for entities that share the same partition (like User and Order in this example). This eliminates repetition and makes relationships more explicit.
:::

## Next Steps

Choose the right layer for your use case:

- [Provider Setup](/provider/setup) - For table-per-entity designs
- [SingleTable Configuration](/single-table/configuration) - For single-table designs
- [Schema Entities](/schema/entities) - For advanced single-table modeling

---
layout: home

hero:
  name: "DynamoDB Provider"
  text: "Type-Safe DynamoDB Operations"
  tagline: Fast development for DynamoDB with type-safe methods for both table-per-entity and single-table designs
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/fabiosenracorrea/dynamodb-provider

features:
  - icon: 🔒
    title: Type Safety
    details: Full TypeScript support with type inference for all operations. Catch errors at compile time, not runtime.

  - icon: ⚡
    title: Zero Dependencies
    details: Apart from ksuid for ID generation, the library has no dependencies. Lightweight and fast.

  - icon: 🎯
    title: DynamoDB Provider
    details: Type-safe wrappers around DynamoDB operations for table-per-entity designs. Works with AWS SDK v2 and v3.

  - icon: 📊
    title: Single Table Design
    details: Built-in support for single-table patterns with automatic key management and property cleanup. Internal properties (pk, sk, indexes, type) are automatically removed from results.

  - icon: 🏗️
    title: Schema System
    details: Advanced entity modeling with partitions, collections, and auto-generated properties for complex data relationships.

  - icon: 🔄
    title: Transactions
    details: Atomic multi-item operations with full condition support. All operations succeed or all fail.

  - icon: 🎨
    title: Expression Builder
    details: Simplified condition and filter expressions without manual attribute name handling or collision avoidance.

  - icon: ⚙️
    title: Flexible Architecture
    details: Three-layer architecture. Use only what you need - Provider, SingleTable, or full Schema system.
---

## Quick Example

```typescript
import { DynamodbProvider } from 'dynamodb-provider';

// Setup
const provider = new DynamodbProvider({
  dynamoDB: {
    // bring your own aws SDK, v2 or v3!
    target: 'v3',
    instance: documentClient,
    commands: { /* ... */ }
  }
});

// Type-safe operations
interface User {
  userId: string;
  name: string;
  email: string;
  loginCount?: number;
}

// Create
const user = await provider.create<User>({
  table: 'Users',
  item: {
    userId: '12345',
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// Get
const retrieved = await provider.get<User>({
  table: 'Users',
  key: { userId: '12345' }
});

// Update with atomic operations
await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: { name: 'Jane Doe' },
  atomicOperations: [
    // Add is safe even if the numeric prop does not exist!
    { operation: 'add', property: 'loginCount', value: 1 }
  ]
});
```

## Choose Your Layer

### Provider - Table Per Entity
Perfect for simple, straightforward DynamoDB operations.

```typescript
const provider = new DynamodbProvider({ /* ... */ });
await provider.get({ table: 'Users', key: { id: '123' } });
```

[Learn more →](/provider/)

### Single Table Design
Automatic key management for single-table patterns.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  keySeparator: '#';
});


// Returns clean user data - no pk, sk, or internal properties!
const user = await table.get({
  partitionKey: ['USER', query.userId],
  rangeKey: '#DATA'
});
```

[Learn more →](/single-table/)

### Schema - Advanced Modeling
Full entity modeling with dot notation, auto-generation, and powerful collections.

```typescript
const User = table.schema.createEntity<User>().as({
  type: 'USER',
  // Dot notation for key resolvers - autocomplete works!
  getPartitionKey: ['USER', '.id'],
  getRangeKey: ['#DATA'],

  autoGen: {
    onCreate: {
      id: 'UUID',           // Auto-generate ID
      createdAt: 'timestamp' // Auto-generate timestamp
    }
  }
});

// Create with auto-generated properties
await table.schema.from(User).create({
  name: 'John',
  email: 'john@example.com'
  // id and createdAt auto-generated!

  // internal, table config like pk = USER#id, sk = #DATA auto generated
});

await table.schema.from(User).get({
  // type safe, properly inferred
  id: '123'
})
```

[Learn more →](/schema/)

### Collections - Join Related Data
Model complex relationships and retrieve joined data in a single query.

```typescript
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',

  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

  entries: {
    mainData: () => '#DATA',
    orders: ({ orderId }: { orderId: string }) => ['ORDER', orderId],
    profile: () => 'PROFILE'
  }
});

// Define entities
const User = userPartition
  .use('mainData')
  .create<User>()
  .entity({
    type: 'USER',

    // Ensures the 'userId' does not get your data dirty,
    // match any descriptive key param to its entity property. Fully type safe
    paramMatch: { userId: 'id' }
  });

const Order = userPartition
  .use('orders')
  .create<Order>()
  .entity({
    type: 'ORDER'
  });

const Profile = userPartition
  .use('profile')
  .create<Profile>()
  .entity({
    type: 'PROFILE'
  });

// Create collection with joins
const userComplete = userPartition.collection({
  type: 'SINGLE',

  ref: User,

  join: {
    orders: {
      entity: Order,
      type: 'MULTIPLE',
      joinBy: 'TYPE'
    },

    profile: {
      entity: Profile,
      type: 'SINGLE',
      joinBy: 'TYPE'
    }
  }
});

// Properly typed across entities
type FullUser = GetCollectionType<typeof userComplete>

// Retrieve with automatic joins
// Returns: User & { orders: Order[], profile: Profile }
// All entities clean - no pk, sk, type, or internal properties!
const result = await table.schema.from(userComplete).get({
  // type safe, from the partition!
  userId: '123'
});
```

[Learn more →](/schema/collections)

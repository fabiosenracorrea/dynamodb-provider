# Partitions

Partitions group entities sharing the same partition key. Centralizes key generation for related entities.

## Creating Partitions

```typescript
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  entries: {
    mainData: () => ['#DATA'],
    permissions: ({ permissionId }: { permissionId: string }) => ['PERMISSION', permissionId],
    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
    orders: ({ orderId }: { orderId: string }) => ['ORDER', orderId]
  }
});
```

## Parameters

### `name` (required)

Unique partition identifier. Throws error if duplicated.

```typescript
name: 'USER_PARTITION'
```

### `getPartitionKey` (required)

Partition key generator. Function form only (dot notation not supported).

```typescript
getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId]
```

Use descriptive parameter names (`userId` instead of `id`) for clarity.

### `index` (optional)

Table index name. Creates index partition when specified.

```typescript
const indexPartition = table.schema.createPartition({
  name: 'EMAIL_PARTITION',
  index: 'EmailIndex',  // Must match table indexes config
  getPartitionKey: ({ email }) => ['EMAIL', email],
  entries: {/*...*/}
});
```

### `entries` (required)

Range key generators mapped by name. Each entry can be used once to create an entity or index definition.

```typescript
entries: {
  mainData: () => ['#DATA'],
  settings: () => ['SETTINGS'],
  profile: () => ['PROFILE'],
  logs: ({ timestamp }) => ['LOG', timestamp]
}
```

## Creating Entities from Partitions

Use `partition.use(entry).create<Type>().entity()` for main table:

```typescript
type User = {
  id: string;
  name: string;
  email: string;
}

const User = userPartition
  .use('mainData')
  .create<User>()
  .entity({
    type: 'USER',
    paramMatch: {
      userId: 'id'  // Maps partition param 'userId' to entity property 'id'
    }
    // Other entity parameters...
  });
```

## Parameter Matching {#param-match}

**`paramMatch`** maps partition parameters to entity properties when names differ.

**Required when:** Partition parameters are not present in entity type.

**Optional when:** All parameters exist in entity.

### Example: Required paramMatch

```typescript
// Partition expects userId
const userPartition = table.schema.createPartition({
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  entries: { mainData: () => '#DATA' }
});

// Entity has 'id', not 'userId'
type User = {
  id: string;  // Different name
  name: string;
}

// paramMatch required to map userId -> id
const User = userPartition.use('mainData').create<User>().entity({
  type: 'USER',
  paramMatch: { userId: 'id' }  // Required!
});
```

### Example: No paramMatch Needed

```typescript
type UserLoginAttempt = {
  userId: string;  // Matches partition parameter
  timestamp: string;
  success: boolean;
}

// No paramMatch needed - all params exist
const UserLoginAttempt = userPartition.use('loginAttempt').create<UserLoginAttempt>().entity({
  type: 'USER_LOGIN_ATTEMPT'
  // No paramMatch needed
});
```

This is extremely useful to not have to second guess your properties and write to the wrong values. Keep your partition key names as descriptive as possible, and match them when needed.

## Entry Single-Use Restriction

Each partition entry can be used only once:

```typescript
const partition = table.schema.createPartition({
  name: 'PARTITION',
  getPartitionKey: ({ id }) => ['ENTITY', id],
  entries: {
    data: () => '#DATA',
    settings: () => 'SETTINGS'
  }
});

const Entity1 = partition.use('data').create<Type1>().entity({/*...*/});

// ❌ Error - 'data' already used
const Entity2 = partition.use('data').create<Type2>().entity({/*...*/});

// ✅ OK - 'settings' not yet used
const Entity3 = partition.use('settings').create<Type3>().entity({/*...*/});
```

## Index Partitions

Partitions can target secondary indexes:

```typescript
type User = {
  id: string;
  name: string;
  email: string;
}

const emailPartition = table.schema.createPartition({
  name: 'EMAIL_PARTITION',
  index: 'GSI_One',  // type safe across your configured indexes
  getPartitionKey: ({ email }: { email: string }) => ['EMAIL', email],
  entries: {
    userData: () => ['#DATA']
  }
});

// Use in entity definition
const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }) => ['USER', id],
  getRangeKey: () => '#DATA',

  indexes: {
    // no param match needed
    // extend with range queries if you want
    byEmail: emailPartition.use('userData').create<User>().index()
  }
});
```

Index partitions return `.index()` method instead of `.entity()` when used.

## Complete Example

```typescript
// Define partition
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  entries: {
    mainData: () => '#DATA',
    profile: () => 'PROFILE',
    settings: () => 'SETTINGS',
    orders: ({ orderId }: { orderId: string }) => ['ORDER', orderId],
    logs: ({ timestamp }: { timestamp: string }) => ['LOG', timestamp]
  }
});

// Create entities
type User = {
  id: string;
  name: string;
  email: string;
}

const User = userPartition
  .use('mainData')
  .create<User>()
  .entity({
    type: 'USER',
    paramMatch: { userId: 'id' },
    autoGen: {
      onCreate: {
        id: 'UUID',
        createdAt: 'timestamp'
      }
    }
  });

type UserProfile = {
  userId: string;
  bio: string;
  avatar: string;
}

const UserProfile = userPartition
  .use('profile')
  .create<UserProfile>()
  .entity({
    type: 'USER_PROFILE'
    // No paramMatch needed - userId exists in type
  });

type Order = {
  userId: string;
  id: string;
  total: number;
}

const Order = userPartition
  .use('orders')
  .create<Order>()
  .entity({
    type: 'USER_ORDER'

    // userId from partition exists, but 'orderId' is simply 'id'.
    // partial match required!
    paramMatch: { orderId: 'id' }
  });
```

## Using with Collections

Partitions are especially useful for creating collections:

```typescript
const userWithData = userPartition.collection({
  ref: User,
  type: 'SINGLE',

  join: {
    profile: {
      entity: UserProfile,
      type: 'SINGLE',
      joinBy: 'TYPE'
    },

    orders: {
      entity: Order,
      type: 'MULTIPLE',
      joinBy: 'TYPE'
    }
  }
});

// Query returns joined data
const result = await table.schema.from(userWithData).get({
  userId: '123'
});
// Returns: { id: '123', name: '...', profile: {...}, orders: [...] }
```

See [Collections](/schema/collections) for more details.

## Benefits

1. **Centralized Logic**: Partition key generation in one place
2. **Type Safety**: TypeScript ensures parameter consistency
3. **Reusability**: Share partition logic across entities
4. **Organization**: Groups related entities logically
5. **Collection Support**: Simplifies collection creation

## See Also

- [Entities](/schema/entities) - Entity creation
- [Collections](/schema/collections) - Using partitions with collections
- [Examples](/examples/advanced-patterns) - Advanced partition patterns

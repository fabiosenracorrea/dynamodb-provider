# Collections

Collections define joined entity structures for retrieval. Data in single-table designs often spans multiple entries that need to be retrieved and joined together.

## Creating Collections

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
```

Or use `table.schema.createCollection` for inline partition/partition-getters.

## Collection Parameters

### `ref` (required)

Root entity of the collection. Use `null` for collections with only joined entities.

```typescript
ref: User  // Root entity
// or
ref: null  // No root entity
```

### `type` (required)

Collection cardinality: `'SINGLE'` or `'MULTIPLE'`.

- `'SINGLE'` - Returns one result
- `'MULTIPLE'` - Returns an array

```typescript
type: 'SINGLE'  // Returns User & { orders: Order[] }
type: 'MULTIPLE'  // Returns Array<User & { orders: Order[] }>
```

### `getPartitionKey` (optional)

Partition key generator for the collection. Mutually exclusive with `partition`.

```typescript
getPartitionKey: ({ userId }) => ['USER', userId]
```

### `index` (optional)

Table index name. Only valid with `getPartitionKey`.

```typescript
getPartitionKey: ({ email }) => ['EMAIL', email],
index: 'EmailIndex'
```

### `partition` (optional)

Existing partition (entity or index partition). Mutually exclusive with `getPartitionKey` and `index`. The collection infers index usage automatically.

```typescript
partition: userPartition  // Uses existing partition
```

### `narrowBy` (optional)

Range key filter for collection query:

**`'RANGE_KEY'`** - Uses ref entity's range key as query prefix. Requires `ref` to be an entity.

```typescript
narrowBy: 'RANGE_KEY'
```

**Function** - Custom range query function.

```typescript
narrowBy: (params?: AnyObject) => RangeQueryConfig
```

Example:

```typescript
narrowBy: ({ since }: { since: string }) => ({
  operation: 'bigger_than',
  value: since
})
```

### `join` (required)

Entity join configuration.

```typescript
join: {
  orders: {
    entity: Order,
    type: 'MULTIPLE',
    joinBy: 'TYPE'
  },
  profile: {
    entity: UserProfile,
    type: 'SINGLE',
    joinBy: 'TYPE'
  }
}
```

## Join Configuration

```typescript
type JoinConfig = {
  entity: RefEntity;
  type: 'SINGLE' | 'MULTIPLE';
  extractor?: (item: AnyObject) => any;
  sorter?: (a: any, b: any) => number;
  joinBy?: 'POSITION' | 'TYPE' | ((parent: any, child: any) => boolean);
  join?: Record<string, JoinConfig>;  // Nested joins
}
```

### `entity` (required)

Entity to join.

```typescript
entity: Order
```

### `type` (required)

- `'SINGLE'` - Single item
- `'MULTIPLE'` - Array

```typescript
type: 'MULTIPLE'  // Array of orders
```

### `extractor` (optional)

Transforms joined entity before inclusion.

```typescript
extractor: (item: Order) => item.orderId  // Only include orderId
```

### `sorter` (optional)

Sorts `'MULTIPLE'` type joins. Ignored for `'SINGLE'`.

```typescript
sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
```

### `joinBy` (optional)

Join strategy. Default: `'POSITION'`.

**`'POSITION'`** - Sequential join based on query order. Requires table `typeIndex` to be configured.

```typescript
joinBy: 'POSITION'
```

**`'TYPE'`** - Join by entity type property. Requires `typeIndex.partitionKey` defined (index need not exist in DynamoDB).

```typescript
joinBy: 'TYPE'
```

**Custom function** - Returns `true` to join.

```typescript
joinBy: (parent, child) => parent.id === child.parentId
```

### `join` (optional)

Nested join configuration. Same structure as root `join`. Enables multi-level joins.

```typescript
join: {
  items: {
    entity: OrderItem,
    type: 'MULTIPLE',
    joinBy: 'TYPE'
  }
}
```

## Collection Type Extraction

Use `GetCollectionType` to infer the collection's TypeScript type:

```typescript
import type { GetCollectionType } from 'dynamodb-provider';

type UserWithOrders = GetCollectionType<typeof userWithOrders>;
// Type: User & { orders: Order[] }
```

## Examples

### Collection with Root Entity

```typescript
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  entries: {
    mainData: () => '#DATA',
    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp]
  }
});

type User = {
  id: string;
  name: string;
  email: string;
}

type UserLoginAttempt = {
  userId: string;
  timestamp: string;
  success: boolean;
  ip: string;
}

const User = userPartition.use('mainData').create<User>().entity({
  type: 'USER',
  paramMatch: { userId: 'id' }
});

const UserLoginAttempt = userPartition.use('loginAttempt').create<UserLoginAttempt>().entity({
  type: 'USER_LOGIN_ATTEMPT'
});

const userWithLogins = userPartition.collection({
  ref: User,
  type: 'SINGLE',
  join: {
    logins: {
      entity: UserLoginAttempt,
      type: 'MULTIPLE',
      joinBy: 'TYPE',
      sorter: (a, b) => b.timestamp.localeCompare(a.timestamp)  // Latest first
    }
  }
});

// Usage
const result = await table.schema.from(userWithLogins).get({
  userId: '123'
});
// Type: User & { logins: UserLoginAttempt[] }
```

### Collection without Root Entity

```typescript
type UserPermission = {
  userId: string;
  permissionId: string;
  timestamp: string;
  addedBy: string;
}

const UserPermission = userPartition.use('permissions').create<UserPermission>().entity({
  type: 'USER_PERMISSION'
});

const userDataCollection = userPartition.collection({
  ref: null,  // No root entity
  type: 'SINGLE',
  join: {
    logins: {
      entity: UserLoginAttempt,
      type: 'MULTIPLE',
      joinBy: 'TYPE'
    },
    permissions: {
      entity: UserPermission,
      type: 'MULTIPLE',
      joinBy: 'TYPE',
      extractor: ({ permissionId }: UserPermission) => permissionId  // Only IDs
    }
  }
});

// Type: { logins: UserLoginAttempt[], permissions: string[] }
type UserData = GetCollectionType<typeof userDataCollection>;
```

### Multi-Level Joins

```typescript
const orderWithItems = orderPartition.collection({
  ref: Order,
  type: 'SINGLE',
  join: {
    items: {
      entity: OrderItem,
      type: 'MULTIPLE',
      joinBy: 'TYPE',
      join: {
        // Nested join
        product: {
          entity: Product,
          type: 'SINGLE',
          joinBy: (item, product) => item.productId === product.id
        }
      }
    },
    customer: {
      entity: Customer,
      type: 'SINGLE',
      joinBy: (order, customer) => order.customerId === customer.id
    }
  }
});

// Type: Order & {
//   items: Array<OrderItem & { product: Product }>,
//   customer: Customer
// }
```

### Custom Join Logic

```typescript
const collection = table.schema.createCollection({
  ref: Parent,
  type: 'SINGLE',
  getPartitionKey: ({ id }) => ['PARENT', id],
  join: {
    children: {
      entity: Child,
      type: 'MULTIPLE',
      joinBy: (parent, child) => {
        // Custom join logic
        return child.parentId === parent.id && child.active === true;
      },
      sorter: (a, b) => a.order - b.order
    }
  }
});
```

## Using Collections

Collections expose a `get` method via `schema.from()`:

```typescript
const result = await table.schema.from(userWithLogins).get({
  userId: 'user-id-12'
});
```

Returns the collection type for `'SINGLE'` collections or `undefined` if not found. Returns array for `'MULTIPLE'` collections.

## Complete Example

```typescript
// Define partition
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }) => ['USER', userId],
  entries: {
    mainData: () => '#DATA',
    profile: () => 'PROFILE',
    orders: ({ orderId }) => ['ORDER', orderId],
    permissions: ({ permissionId }) => ['PERM', permissionId]
  }
});

// Define entities
const User = userPartition.use('mainData').create<User>().entity({
  type: 'USER',
  paramMatch: { userId: 'id' }
});

const UserProfile = userPartition.use('profile').create<UserProfile>().entity({
  type: 'USER_PROFILE'
});

const Order = userPartition.use('orders').create<Order>().entity({
  type: 'USER_ORDER'
});

const Permission = userPartition.use('permissions').create<Permission>().entity({
  type: 'USER_PERMISSION'
});

// Define collection
const userComplete = userPartition.collection({
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
      joinBy: 'TYPE',
      sorter: (a, b) => b.createdAt.localeCompare(a.createdAt)
    },
    permissions: {
      entity: Permission,
      type: 'MULTIPLE',
      joinBy: 'TYPE',
      extractor: (perm) => perm.permissionId
    }
  }
});

// Use collection
const user = await table.schema.from(userComplete).get({
  userId: '123'
});

// Type:
// User & {
//   profile: UserProfile;
//   orders: Order[];
//   permissions: string[];
// }
```

## See Also

- [Entities](/schema/entities) - Define entities
- [Partitions](/schema/partitions) - Create partitions
- [Examples](/examples/advanced-patterns) - Advanced collection patterns

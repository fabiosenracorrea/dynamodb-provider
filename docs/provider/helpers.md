# Helpers

Utility methods for DynamoDB operations.

## createSet

Normalizes DynamoDB Set creation across v2 and v3.

### Method Signature

```typescript
createSet<T>(items: T[]): DBSet<T[number]>
```

### Parameters

- `items` - Array of strings or numbers

### Return Value

Returns a DynamoDB Set compatible with both SDK v2 and v3.

### Example

```typescript
await provider.create({
  table: 'Items',
  item: {
    id: '111',
    tags: provider.createSet([1, 2, 10, 40]),
    categories: provider.createSet(['electronics', 'featured', 'new'])
  }
});
```

### Number Sets

```typescript
const numberSet = provider.createSet([1, 2, 3, 4, 5]);

await provider.create({
  table: 'Products',
  item: {
    productId: 'P123',
    availableSizes: numberSet
  }
});
```

### String Sets

```typescript
const stringSet = provider.createSet(['tag1', 'tag2', 'tag3']);

await provider.create({
  table: 'Posts',
  item: {
    postId: 'POST123',
    tags: stringSet
  }
});
```

### Update with Sets

Use with atomic `add_to_set` and `remove_from_set` operations:

```typescript
// Add to set
await provider.update({
  table: 'Posts',
  key: { postId: 'POST123' },
  atomicOperations: [
    {
      operation: 'add_to_set',
      property: 'tags',
      value: provider.createSet(['trending', 'featured'])
    }
  ]
});

// Remove from set
await provider.update({
  table: 'Posts',
  key: { postId: 'POST123' },
  atomicOperations: [
    {
      operation: 'remove_from_set',
      property: 'tags',
      value: provider.createSet(['old', 'deprecated'])
    }
  ]
});
```

### Why Use createSet?

DynamoDB Sets are created differently in SDK v2 vs v3:

```typescript
// SDK v2
const set = documentClient.createSet([1, 2, 3]);

// SDK v3
const set = new Set([1, 2, 3]);

// This library abstracts the difference
const set = provider.createSet([1, 2, 3]);  // Works with both!
```

## toTransactionParams

Maps items to transaction configs.

### Method Signature

```typescript
toTransactionParams<Item>(
  items: Item[],
  generator: (item: Item) => (TransactionParams | null)[]
): TransactionParams[]
```

### Parameters

- `items` - Array of items to process
- `generator` - Function that returns transaction config(s) for each item

### Return Value

Returns flattened array of transaction parameters.

### Basic Example

```typescript
const users = [
  { id: '1', name: 'John' },
  { id: '2', name: 'Jane' },
  { id: '3', name: 'Bob' }
];

const configs = provider.toTransactionParams(users, (user) => [
  {
    create: {
      table: 'Users',
      item: user,
      conditions: [
        { operation: 'not_exists', property: 'id' }
      ]
    }
  }
]);

await provider.transaction(configs);
```

### Complex Example

```typescript
interface Order {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}

const orders: Order[] = [...];

const configs = provider.toTransactionParams(orders, (order) => [
  // Create order record
  {
    create: {
      table: 'Orders',
      item: {
        orderId: order.orderId,
        customerId: order.customerId,
        total: order.total,
        status: 'pending'
      }
    }
  },

  // Update customer stats
  {
    update: {
      table: 'Customers',
      key: { customerId: order.customerId },
      atomicOperations: [
        { operation: 'add', property: 'orderCount', value: 1 },
        { operation: 'add', property: 'totalSpent', value: order.total }
      ]
    }
  },

  // Update product stock for each item
  ...order.items.map(item => ({
    update: {
      table: 'Products',
      key: { productId: item.productId },
      atomicOperations: [
        { operation: 'subtract', property: 'stock', value: item.quantity }
      ],
      conditions: [
        { operation: 'bigger_or_equal_than', property: 'stock', value: item.quantity }
      ]
    }
  }))
]);

// Process in batches of 100 (DynamoDB limit)
const batches = chunkArray(configs, 100);
for (const batch of batches) {
  await provider.transaction(batch);
}
```

### Conditional Configs

Return `null` to skip items:

```typescript
const configs = provider.toTransactionParams(users, (user) => {
  // Skip inactive users
  if (user.status !== 'active') {
    return null;
  }

  return {
    update: {
      table: 'Users',
      key: { userId: user.id },
      values: { lastSync: new Date().toISOString() }
    }
  };
});

await provider.transaction(configs);
```

### Multiple Operations Per Item

```typescript
const configs = provider.toTransactionParams(orders, (order) => [
  // Create order
  {
    create: {
      table: 'Orders',
      item: order
    }
  },

  // Create order history entry
  {
    create: {
      table: 'OrderHistory',
      item: {
        orderId: order.orderId,
        status: 'created',
        timestamp: new Date().toISOString()
      }
    }
  },

  // Update metrics
  {
    update: {
      table: 'Metrics',
      key: { metric: 'totalOrders' },
      atomicOperations: [
        { operation: 'add', property: 'count', value: 1 }
      ]
    }
  }
]);
```

### Batch Processing

Helper to process large arrays:

```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Process 500 items in batches of 100
const allConfigs = provider.toTransactionParams(items, (item) => ({
  create: { table: 'Items', item }
}));

const batches = chunkArray(allConfigs, 100);

for (const batch of batches) {
  await provider.transaction(batch);
}
```

### Type Safety

The generator function is type-safe:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [...];

const configs = provider.toTransactionParams(users, (user: User) => ({
  create: {
    table: 'Users',
    item: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  }
}));

// TypeScript ensures user parameter has User type
// and item matches User structure
```

## See Also

- [update](/provider/update#atomic-operations) - Atomic operations with Sets
- [transaction](/provider/transaction) - Using transaction configs
- [create](/provider/create) - Creating items with Sets

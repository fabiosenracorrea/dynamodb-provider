# update

Updates an item with support for value updates, property removal, and atomic operations.

## Method Signature

```typescript
update<Entity>(params: UpdateParams<Entity>): Promise<Partial<Entity> | undefined>
```

## Parameters

### `table` (required)
- **Type**: `string`
- Table name

### `key` (required)
- **Type**: `object`
- Primary key

### `values` (optional)
- **Type**: `Partial<Entity>`
- Properties to update

### `remove` (optional)
- **Type**: `string[]`
- Properties to remove (root-level only)

### `atomicOperations` (optional)
- **Type**: `AtomicOperation[]`
- Atomic operations (see [Atomic Operations](#atomic-operations) below)

### `conditions` (optional)
- **Type**: `ItemExpression[]`
- Conditions that must be met

### `returnUpdatedProperties` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Return updated values (useful for counters)

## Return Value

Returns updated properties if `returnUpdatedProperties` is `true`, otherwise `undefined`.

## Basic Example

```typescript
const updated = await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: { name: 'John Doe' },
  atomicOperations: [
    { operation: 'add', property: 'loginCount', value: 1 }
  ],
  conditions: [
    { operation: 'exists', property: 'userId' }
  ],
  returnUpdatedProperties: true
});

// updated: { name: 'John Doe', loginCount: 43 }
```

## Simple Updates

Update specific properties:

```typescript
await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: {
    email: 'newemail@example.com',
    status: 'active'
  }
});
```

## Removing Properties

Remove properties from an item:

```typescript
await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  remove: ['tempData', 'sessionToken']
});
```

**Note**: `remove` only works with root-level properties.

## Atomic Operations {#atomic-operations}

Atomic operations update values safely without race conditions.

### Math Operations

#### `sum`
Add to existing value. **Fails if property doesn't exist.**

```typescript
atomicOperations: [
  { operation: 'sum', property: 'total', value: 50 }
]
// total = total + 50 (fails if total doesn't exist)
```

#### `subtract`
Subtract from existing value. **Fails if property doesn't exist.**

```typescript
atomicOperations: [
  { operation: 'subtract', property: 'stock', value: 1 }
]
// stock = stock - 1 (fails if stock doesn't exist)
```

#### `add`
Add to value, **auto-initializes to 0 if missing.**

```typescript
atomicOperations: [
  { operation: 'add', property: 'count', value: 1 }
]
// count = (count || 0) + 1 (safe, creates if missing)
```

### Set Operations

#### `add_to_set`
Add values to a DynamoDB Set:

```typescript
atomicOperations: [
  {
    operation: 'add_to_set',
    property: 'tags',
    value: provider.createSet(['new', 'featured'])
  }
]
```

#### `remove_from_set`
Remove values from a Set:

```typescript
atomicOperations: [
  {
    operation: 'remove_from_set',
    property: 'tags',
    value: provider.createSet(['old', 'deprecated'])
  }
]
```

### Conditional Set

#### `set_if_not_exists`
Set value only if property doesn't exist:

```typescript
atomicOperations: [
  {
    operation: 'set_if_not_exists',
    property: 'createdAt',
    value: new Date().toISOString()
  }
]
// Only sets createdAt if it doesn't already exist
```

With `refProperty` to check different property:

```typescript
atomicOperations: [
  {
    operation: 'set_if_not_exists',
    property: 'status',
    value: 'pending',
    refProperty: 'createdAt'  // Set status if createdAt is missing
  }
]
```

## Inline Conditions on Atomic Operations

Add conditions directly to atomic operations:

```typescript
await provider.update({
  table: 'Items',
  key: { id: '12' },
  atomicOperations: [
    {
      operation: 'subtract',
      property: 'count',
      value: 1,
      if: { operation: 'bigger_than', value: 0 }  // Prevents negative
    }
  ],
})
```

More examples:

```typescript
// Only increment if below threshold
{
  operation: 'add',
  property: 'retryCount',
  value: 1,
  if: { operation: 'lower_than', value: 5 }
}

// Only update if status is specific value
{
  operation: 'set_if_not_exists',
  property: 'processedAt',
  value: new Date().toISOString(),
  if: { operation: 'equal', value: 'pending' }
}
```

## Counter Pattern

Atomic counters for sequential IDs:

```typescript
const { count } = await provider.update({
  table: 'Counters',
  key: { name: 'USER_ID' },
  atomicOperations: [
    { operation: 'add', property: 'count', value: 1 }
  ],
  returnUpdatedProperties: true
});

// Use the counter value
await provider.create({
  table: 'Users',
  item: {
    id: count,
    name: 'John',
    email: 'john@example.com'
  }
});
```

## Combining Operations

Mix values, remove, and atomic operations:

```typescript
await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: {
    email: 'new@example.com',
    lastModified: new Date().toISOString()
  },
  remove: ['tempToken'],
  atomicOperations: [
    { operation: 'add', property: 'loginCount', value: 1 },
    { operation: 'add_to_set', property: 'roles', value: provider.createSet(['admin']) }
  ],
  conditions: [
    { operation: 'exists', property: 'userId' }
  ]
});
```

## Conditional Updates

Use conditions to ensure update safety:

```typescript
// Only update if status is pending
await provider.update({
  table: 'Orders',
  key: { orderId: 'A100' },
  values: { status: 'completed' },
  conditions: [
    { operation: 'equal', property: 'status', value: 'pending' }
  ]
});

// Optimistic locking with version
await provider.update({
  table: 'Documents',
  key: { docId: 'D1' },
  values: { content: 'new content' },
  atomicOperations: [
    { operation: 'add', property: 'version', value: 1 }
  ],
  conditions: [
    { operation: 'equal', property: 'version', value: 5 }  // Ensure version hasn't changed
  ]
});
```

## Returning Updated Values

Get the updated values back:

```typescript
const result = await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: { name: 'Jane' },
  atomicOperations: [
    { operation: 'add', property: 'loginCount', value: 1 }
  ],
  returnUpdatedProperties: true
});

console.log(result);
// { name: 'Jane', loginCount: 15 }
```

## Error Handling

```typescript
try {
  await provider.update({
    table: 'Users',
    key: { userId: '12345' },
    values: { status: 'active' },
    conditions: [
      { operation: 'exists', property: 'userId' }
    ]
  });
} catch (error) {
  if (error.name === 'ConditionalCheckFailedException') {
    console.log('Update condition not met');
  }
}
```

## Atomic Operations Summary

| Operation | Behavior | Initializes if Missing? |
|-----------|----------|------------------------|
| `sum` | Add to value | ❌ No (fails) |
| `subtract` | Subtract from value | ❌ No (fails) |
| `add` | Add to value | ✅ Yes (to 0) |
| `add_to_set` | Add to Set | ✅ Yes (empty set) |
| `remove_from_set` | Remove from Set | ❌ No |
| `set_if_not_exists` | Set if missing | ✅ Yes |

## See Also

- [create](/provider/create#conditions) - Conditions reference
- [delete](/provider/delete) - Delete with conditions
- [transaction](/provider/transaction) - Atomic multi-item updates
- [helpers](/provider/helpers) - createSet for Set operations

# update

Updates an item with support for value updates, property removal, and atomic operations.

## Method Signature

```typescript
update<Entity>(params: SingleTableUpdateParams<Entity>): Promise<Partial<Entity> | undefined>
```

## Parameters

### `partitionKey` (required)
- **Type**: `KeyValue`
- Partition key value

### `rangeKey` (required)
- **Type**: `KeyValue`
- Range key value

### `values` (optional)
- **Type**: `Partial<Entity>`
- Properties to update

### `remove` (optional)
- **Type**: `string[]`
- Root-level properties to remove

### `atomicOperations` (optional)
- **Type**: `AtomicOperation[]`
- Atomic operations

### `conditions` (optional)
- **Type**: `ItemExpression[]`
- Conditions that must be met

### `returnUpdatedProperties` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Return updated values

### `indexes` (optional)
- **Type**: `Record<IndexName, Partial<{ partitionKey: KeyValue; rangeKey: KeyValue }>>`
- Update index keys (only if table has `indexes` configured)

### `expiresAt` (optional)
- **Type**: `number`
- UNIX timestamp for TTL (only if table has `expiresAt` configured)

### `type` (optional)
- **Type**: `string`
- Entity type value (only if table has `typeIndex` configured)

## Return Value

Returns updated properties if `returnUpdatedProperties` is `true`, otherwise `undefined`.

## Basic Example

```typescript
const result = await table.update({
  partitionKey: ['USER', 'some-id'],
  rangeKey: '#DATA',
  values: {
    email: 'newemail@example.com',
    status: 'active'
  },
  remove: ['tempData'],
  atomicOperations: [
    { operation: 'sum', property: 'loginCount', value: 1 }
  ],
  returnUpdatedProperties: true
});
```

## Update with Indexes

```typescript
await table.update({
  partitionKey: ['USER', userId],
  rangeKey: '#DATA',
  values: {
    email: 'new@example.com',
    status: 'active'
  },
  indexes: {
    GSI_One: {
      partitionKey: 'new@example.com'
    },
    GSI_Two: {
      partitionKey: 'active',
      rangeKey: new Date().toISOString()
    }
  }
});
```

## Update TTL

```typescript
await table.update({
  partitionKey: ['SESSION', sessionId],
  rangeKey: '#DATA',
  values: { lastActivity: new Date().toISOString() },
  expiresAt: Math.floor(Date.now() / 1000) + 3600  // Extend 1 hour
});
```

## Update Type

```typescript
await table.update({
  partitionKey: ['USER', userId],
  rangeKey: '#DATA',
  values: { role: 'admin' },
  type: 'ADMIN_USER'  // Updates typeIndex.partitionKey
});
```

**Note:** This only updates the `typeIndex.partitionKey` column. The `typeIndex.rangeKey` is not affected.

## Complete Example

```typescript
const result = await table.update({
  partitionKey: ['USER', 'user-123'],
  rangeKey: '#DATA',
  values: {
    email: 'newemail@example.com',
    status: 'active',
    lastModified: new Date().toISOString()
  },
  remove: ['tempProperty'],
  atomicOperations: [
    { operation: 'sum', property: 'loginCount', value: 1 }
  ],
  expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  indexes: {
    GSI_One: {
      partitionKey: 'newemail@example.com'
    }
  },
  conditions: [
    { property: 'status', operation: 'equal', value: 'pending' }
  ],
  returnUpdatedProperties: true
});
```

## Atomic Operations

All atomic operations from Provider are supported:

- `sum`, `subtract`, `add` - Math operations
- `add_to_set`, `remove_from_set` - Set operations
- `set_if_not_exists` - Conditional set

See [Provider update](/provider/update#atomic-operations) for details.

## See Also

- [Provider update](/provider/update) - Atomic operations reference
- [create](/single-table/create) - Create items
- [delete](/single-table/delete) - Delete items
- [Configuration](/single-table/configuration) - Index and TTL configuration

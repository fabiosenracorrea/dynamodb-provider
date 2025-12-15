# create

Creates an item in the table.

## Method Signature

```typescript
create<Entity>(params: SingleTableCreateParams<Entity>): Promise<Entity>
```

## Parameters

### `item` (required)
- **Type**: `Entity`
- The item to create

### `key` (required)
- **Type**: `{ partitionKey: KeyValue; rangeKey: KeyValue }`
- Partition and range key values

### `indexes` (optional)
- **Type**: `Record<IndexName, { partitionKey?: KeyValue; rangeKey?: KeyValue }>`
- Index key values (only if table has `indexes` configured)

### `expiresAt` (optional)
- **Type**: `number`
- UNIX timestamp for TTL (only if table has `expiresAt` configured)

### `type` (optional)
- **Type**: `string`
- Entity type identifier (only if table has `typeIndex` configured)

## Return Value

Returns the created item.

## Basic Example

```typescript
const user = await table.create({
  key: {
    partitionKey: 'USER#123',
    rangeKey: '#DATA'
  },
  item: {
    userId: '123',
    name: 'John Doe',
    email: 'john@example.com'
  },
  type: 'USER'
});
```

## Array Keys

```typescript
const user = await table.create({
  key: {
    partitionKey: ['USER', userId],
    rangeKey: '#DATA'
  },
  item: {
    userId,
    name: 'John Doe',
    email: 'john@example.com'
  },
  type: 'USER'
});
```

## With TTL

```typescript
const session = await table.create({
  key: {
    partitionKey: ['SESSION', sessionId],
    rangeKey: '#DATA'
  },
  item: {
    sessionId,
    userId,
    data: '...'
  },
  type: 'SESSION',
  expiresAt: Math.floor(Date.now() / 1000) + 3600  // 1 hour
});
```

## With Indexes

```typescript
const user = await table.create({
  key: {
    partitionKey: ['USER', userId],
    rangeKey: '#DATA'
  },
  item: {
    userId,
    name: 'John',
    email: 'john@example.com',
    status: 'active'
  },
  type: 'USER',
  indexes: {
    GSI_One: {
      partitionKey: 'john@example.com',
      rangeKey: new Date().toISOString()
    },
    GSI_Two: {
      partitionKey: 'active',
      rangeKey: userId
    }
  }
});
```

## Complete Example

```typescript
const user = await table.create({
  key: {
    partitionKey: ['USER', '123'],
    rangeKey: '#DATA'
  },
  item: {
    userId: '123',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  type: 'USER',
  expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  indexes: {
    GSI_One: {
      partitionKey: 'john@example.com',
      rangeKey: new Date().toISOString()
    }
  }
});
```

## Preventing Overwrites

Use the Provider's create with conditions:

```typescript
await provider.create({
  table: 'AppData',
  item: {
    pk: 'USER#123',
    sk: '#DATA',
    userId: '123',
    name: 'John'
  },
  conditions: [
    { operation: 'not_exists', property: 'pk' },
    { operation: 'not_exists', property: 'sk' }
  ]
});
```

## See Also

- [update](/single-table/update) - Update items
- [Configuration](/single-table/configuration#typeindex) - typeIndex configuration
- [Configuration](/single-table/configuration#indexes) - indexes configuration
- [Provider create](/provider/create) - Conditions reference

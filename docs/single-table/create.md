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

### `conditions` (optional)
- **Type**: `ItemExpression<Entity>[]`
- Conditions that must be met before the item is created
- Properties are type-safe references to the entity

### `indexes` (optional)
- **Type**: `Record<IndexName, { partitionKey?: KeyValue; rangeKey?: KeyValue }>`
- Index key values (only if table has `indexes` configured)

### `expiresAt` (optional)
- **Type**: `number`
- UNIX timestamp or Date for TTL (only if table has `expiresAt` configured)

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

## Conditional Creation and Preventing Overwrites

Single-table creates support the same conditions as provider creates. Because DynamoDB's
`PutItem` overwrites an existing item by default, use `not_exists` when the item must be new:

```typescript
await table.create({
  key: {
    partitionKey: ['USER', '123'],
    rangeKey: '#DATA'
  },
  item: {
    userId: '123',
    name: 'John'
  },
  conditions: [
    { operation: 'not_exists', property: 'userId' }
  ]
});
```

Conditions are also supported by entity helpers and repositories:

```typescript
const options = {
  conditions: [
    { operation: 'not_exists' as const, property: 'userId' as const }
  ]
};

const params = User.getCreationParams(
  { userId: '123', name: 'John' },
  options
);

await table.schema.from(User).create(
  { userId: '123', name: 'John' },
  options
);

const transactionParams = User.transactCreateParams(
  { userId: '123', name: 'John' },
  options
);
```

## See Also

- [update](/single-table/update) - Update items
- [Configuration](/single-table/configuration#typeindex) - typeIndex configuration
- [Configuration](/single-table/configuration#indexes) - indexes configuration
- [Provider create conditions](/provider/create#conditions) - Operations and nested conditions

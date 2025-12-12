# get

Retrieves a single item by partition and range keys.

## Method Signature

```typescript
get<Entity>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined>
```

## Parameters

### `partitionKey` (required)
- **Type**: `KeyValue`
- Partition key value

### `rangeKey` (required)
- **Type**: `KeyValue`
- Range key value

### `consistentRead` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Use strongly consistent reads

### `propertiesToRetrieve` (optional)
- **Type**: `string[]`
- Root-level attributes to return

## KeyValue Type

```typescript
type KeyValue = null | string | Array<string | number | null>;
```

Array keys are joined with the configured `keySeparator`. `null` values are primarily for index updates where parameters may be incomplete.

## Return Value

Returns the item or `undefined` if not found.

## Basic Example

```typescript
const user = await table.get({
  partitionKey: ['USER', id],
  rangeKey: '#DATA',
  consistentRead: true
});
```

## String Keys

Use strings directly:

```typescript
const item = await table.get({
  partitionKey: 'USER#123',
  rangeKey: '#DATA'
});
```

## Array Keys

Arrays are automatically joined:

```typescript
// With default keySeparator: '#'
const item = await table.get({
  partitionKey: ['USER', userId],  // Becomes: 'USER#123'
  rangeKey: ['ORDER', orderId]     // Becomes: 'ORDER#456'
});
```

## Partial Retrieval

```typescript
const user = await table.get({
  partitionKey: ['USER', '123'],
  rangeKey: '#DATA',
  propertiesToRetrieve: ['name', 'email', 'status']
});
```

## Property Cleanup

Internal properties are automatically removed:

```typescript
// In DynamoDB:
{
  pk: 'USER#123',
  sk: '#DATA',
  _type: 'USER',
  _timestamp: '2024-01-15T10:30:00Z',
  userId: '123',
  name: 'John'
}

// Returned (with autoRemoveTableProperties: true):
{
  userId: '123',
  name: 'John'
}
```

## Consistent Reads

```typescript
const user = await table.get({
  partitionKey: ['USER', userId],
  rangeKey: '#DATA',
  consistentRead: true  // Ensures latest data
});
```

## Handling Missing Items

```typescript
const user = await table.get({
  partitionKey: ['USER', 'non-existent'],
  rangeKey: '#DATA'
});

if (!user) {
  throw new Error('User not found');
}

// user is defined here
```

## Type Safety

```typescript
interface User {
  userId: string;
  name: string;
  email: string;
}

const user = await table.get<User>({
  partitionKey: ['USER', '123'],
  rangeKey: '#DATA'
});

if (user) {
  console.log(user.name);    // ✅ Type-safe
  console.log(user.invalid); // ❌ TypeScript error
}
```

## See Also

- [query](/single-table/query) - Query by partition key
- [batchGet](/single-table/batch-get) - Retrieve multiple items
- [Configuration](/single-table/configuration) - keySeparator and cleanup options

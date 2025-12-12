# batchGet

Retrieves multiple items by keys. Handles batches >100 items and retries unprocessed items automatically.

## Method Signature

```typescript
batchGet<Entity>(params: SingleTableBatchGetParams<Entity>): Promise<Entity[]>
```

## Parameters

### `keys` (required)
- **Type**: `Array<{ partitionKey: KeyValue; rangeKey: KeyValue }>`
- Array of key objects

### `consistentRead` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Use strongly consistent reads

### `propertiesToRetrieve` (optional)
- **Type**: `string[]`
- Root-level attributes to return

### `throwOnUnprocessed` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Throw error if items remain unprocessed after retries

### `maxRetries` (optional)
- **Type**: `number`
- **Default**: `8`
- Maximum retry attempts for unprocessed items

## Return Value

Returns array of items. Missing items are not included.

## Basic Example

```typescript
const items = await table.batchGet({
  keys: [
    { partitionKey: 'USER#123', rangeKey: 'INFO#456' },
    { partitionKey: 'USER#789', rangeKey: 'INFO#012' }
  ],
  propertiesToRetrieve: ['name', 'email']
});
```

## Array Keys

```typescript
const items = await table.batchGet({
  keys: [
    { partitionKey: ['USER', '123'], rangeKey: '#DATA' },
    { partitionKey: ['USER', '456'], rangeKey: '#DATA' },
    { partitionKey: ['USER', '789'], rangeKey: '#DATA' }
  ]
});
```

## Automatic Batching

Handles any number of keys (DynamoDB limits to 100):

```typescript
const items = await table.batchGet({
  keys: userIds.map(id => ({
    partitionKey: ['USER', id],
    rangeKey: '#DATA'
  }))
});
// Automatically batched if > 100 items
```

## Consistent Reads

```typescript
const items = await table.batchGet({
  keys: [/* ... */],
  consistentRead: true
});
```

## Throw on Unprocessed

```typescript
try {
  const items = await table.batchGet({
    keys: [/* ... */],
    throwOnUnprocessed: true
  });
} catch (error) {
  console.log('Some items could not be retrieved');
}
```

## See Also

- [get](/single-table/get) - Retrieve single item
- [query](/single-table/query) - Query by partition
- [Provider batchGet](/provider/batch-get) - Underlying implementation

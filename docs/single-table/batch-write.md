# batchMutate, batchCreate, batchDelete

Write or delete multiple items using SingleTable key references. These methods add the configured table name, compose keys, and apply the same type, index, TTL, and internal-property handling as normal SingleTable creates.

The underlying BatchWrite calls are automatically split into groups of 25 operations and retry unprocessed operations.

AWS SDK v3 users must register `BatchWriteCommand` in the provider [setup](/provider/setup).

::: warning
BatchWrite is not atomic and does not support per-item conditions. Use [transaction](/single-table/transaction) when all operations must succeed together or when a conditional write is required.
:::

## batchMutate

Creates and deletes items in the same batch.

```typescript
const result = await table.batchMutate<User>({
  creations: [
    {
      key: { partitionKey: ['USER', '123'], rangeKey: '#DATA' },
      item: { userId: '123', name: 'John' },
      type: 'USER'
    }
  ],
  deletes: [
    { partitionKey: ['USER', '456'], rangeKey: '#DATA' }
  ]
});
```

## batchCreate

Convenience method for batches containing only creations.

```typescript
const result = await table.batchCreate<User>({
  items: [
    {
      key: { partitionKey: ['USER', '123'], rangeKey: '#DATA' },
      item: { userId: '123', name: 'John' },
      type: 'USER'
    },
    {
      key: { partitionKey: ['USER', '456'], rangeKey: '#DATA' },
      item: { userId: '456', name: 'Jane' },
      type: 'USER'
    }
  ]
});
```

Each item accepts the same creation fields as [create](/single-table/create), except BatchWrite does not support `conditions`.

## batchDelete

Convenience method for batches containing only deletes.

```typescript
const result = await table.batchDelete<User>({
  items: [
    { partitionKey: ['USER', '123'], rangeKey: '#DATA' },
    { partitionKey: ['USER', '456'], rangeKey: '#DATA' }
  ]
});
```

## Retry Options

All three methods accept:

- `maxRetries` - Maximum processing attempts. Default: `8`
- `throwOnUnprocessed` - Throw if operations remain unprocessed after the final attempt. Default: `false`

When `throwOnUnprocessed` is `false`, the return value contains any physical items or keys DynamoDB did not process. `batchMutate` groups them under `unprocessed.creations` and `unprocessed.deletes`; the convenience methods return their corresponding array as `unprocessed`.

## See Also

- [batchGet](/single-table/batch-get) - Retrieve multiple items
- [Entity methods](/schema/entities#using-schema-from) - Fully inferred entity batch writes
- [transaction](/single-table/transaction) - Atomic and conditional multi-item writes

# batchMutate, batchCreate, batchDelete

Write or delete multiple items with DynamoDB BatchWrite. The provider automatically splits more than 25 operations into valid requests and retries unprocessed operations.

AWS SDK v3 users must register `BatchWriteCommand` in the provider [setup](/provider/setup).

::: warning
BatchWrite is not atomic and does not support per-item conditions. Use [transaction](/provider/transaction) when all operations must succeed together or when a conditional write is required.
:::

## batchMutate

Creates and deletes items in the same batch.

```typescript
batchMutate<Entity>(params: BatchMutateParams<Entity>): Promise<BatchMutateResult<Entity>>
```

```typescript
const result = await provider.batchMutate<User>({
  table: 'Users',
  creations: [
    { userId: '123', name: 'John' },
    { userId: '456', name: 'Jane' }
  ],
  deletes: [
    { userId: '789' }
  ]
});
```

## batchCreate

Convenience method for batches containing only creations.

```typescript
batchCreate<Entity>(params: BatchCreateParams<Entity>): Promise<BatchCreateResult<Entity>>
```

```typescript
const result = await provider.batchCreate<User>({
  table: 'Users',
  items: [
    { userId: '123', name: 'John' },
    { userId: '456', name: 'Jane' }
  ]
});
```

## batchDelete

Convenience method for batches containing only deletes.

```typescript
batchDelete<Entity>(params: BatchDeleteParams<Entity>): Promise<BatchDeleteResult<Entity>>
```

```typescript
const result = await provider.batchDelete<User>({
  table: 'Users',
  items: [
    { userId: '123' },
    { userId: '456' }
  ]
});
```

## Retry Options

All three methods accept:

- `maxRetries` - Maximum processing attempts. Default: `8`
- `throwOnUnprocessed` - Throw if operations remain unprocessed after the final attempt. Default: `false`

When `throwOnUnprocessed` is `false`, the methods return the operations DynamoDB did not process:

```typescript
const { unprocessed } = await provider.batchMutate<User>({
  table: 'Users',
  creations,
  deletes,
  maxRetries: 4
});

// unprocessed?.creations
// unprocessed?.deletes
```

`batchCreate` and `batchDelete` return the corresponding array directly as `unprocessed`.

## See Also

- [batchGet](/provider/batch-get) - Retrieve multiple items
- [transaction](/provider/transaction) - Atomic and conditional multi-item writes

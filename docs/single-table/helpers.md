# Helpers

Utility methods for SingleTable operations.

## createSet

Creates a DynamoDB Set. Normalizes Set creation across SDK v2 and v3.

### Method Signature

```typescript
createSet<T>(items: T[]): DBSet<T[number]>
```

### Parameters

- `items` - Array of strings or numbers

### Return Value

Returns a DynamoDB Set.

### Example

```typescript
await table.create({
  key: {
    partitionKey: 'ITEM#1',
    rangeKey: '#DATA'
  },
  item: {
    id: '1',
    tags: table.createSet(['tag1', 'tag2', 'tag3']),
    counts: table.createSet([1, 2, 3])
  }
});
```

## toTransactionParams

See [transaction](/single-table/transaction#to-transaction-params) page.

## ejectTransactParams

See [transaction](/single-table/transaction#eject-transact-params) page.

## See Also

- [Provider helpers](/provider/helpers) - Base helper methods
- [transaction](/single-table/transaction) - Transaction utilities
- [update](/single-table/update) - Atomic operations with Sets

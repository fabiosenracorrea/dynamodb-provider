# delete

Deletes an item by partition and range keys.

## Method Signature

```typescript
delete<Entity>(params: SingleTableDeleteParams<Entity>): Promise<void>
```

## Parameters

### `partitionKey` (required)
- **Type**: `KeyValue`
- Partition key value

### `rangeKey` (required)
- **Type**: `KeyValue`
- Range key value

### `conditions` (optional)
- **Type**: `ItemExpression[]`
- Conditions that must be met before deletion

## Return Value

Returns `void`.

## Basic Example

```typescript
await table.delete({
  partitionKey: 'USER#123',
  rangeKey: '#DATA'
});
```

## Array Keys

```typescript
await table.delete({
  partitionKey: ['USER', userId],
  rangeKey: '#DATA'
});
```

## Conditional Delete

```typescript
await table.delete({
  partitionKey: ['USER', '123'],
  rangeKey: '#DATA',
  conditions: [
    { operation: 'equal', property: 'status', value: 'inactive' }
  ]
});
```

## See Also

- [Provider delete](/provider/delete) - Conditions reference
- [create](/single-table/create) - Create items
- [update](/single-table/update) - Update items

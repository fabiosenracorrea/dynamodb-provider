# delete

Deletes an item by primary key.

## Method Signature

```typescript
delete<Entity>(params: DeleteParams<Entity>): Promise<void>
```

## Parameters

### `table` (required)
- **Type**: `string`
- Table name

### `key` (required)
- **Type**: `object`
- Primary key of the item to delete

### `conditions` (optional)
- **Type**: `ItemExpression[]`
- Conditions that must be met before deleting

## Return Value

Returns `void` (no return value).

## Basic Example

```typescript
await provider.delete({
  table: 'Users',
  key: { userId: '12345' }
});
```

## Conditional Deletes

Use conditions to ensure item exists or meets criteria before deleting:

```typescript
await provider.delete({
  table: 'Users',
  key: { userId: '12345' },
  conditions: [
    { operation: 'exists', property: 'userId' }
  ]
});
```

## Delete with Business Logic

```typescript
// Only delete if user is inactive
await provider.delete({
  table: 'Users',
  key: { userId: '12345' },
  conditions: [
    { operation: 'equal', property: 'status', value: 'inactive' }
  ]
});

// Only delete if last login is old
await provider.delete({
  table: 'Users',
  key: { userId: '12345' },
  conditions: [
    { operation: 'lower_than', property: 'lastLoginAt', value: '2024-01-01' }
  ]
});
```

## Composite Key Example

For tables with partition and sort keys:

```typescript
await provider.delete({
  table: 'OrderItems',
  key: {
    orderId: 'ORDER-123',  // Partition key
    itemId: 'ITEM-456'     // Sort key
  },
  conditions: [
    { operation: 'equal', property: 'status', value: 'cancelled' }
  ]
});
```

## Multiple Conditions

```typescript
await provider.delete({
  table: 'Products',
  key: { productId: 'P123' },
  conditions: [
    { operation: 'exists', property: 'productId' },
    { operation: 'equal', property: 'status', value: 'discontinued' },
    { operation: 'lower_or_equal_than', property: 'stock', value: 0 }
  ]
});
```

## Error Handling

When a condition fails, DynamoDB throws an error:

```typescript
try {
  await provider.delete({
    table: 'Users',
    key: { userId: '12345' },
    conditions: [
      { operation: 'exists', property: 'userId' }
    ]
  });
} catch (error) {
  if (error.name === 'ConditionalCheckFailedException') {
    console.log('User does not exist or condition not met');
  }
}
```

## Safe Delete Pattern

Always check existence before deleting:

```typescript
const user = await provider.get({
  table: 'Users',
  key: { userId: '12345' }
});

if (user) {
  await provider.delete({
    table: 'Users',
    key: { userId: '12345' },
    conditions: [
      { operation: 'exists', property: 'userId' }
    ]
  });
}
```

## Idempotent Deletes

If you don't care whether the item exists:

```typescript
// No conditions - won't throw error if item doesn't exist
await provider.delete({
  table: 'Users',
  key: { userId: '12345' }
});
```

## Conditions Reference

All condition operations are available. See [Conditions](/provider/create#conditions) for the full list.

Common patterns for delete:

- `exists` - Ensure item exists before deleting
- `equal` - Check status or flag before deleting
- `lower_than` - Delete old items
- `in` - Delete items matching specific states

## See Also

- [create](/provider/create#conditions) - Full conditions reference
- [update](/provider/update) - Update items with conditions
- [transaction](/provider/transaction) - Atomic deletes with other operations

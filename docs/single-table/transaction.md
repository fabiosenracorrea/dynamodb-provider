# transaction, ejectTransactParams, toTransactionParams

Execute atomic multi-item operations.

## transaction

Executes multiple operations atomically. All operations succeed or all fail.

### Method Signature

```typescript
transaction(configs: (SingleTableTransactionParams | null)[]): Promise<void>
```

### Transaction Types

- `{ create: SingleTableCreateParams }` - Put item
- `{ update: SingleTableUpdateParams }` - Update item
- `{ erase: SingleTableDeleteParams }` - Delete item
- `{ validate: SingleTableValidateTransactParams }` - Condition check

### Basic Example

```typescript
await table.transaction([
  {
    update: {
      partitionKey: 'ORDER#A100',
      rangeKey: '#DATA',
      values: { status: 'completed' },
      conditions: [
        { property: 'status', operation: 'equal', value: 'pending' }
      ]
    }
  },
  {
    erase: {
      partitionKey: 'CART#C100',
      rangeKey: '#DATA'
    }
  },
  {
    create: {
      key: {
        partitionKey: 'COMPLETED#A100',
        rangeKey: '#DATA'
      },
      item: {
        orderId: 'A100',
        customerId: '12345',
        totalAmount: 100
      }
    }
  },
  {
    validate: {
      partitionKey: 'CUSTOMER#12345',
      rangeKey: '#DATA',
      conditions: [
        { operation: 'exists', property: 'id' }
      ]
    }
  }
]);
```

### Transaction Parameters

Transaction parameters match the corresponding single table method parameters.

### Null Handling

`null` values in the array are filtered out:

```typescript
await table.transaction([
  { create: {...} },
  condition ? { update: {...} } : null,  // Conditionally included
  { erase: {...} }
]);
```

## ejectTransactParams {#eject-transact-params}

Converts single table transaction configs to provider transaction configs for merging with transactions from other tables.

### Method Signature

```typescript
ejectTransactParams(
  configs: (SingleTableTransactionParams | null)[]
): TransactionParams[]
```

### Parameters

- `configs` - Array of single table transaction configurations

### Return Value

Returns array of provider-compatible transaction configurations.

### Example

```typescript
const singleTableTransacts = table.ejectTransactParams([
  {
    create: {
      key: { partitionKey: 'A', rangeKey: 'B' },
      item: { name: 'test' }
    }
  }
]);

// Merge with other provider transactions
await otherProvider.transaction([
  { create: { table: 'OtherTable', item: { id: '1' } } },
  ...singleTableTransacts
]);
```

### Cross-Table Transactions

```typescript
// Transaction spanning multiple tables
const table1Configs = table1.ejectTransactParams([
  { update: {...} },
  { create: {...} }
]);

const table2Configs = table2.ejectTransactParams([
  { erase: {...} }
]);

await provider.transaction([
  ...table1Configs,
  ...table2Configs,
  // Direct provider operations
  { create: { table: 'ThirdTable', item: {...} } }
]);
```

## toTransactionParams

Maps items to transaction configurations.

### Method Signature

```typescript
toTransactionParams<Item>(
  items: Item[],
  generator: (item: Item) => SingleTableTransactionParams | (SingleTableTransactionParams | null)[] | null
): SingleTableTransactionParams[]
```

### Parameters

- `items` - Array of items to process
- `generator` - Function that returns transaction config(s) for each item

### Return Value

Returns flattened array of transaction parameters.

### Basic Example

```typescript
const configs = table.toTransactionParams(users, (user) => ({
  update: {
    partitionKey: ['USER', user.id],
    rangeKey: '#DATA',
    values: { lastSync: new Date().toISOString() }
  }
}));

await table.transaction(configs);
```

### Multiple Operations Per Item

```typescript
const configs = table.toTransactionParams(orders, (order) => [
  // Create order
  {
    create: {
      key: {
        partitionKey: ['ORDER', order.id],
        rangeKey: '#DATA'
      },
      item: order,
      type: 'ORDER'
    }
  },
  // Update customer stats
  {
    update: {
      partitionKey: ['CUSTOMER', order.customerId],
      rangeKey: '#DATA',
      atomicOperations: [
        { operation: 'add', property: 'orderCount', value: 1 }
      ]
    }
  }
]);

await table.transaction(configs);
```

### Conditional Configs

```typescript
const configs = table.toTransactionParams(users, (user) => {
  if (user.status !== 'active') {
    return null;  // Skip inactive users
  }

  return {
    update: {
      partitionKey: ['USER', user.id],
      rangeKey: '#DATA',
      values: { lastSync: new Date().toISOString() }
    }
  };
});
```

## See Also

- [Provider transaction](/provider/transaction) - Transaction concepts
- [create](/single-table/create) - Create parameters
- [update](/single-table/update) - Update parameters
- [delete](/single-table/delete) - Delete parameters

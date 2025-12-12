# transaction

Executes multiple operations atomically. All operations succeed or all fail. Wraps TransactWrite (max 100 items or 4MB).

## Method Signature

```typescript
transaction(configs: (TransactionParams | null)[]): Promise<void>
```

## Transaction Types

Transactions support four operation types:

- `{ create: CreateParams }` - Put item
- `{ update: UpdateParams }` - Update item
- `{ erase: DeleteParams }` - Delete item
- `{ validate: ValidateTransactParams }` - Condition check (no modification)

## Basic Example

```typescript
await provider.transaction([
  {
    update: {
      table: 'Orders',
      key: { orderId: 'A100' },
      values: { status: 'completed' },
      conditions: [
        { property: 'status', operation: 'equal', value: 'pending' }
      ]
    }
  },
  {
    erase: {
      table: 'Carts',
      key: { cartId: 'C100' }
    }
  },
  {
    create: {
      table: 'CompletedOrders',
      item: {
        orderId: 'A100',
        customerId: '12345',
        totalAmount: 100
      }
    }
  },
  {
    validate: {
      table: 'Customers',
      key: { id: '12345' },
      conditions: [
        { operation: 'exists', property: 'id' }
      ]
    }
  }
]);
```

## Create Operation

Put a new item:

```typescript
{
  create: {
    table: 'Users',
    item: {
      userId: '12345',
      name: 'John Doe',
      email: 'john@example.com'
    },
    conditions: [
      { operation: 'not_exists', property: 'userId' }
    ]
  }
}
```

Same parameters as [create](/provider/create) method.

## Update Operation

Update an existing item:

```typescript
{
  update: {
    table: 'Products',
    key: { productId: 'P123' },
    values: { stock: 95 },
    atomicOperations: [
      { operation: 'add', property: 'soldCount', value: 5 }
    ],
    conditions: [
      { operation: 'bigger_or_equal_than', property: 'stock', value: 5 }
    ]
  }
}
```

Same parameters as [update](/provider/update) method.

## Erase Operation

Delete an item:

```typescript
{
  erase: {
    table: 'TempData',
    key: { sessionId: 'S123' },
    conditions: [
      { operation: 'lower_than', property: 'expiresAt', value: Date.now() }
    ]
  }
}
```

Same parameters as [delete](/provider/delete) method.

## Validate Operation

Check conditions without modifying:

```typescript
{
  validate: {
    table: 'Accounts',
    key: { accountId: 'A123' },
    conditions: [
      { operation: 'bigger_or_equal_than', property: 'balance', value: 100 },
      { operation: 'equal', property: 'status', value: 'active' }
    ]
  }
}
```

Parameters:
- `table` (required) - Table name
- `key` (required) - Primary key
- `conditions` (required) - Conditions to check

## Complete Example: Order Checkout

```typescript
await provider.transaction([
  // 1. Verify customer exists and has sufficient balance
  {
    validate: {
      table: 'Customers',
      key: { customerId: '12345' },
      conditions: [
        { operation: 'exists', property: 'customerId' },
        { operation: 'bigger_or_equal_than', property: 'balance', value: 100 },
        { operation: 'equal', property: 'status', value: 'active' }
      ]
    }
  },

  // 2. Update customer balance
  {
    update: {
      table: 'Customers',
      key: { customerId: '12345' },
      atomicOperations: [
        { operation: 'subtract', property: 'balance', value: 100 }
      ]
    }
  },

  // 3. Update product stock
  {
    update: {
      table: 'Products',
      key: { productId: 'P123' },
      atomicOperations: [
        {
          operation: 'subtract',
          property: 'stock',
          value: 2,
          if: { operation: 'bigger_or_equal_than', value: 2 }
        }
      ]
    }
  },

  // 4. Create order record
  {
    create: {
      table: 'Orders',
      item: {
        orderId: 'O456',
        customerId: '12345',
        productId: 'P123',
        quantity: 2,
        total: 100,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      conditions: [
        { operation: 'not_exists', property: 'orderId' }
      ]
    }
  },

  // 5. Delete cart item
  {
    erase: {
      table: 'CartItems',
      key: { customerId: '12345', productId: 'P123' }
    }
  }
]);
```

## Null Values

`null` values in the array are filtered out:

```typescript
await provider.transaction([
  { create: { table: 'Users', item: {...} } },
  someCondition ? { update: {...} } : null,  // Included conditionally
  { erase: { table: 'Temp', key: {...} } }
].filter(Boolean));  // Or just use null, it's handled automatically
```

## Error Handling

When any operation fails, the entire transaction is rolled back:

```typescript
try {
  await provider.transaction([
    { create: {...} },
    { update: {...} },
    { erase: {...} }
  ]);
  console.log('All operations succeeded');
} catch (error) {
  console.log('Transaction failed, all operations rolled back');

  if (error.name === 'TransactionCanceledException') {
    // One of the conditions failed
    console.log(error.CancellationReasons);
  }
}
```

### Cancellation Reasons

```typescript
try {
  await provider.transaction([...]);
} catch (error) {
  if (error.name === 'TransactionCanceledException') {
    error.CancellationReasons.forEach((reason, index) => {
      if (reason.Code === 'ConditionalCheckFailed') {
        console.log(`Operation ${index} condition failed`);
      }
    });
  }
}
```

## Limitations

### 100 Items Maximum

DynamoDB limits transactions to 100 items:

```typescript
// ❌ Will fail - too many items
await provider.transaction(
  Array.from({ length: 101 }, (_, i) => ({
    create: { table: 'Items', item: { id: i } }
  }))
);

// ✅ Split into multiple transactions
const items = Array.from({ length: 250 }, (_, i) => ({ id: i }));
const chunks = chunkArray(items, 100);

for (const chunk of chunks) {
  await provider.transaction(
    chunk.map(item => ({ create: { table: 'Items', item } }))
  );
}
```

### 4 MB Maximum

Total transaction size cannot exceed 4 MB.

### No Reads

Transactions can't read items - use `validate` to check conditions only.

### Single Table Limit

Each operation can only affect one item (no multi-item updates within a single operation).

## Best Practices

### 1. Always Use Conditions

Add conditions to prevent race conditions:

```typescript
{
  update: {
    table: 'Inventory',
    key: { sku: 'A123' },
    atomicOperations: [
      { operation: 'subtract', property: 'stock', value: 1 }
    ],
    conditions: [
      { operation: 'bigger_than', property: 'stock', value: 0 }
    ]
  }
}
```

### 2. Validate Before Modifying

Use `validate` operations first:

```typescript
await provider.transaction([
  // First, validate
  { validate: { table: 'Users', key: {...}, conditions: [...] } },

  // Then, modify
  { update: { table: 'Users', key: {...}, values: {...} } }
]);
```

### 3. Keep Transactions Small

Smaller transactions are faster and less likely to conflict:

```typescript
// ✅ Good - small, focused transaction
await provider.transaction([
  { update: { table: 'Orders', key: {...}, values: {...} } },
  { create: { table: 'OrderHistory', item: {...} } }
]);

// ❌ Avoid - large transaction with many items
await provider.transaction([...100 operations]);
```

### 4. Handle Failures Gracefully

```typescript
async function transferBalance(from: string, to: string, amount: number) {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await provider.transaction([
        {
          update: {
            table: 'Accounts',
            key: { accountId: from },
            atomicOperations: [
              { operation: 'subtract', property: 'balance', value: amount }
            ],
            conditions: [
              { operation: 'bigger_or_equal_than', property: 'balance', value: amount }
            ]
          }
        },
        {
          update: {
            table: 'Accounts',
            key: { accountId: to },
            atomicOperations: [
              { operation: 'add', property: 'balance', value: amount }
            ]
          }
        }
      ]);

      return; // Success
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
}
```

## See Also

- [create](/provider/create) - For create operation parameters
- [update](/provider/update) - For update operation parameters
- [delete](/provider/delete) - For erase operation parameters
- [helpers](/provider/helpers#to-transaction-params) - toTransactionParams utility

# batchGet

Retrieves multiple items by primary keys. Automatically handles batches >100 items and retries unprocessed items.

## Method Signature

```typescript
batchGet<Entity>(options: BatchListItemsArgs<Entity>): Promise<Entity[]>
```

## Parameters

### `table` (required)
- **Type**: `string`
- Table name

### `keys` (required)
- **Type**: `object[]`
- Array of primary keys

### `consistentRead` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Use strongly consistent reads

### `propertiesToRetrieve` (optional)
- **Type**: `string[]`
- Specific attributes to return

### `throwOnUnprocessed` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Throw error if items remain unprocessed after retries

### `maxRetries` (optional)
- **Type**: `number`
- **Default**: `8`
- Maximum retry attempts for unprocessed items

## Return Value

Returns an array of items. Items that don't exist are not included in the result.

## Basic Example

```typescript
const products = await provider.batchGet({
  table: 'Products',
  keys: [
    { productId: '123' },
    { productId: '456' },
    { productId: '789' }
  ]
});

console.log(products.length);  // May be less than 3 if some don't exist
```

## Automatic Batching

DynamoDB limits batch operations to 100 items. This method automatically handles larger batches:

```typescript
// Works with any number of keys
const items = await provider.batchGet({
  table: 'Products',
  keys: Array.from({ length: 250 }, (_, i) => ({ productId: `P${i}` }))
});

// Internally batched into 3 requests (100 + 100 + 50)
```

## Consistent Reads

```typescript
const products = await provider.batchGet({
  table: 'Products',
  keys: [
    { productId: '123' },
    { productId: '456' }
  ],
  consistentRead: true  // Ensures latest data
});
```

## Partial Retrieval

Retrieve only specific properties:

```typescript
const products = await provider.batchGet({
  table: 'Products',
  keys: [
    { productId: '123' },
    { productId: '456' }
  ],
  propertiesToRetrieve: ['name', 'price', 'inStock']
});
```

## Composite Keys

For tables with partition and sort keys:

```typescript
const orderItems = await provider.batchGet({
  table: 'OrderItems',
  keys: [
    { orderId: 'A100', itemId: 'I1' },
    { orderId: 'A100', itemId: 'I2' },
    { orderId: 'A200', itemId: 'I1' }
  ]
});
```

## Handling Unprocessed Items

DynamoDB may not process all items in a single request due to throughput limits. This method automatically retries unprocessed items:

```typescript
// Default: retries up to 8 times
const items = await provider.batchGet({
  table: 'Products',
  keys: productKeys,
  maxRetries: 8  // Default value
});
```

### Strict Mode

Throw an error if items remain unprocessed after all retries:

```typescript
try {
  const items = await provider.batchGet({
    table: 'Products',
    keys: productKeys,
    throwOnUnprocessed: true  // Throws if not all items retrieved
  });
} catch (error) {
  console.log('Some items could not be retrieved');
}
```

## Missing Items

Items that don't exist are simply not included in the result:

```typescript
const items = await provider.batchGet({
  table: 'Products',
  keys: [
    { productId: '123' },  // exists
    { productId: '999' },  // doesn't exist
    { productId: '456' }   // exists
  ]
});

console.log(items.length);  // 2 (item 999 not included)
```

## Type Safety

```typescript
interface Product {
  productId: string;
  name: string;
  price: number;
}

const products = await provider.batchGet<Product>({
  table: 'Products',
  keys: [
    { productId: '123' },
    { productId: '456' }
  ]
});

// products is Product[]
products.forEach(p => {
  console.log(p.name);   // ✅ Type-safe
  console.log(p.invalid); // ❌ TypeScript error
});
```

## Performance Considerations

### Batch Size

Larger batches are more efficient:

```typescript
// Better: One batch request
const items = await provider.batchGet({
  table: 'Products',
  keys: productIds.map(id => ({ productId: id }))
});

// Worse: Multiple individual requests
const items = await Promise.all(
  productIds.map(id => provider.get({
    table: 'Products',
    key: { productId: id }
  }))
);
```

### Order Not Guaranteed

Items may be returned in any order:

```typescript
const items = await provider.batchGet({
  table: 'Products',
  keys: [
    { productId: '1' },
    { productId: '2' },
    { productId: '3' }
  ]
});

// items order may be [2, 1, 3] or any other permutation
```

If you need specific order, sort afterward:

```typescript
const items = await provider.batchGet<Product>({
  table: 'Products',
  keys: productIds.map(id => ({ productId: id }))
});

// Sort by productId
items.sort((a, b) => a.productId.localeCompare(b.productId));
```

## Example: Batch Get with Fallback

```typescript
async function getProductsWithFallback(ids: string[]) {
  const products = await provider.batchGet<Product>({
    table: 'Products',
    keys: ids.map(id => ({ productId: id }))
  });

  const foundIds = new Set(products.map(p => p.productId));
  const missingIds = ids.filter(id => !foundIds.has(id));

  if (missingIds.length > 0) {
    console.log('Missing products:', missingIds);
    // Handle missing products (e.g., fetch from elsewhere, log, etc.)
  }

  return products;
}
```

## Limitations

- **Max 100 items per request** - Automatically handled by batching
- **Max 16 MB total** - DynamoDB limit on response size
- **Unprocessed items** - May occur with high throughput
- **No filtering** - Retrieves entire items (use `propertiesToRetrieve` to limit)

## See Also

- [get](/provider/get) - Retrieve single item
- [query](/provider/query) - Query items by partition key
- [list](/provider/list) - Scan entire table

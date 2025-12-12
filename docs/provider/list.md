# list & listAll

Scan a table with optional filters, limits, and pagination.

## list

Scans a table with pagination support.

### Method Signature

```typescript
list<Entity>(
  table: string,
  options?: ListOptions<Entity>
): Promise<ListTableResult<Entity>>
```

### Parameters

#### `table` (required)
- **Type**: `string`
- Table name

#### `propertiesToRetrieve` (optional)
- **Type**: `string[]`
- Attributes to return

#### `filters` (optional)
- **Type**: `FilterConfig`
- Filter conditions (see [Filters](#filters) below)

#### `limit` (optional)
- **Type**: `number`
- Maximum items to return

#### `consistentRead` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Use strongly consistent reads

#### `parallelRetrieval` (optional)
- **Type**: `{ segment: number; total: number }`
- Parallel scan configuration

#### `index` (optional)
- **Type**: `string`
- Index name to scan

#### `paginationToken` (optional)
- **Type**: `string`
- Continue from previous scan

### Return Value

Returns `{ items: Entity[], paginationToken?: string }`

### Basic Example

```typescript
const result = await provider.list('Products', {
  filters: {
    category: 'electronics',
    price: { operation: 'bigger_than', value: 100 }
  },
  limit: 100
});

console.log(result.items);
if (result.paginationToken) {
  // More results available
}
```

## listAll

Scans entire table, automatically handling pagination.

### Method Signature

```typescript
listAll<Entity>(
  table: string,
  options?: ListAllOptions<Entity>
): Promise<Entity[]>
```

### Parameters

Same as `list` except no `limit` or `paginationToken`.

### Return Value

Returns array of all items.

### Example

```typescript
const products = await provider.listAll('Products', {
  filters: { category: 'electronics' },
  propertiesToRetrieve: ['productId', 'name', 'price']
});

console.log(`Found ${products.length} products`);
```

## Filters {#filters}

Three filter syntax options:

### 1. Equality Filter

Simple key-value for exact matches:

```typescript
const result = await provider.list('Products', {
  filters: {
    category: 'electronics',
    inStock: true
  }
});
// WHERE category = 'electronics' AND inStock = true
```

### 2. IN Filter

Array value for IN operation:

```typescript
const result = await provider.list('Products', {
  filters: {
    category: ['electronics', 'appliances', 'tools']
  }
});
// WHERE category IN ('electronics', 'appliances', 'tools')
```

### 3. Complex Filter

Object with operation and value:

```typescript
const result = await provider.list('Products', {
  filters: {
    price: { operation: 'bigger_than', value: 100 },
    rating: { operation: 'bigger_or_equal_than', value: 4 },
    name: { operation: 'begins_with', value: 'Pro' }
  }
});
// WHERE price > 100 AND rating >= 4 AND name BEGINS WITH 'Pro'
```

### Mixed Filters

Combine all three syntaxes:

```typescript
const result = await provider.list('Products', {
  filters: {
    category: 'electronics',                              // Equality
    status: ['active', 'featured'],                       // IN
    price: { operation: 'between', start: 50, end: 500 }, // Complex
    inStock: true                                          // Equality
  }
});
```

### Available Filter Operations

- `equal`
- `not_equal`
- `lower_than`
- `lower_or_equal_than`
- `bigger_than`
- `bigger_or_equal_than`
- `begins_with`
- `contains`
- `not_contains`
- `between`
- `in`
- `not_in`
- `exists`
- `not_exists`

## Pagination

### Manual Pagination

```typescript
let paginationToken: string | undefined;
const allItems: Product[] = [];

do {
  const result = await provider.list<Product>('Products', {
    filters: { category: 'electronics' },
    limit: 100,
    paginationToken
  });

  allItems.push(...result.items);
  paginationToken = result.paginationToken;
} while (paginationToken);

console.log(`Total items: ${allItems.length}`);
```

### Automatic Pagination

Use `listAll` for automatic pagination:

```typescript
const allItems = await provider.listAll<Product>('Products', {
  filters: { category: 'electronics' }
});
```

## Parallel Scans

For faster scans of large tables, use parallel segments:

```typescript
const segment1Promise = provider.list('Products', {
  parallelRetrieval: { segment: 0, total: 4 }
});

const segment2Promise = provider.list('Products', {
  parallelRetrieval: { segment: 1, total: 4 }
});

const segment3Promise = provider.list('Products', {
  parallelRetrieval: { segment: 2, total: 4 }
});

const segment4Promise = provider.list('Products', {
  parallelRetrieval: { segment: 3, total: 4 }
});

const [r1, r2, r3, r4] = await Promise.all([
  segment1Promise,
  segment2Promise,
  segment3Promise,
  segment4Promise
]);

const allItems = [...r1.items, ...r2.items, ...r3.items, ...r4.items];
```

## Scanning Indexes

Scan a secondary index instead of the table:

```typescript
const result = await provider.list('Products', {
  index: 'CategoryIndex',
  filters: { category: 'electronics' }
});
```

## Partial Retrieval

Retrieve only specific properties:

```typescript
const result = await provider.list('Products', {
  propertiesToRetrieve: ['productId', 'name', 'price']
});
```

## Performance Considerations

### Scans Are Expensive

Scans read the entire table, even with filters:

```typescript
// ❌ Scans entire table, then filters
const result = await provider.list('Products', {
  filters: { category: 'electronics' }
});

// ✅ Better: Use query if you have a partition key
const result = await provider.query({
  table: 'Products',
  partitionKey: { name: 'category', value: 'electronics' }
});
```

### Use Filters to Reduce Data Transfer

```typescript
// ❌ Retrieves all data, filters in application
const all = await provider.listAll('Products');
const filtered = all.filter(p => p.price > 100);

// ✅ Better: Filter in DynamoDB
const filtered = await provider.listAll('Products', {
  filters: {
    price: { operation: 'bigger_than', value: 100 }
  }
});
```

### Use Limits to Control Costs

```typescript
// Limit scan to 100 items
const result = await provider.list('Products', {
  limit: 100
});
```

## When to Use list vs query

| Scenario | Use |
|----------|-----|
| Retrieve all items | `list` or `listAll` |
| Filter by partition key | [query](/provider/query) |
| Filter by non-key attribute | `list` with filters |
| Retrieve specific items | [get](/provider/get) or [batchGet](/provider/batch-get) |

## Example: Filtered Scan

```typescript
interface Product {
  productId: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  rating: number;
}

const products = await provider.listAll<Product>('Products', {
  filters: {
    category: ['electronics', 'appliances'],
    price: { operation: 'between', start: 50, end: 500 },
    inStock: true,
    rating: { operation: 'bigger_or_equal_than', value: 4 }
  },
  propertiesToRetrieve: ['productId', 'name', 'price']
});
```

## See Also

- [query](/provider/query) - Query by partition key (more efficient)
- [get](/provider/get) - Retrieve single item
- [batchGet](/provider/batch-get) - Retrieve multiple items by keys

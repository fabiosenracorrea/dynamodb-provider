# query, queryOne, queryAll

Query items by partition key with optional range key conditions.

## query

Query with pagination support.

### Method Signature

```typescript
query<Entity>(params: QueryParams<Entity>): Promise<QueryResult<Entity>>
```

### Parameters

#### `table` (required)
- **Type**: `string`
- Table name

#### `partitionKey` (required)
- **Type**: `{ name: string; value: string | number }`
- Partition key to query

#### `rangeKey` (optional)
- **Type**: Range key condition
- Range key filter with operation

#### `index` (optional)
- **Type**: `string`
- Index name to query

#### `retrieveOrder` (optional)
- **Type**: `'ASC' | 'DESC'`
- **Default**: `'ASC'`
- Sort order

#### `limit` (optional)
- **Type**: `number`
- Maximum items to return

#### `fullRetrieval` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Auto-paginate until all items retrieved

#### `paginationToken` (optional)
- **Type**: `string`
- Continue from previous query

#### `filters` (optional)
- **Type**: Filter expressions
- Additional filter conditions

#### `propertiesToRetrieve` (optional)
- **Type**: `string[]`
- Specific attributes to return (root-level only)

### Return Value

Returns `{ items: Entity[], paginationToken?: string }`

### Basic Example

```typescript
const { items } = await provider.query<Order>({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  rangeKey: {
    name: 'orderId',
    operation: 'bigger_or_equal_than',
    value: 'A100'
  },
  retrieveOrder: 'DESC',
  limit: 10
});
```

## queryOne

Query for the first matching item.

### Method Signature

```typescript
queryOne<Entity>(params: QueryOneParams<Entity>): Promise<Entity | undefined>
```

### Parameters

Same as `query`, except:
- No `limit` - always queries for 1 item
- No `paginationToken` - returns first match only
- No `fullRetrieval`

### Return Value

Returns the first item or `undefined` if no match found.

### Example

```typescript
const user = await provider.queryOne({
  table: 'Users',
  partitionKey: { name: 'email', value: 'user@example.com' }
});

if (user) {
  console.log(`Found user: ${user.name}`);
}
```

## queryAll

Query for all matching items with auto-pagination.

### Method Signature

```typescript
queryAll<Entity>(params: QueryAllParams<Entity>): Promise<Entity[]>
```

### Parameters

Same as `query`, except:
- No `paginationToken` - automatically handles pagination
- No `fullRetrieval` - always set to true internally
- `limit` (optional) - maximum total items to return (stops pagination when limit reached)

### Return Value

Returns array of all matching items.

### Example

```typescript
const allOrders = await provider.queryAll({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  rangeKey: {
    name: 'createdAt',
    operation: 'bigger_or_equal_than',
    value: '2024-01-01'
  },
  filters: { status: 'completed' },
  limit: 100  // Optional: max total items
});

console.log(`Found ${allOrders.length} completed orders`);
```

## Range Key Operations

Range key conditions support these operations:

### `equal`
Exact match:

```typescript
rangeKey: {
  name: 'timestamp',
  operation: 'equal',
  value: '2024-01-15T10:30:00Z'
}
```

### `lower_than` / `lower_or_equal_than`
Less than comparisons:

```typescript
rangeKey: {
  name: 'createdAt',
  operation: 'lower_than',
  value: '2024-01-01'
}
```

### `bigger_than` / `bigger_or_equal_than`
Greater than comparisons:

```typescript
rangeKey: {
  name: 'orderId',
  operation: 'bigger_or_equal_than',
  value: 'ORDER-1000'
}
```

### `begins_with`
String prefix:

```typescript
rangeKey: {
  name: 'orderId',
  operation: 'begins_with',
  value: 'ORDER-2024'
}
```

### `between`
Range:

```typescript
rangeKey: {
  name: 'timestamp',
  operation: 'between',
  start: '2024-01-01',
  end: '2024-01-31'
}
```

## Complete Example

```typescript
interface Order {
  customerId: string;
  orderId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const { items, paginationToken } = await provider.query<Order>({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  rangeKey: {
    name: 'createdAt',
    operation: 'between',
    start: '2024-01-01',
    end: '2024-01-31'
  },
  retrieveOrder: 'DESC',
  limit: 10,
  filters: { status: 'shipped' },
  propertiesToRetrieve: ['orderId', 'totalAmount', 'createdAt']
});
```

## Querying Indexes

Query a secondary index:

```typescript
const { items } = await provider.query({
  table: 'Orders',
  index: 'StatusIndex',
  partitionKey: { name: 'status', value: 'pending' },
  rangeKey: {
    name: 'createdAt',
    operation: 'bigger_than',
    value: '2024-01-01'
  }
});
```

## Pagination

Get one page at a time:

```typescript
const firstPage = await provider.query({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  fullRetrieval: false,
  limit: 10
});

// Later, get next page
if (firstPage.paginationToken) {
  const secondPage = await provider.query({
    table: 'Orders',
    partitionKey: { name: 'customerId', value: '12345' },
    fullRetrieval: false,
    limit: 10,
    paginationToken: firstPage.paginationToken
  });
}
```

## Sort Order

### Ascending (Default)

```typescript
const { items } = await provider.query({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  retrieveOrder: 'ASC'  // Oldest first
});
```

### Descending

```typescript
const { items } = await provider.query({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  retrieveOrder: 'DESC'  // Newest first
});
```

## Filters vs Range Keys

**Range keys** filter at query time (efficient):
```typescript
// ✅ Efficient - filters during query
rangeKey: {
  name: 'status',
  operation: 'equal',
  value: 'active'
}
```

**Filters** apply after query (less efficient):

```typescript
// ❌ Less efficient - retrieves all, then filters
filters: {
  status: 'active'
}
```

Use range keys when possible for better performance.

## Common Patterns

### Get Latest Items

```typescript
const latestOrders = await provider.query({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  retrieveOrder: 'DESC',
  limit: 10
});
```

### Date Range Query

```typescript
const janOrders = await provider.queryAll({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  rangeKey: {
    name: 'createdAt',
    operation: 'between',
    start: '2024-01-01',
    end: '2024-01-31'
  }
});
```

### Prefix Search

```typescript
const orders2024 = await provider.queryAll({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  rangeKey: {
    name: 'orderId',
    operation: 'begins_with',
    value: 'ORDER-2024'
  }
});
```

## Performance Tips

1. **Use sparse indexes** for frequently filtered attributes
2. **Limit results** to reduce data transfer
3. **Use `propertiesToRetrieve`** to fetch only needed fields
4. **Order matters** - design sort keys for common queries

## See Also

- [get](/provider/get) - Retrieve single item by key
- [list](/provider/list) - Scan entire table
- [batchGet](/provider/batch-get) - Retrieve multiple items by keys

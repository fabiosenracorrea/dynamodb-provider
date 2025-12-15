# query, queryOne, queryAll

Query items by partition key with optional range key conditions.

## query

Query with pagination support.

### Method Signature

```typescript
query<Entity>(params: SingleTableQueryParams<Entity>): Promise<QueryResult<Entity>>
```

### Parameters

#### `partition` (required)
- **Type**: `KeyValue`
- Partition key value

#### `range` (optional)
- **Type**: Range key condition
- Range key filter with operation

#### `index` (optional)
- **Type**: `string`
- Index name to query (only if table has `indexes` configured)

#### `retrieveOrder` (optional)
- **Type**: `'ASC' | 'DESC'`
- **Default**: `'ASC'`
- Sort order

#### `limit` (optional)
- **Type**: `number`
- Maximum items to return

#### `fullRetrieval` (optional)
- **Type**: `boolean`
- **Default**: `true`
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
const { items, paginationToken } = await table.query({
  partition: ['USER', 'your-id'],
  range: {
    value: 'LOG#',
    operation: 'begins_with'
  },
  retrieveOrder: 'DESC',
  limit: 10,
  propertiesToRetrieve: ['id', 'timestamp', 'message']
});
```

## queryOne

Query for the first matching item.

### Method Signature

```typescript
queryOne<Entity>(params: SingleTableQueryOneParams<Entity>): Promise<Entity | undefined>
```

### Parameters

Same as `query`, except:
- No `limit` - always queries for 1 item
- No `paginationToken` - returns first match only
- No `fullRetrieval` - automatically set to false

### Example

```typescript
const user = await table.queryOne({
  partition: ['USER', 'user@example.com']
});

if (user) {
  console.log(`Found user: ${user.name}`);
}
```

## queryAll

Query for all matching items with auto-pagination.

### Method Signature

```typescript
queryAll<Entity>(params: SingleTableQueryAllParams<Entity>): Promise<Entity[]>
```

### Parameters

Same as `query`, except:
- No `paginationToken` - automatically handles pagination
- No `fullRetrieval` - always set to true internally
- `limit` (optional) - maximum total items to return

### Example

```typescript
const allLogs = await table.queryAll({
  partition: ['USER', 'your-id'],
  range: {
    value: 'LOG#',
    operation: 'begins_with'
  },
  retrieveOrder: 'DESC',
  filters: { level: 'ERROR' },
  limit: 50  // Optional: max total items
});

console.log(`Found ${allLogs.length} error logs`);
```

## Array Keys

```typescript
const { items } = await table.query({
  partition: ['USER', userId],  // Becomes: 'USER#userId'
  range: {
    value: ['ORDER', '2024'],   // Becomes: 'ORDER#2024'
    operation: 'begins_with'
  }
});
```

## Range Operations

All range operations from Provider query are supported:

- `equal`
- `lower_than`, `lower_or_equal_than`
- `bigger_than`, `bigger_or_equal_than`
- `begins_with`
- `between`

See [Provider query](/provider/query) for details.

## Query Index

```typescript
const { items } = await table.query({
  partition: 'john@example.com',
  index: 'EmailIndex',
  retrieveOrder: 'DESC'
});
```

## See Also

- [Provider query](/provider/query) - Range operations reference
- [get](/single-table/get) - Retrieve single item
- [Type Methods](/single-table/type-methods) - Query by entity type

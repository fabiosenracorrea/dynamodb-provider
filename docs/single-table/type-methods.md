# Type Methods

Methods for querying and filtering items by entity type. Requires `typeIndex` configured.

## listAllFromType

Retrieves all items of a specified type. Requires `typeIndex` with an existing DynamoDB index.

### Method Signature

```typescript
listAllFromType<Entity>(type: string): Promise<Entity[]>
```

### Parameters

- `type` - Entity type value matching the `typeIndex` partition key

### Return Value

Returns array of all items. Automatically paginates.

### Example

```typescript
const users = await table.listAllFromType('USER');

console.log(`Found ${users.length} users`);
```

### Requirements

- `typeIndex` must be configured
- The index must exist in DynamoDB

## listType

Retrieves items of a specific type with pagination support. Requires `typeIndex` with an existing DynamoDB index.

### Method Signature

```typescript
listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>>
```

### Parameters

#### `type` (required)
- **Type**: `string`
- Entity type value

#### `range` (optional)
- **Type**: Range key filter
- Operations: `equal`, `lower_than`, `lower_or_equal_than`, `bigger_than`, `bigger_or_equal_than`, `begins_with`, `between`

#### `limit` (optional)
- **Type**: `number`
- Maximum items to return

#### `paginationToken` (optional)
- **Type**: `string`
- Continue from previous query

#### `retrieveOrder` (optional)
- **Type**: `'ASC' | 'DESC'`
- Sort order

#### `fullRetrieval` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Auto-paginate until all items retrieved

#### `filters` (optional)
- **Type**: Filter expressions
- Additional filter conditions

### Return Value

Returns `{ items: Entity[], paginationToken?: string }`

### Example

```typescript
const { items, paginationToken } = await table.listType({
  type: 'USER',
  range: {
    operation: 'bigger_than',
    value: '2024-01-01'
  },
  limit: 10,
  retrieveOrder: 'DESC'
});
```

### With Filters

```typescript
const { items } = await table.listType({
  type: 'USER',
  filters: {
    status: 'active',
    role: ['admin', 'moderator']
  },
  limit: 100
});
```

## findTableItem

Finds the first item matching a type. Requires items to have the `typeIndex` partition column on them. Index does not need to exist as this is in code operation

### Method Signature

```typescript
findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined
```

### Parameters

- `items` - Array of items to search
- `type` - Entity type value

### Return Value

Returns first matching item or `undefined`.

### Example

```typescript
const items = await table.query({
  partition: ['USER', id]
});

const userData = table.findTableItem<User>(items.items, 'USER');
const profile = table.findTableItem<Profile>(items.items, 'USER_PROFILE');
```

### Use Case

Useful when querying a partition that contains multiple entity types:

```typescript
// Partition contains USER, USER_PROFILE, USER_SETTINGS
const { items } = await table.query({
  partition: ['USER', userId]
});

const user = table.findTableItem<User>(items, 'USER');
const profile = table.findTableItem<Profile>(items, 'USER_PROFILE');
const settings = table.findTableItem<Settings>(items, 'USER_SETTINGS');
```

## filterTableItens

Filters items by type. Requires items to have the `typeIndex` partition column on them. Index does not need to exist as this is in code operation

### Method Signature

```typescript
filterTableItens<Entity>(items: AnyObject[], type: string): Entity[]
```

### Parameters

- `items` - Array of items to filter
- `type` - Entity type value

### Return Value

Returns array of matching items.

### Example

```typescript
const items = await table.query({
  partition: ['USER', id]
});

const logs = table.filterTableItens<Log>(items.items, 'USER_LOG');

console.log(`Found ${logs.length} log entries`);
```

### Use Case

Retrieve all items of a specific type from mixed results:

```typescript
// Query returns USER, ORDER, ORDER_ITEM entities
const { items } = await table.query({
  partition: ['CUSTOMER', customerId]
});

const user = table.findTableItem<User>(items, 'USER');
const orders = table.filterTableItens<Order>(items, 'ORDER');
const orderItems = table.filterTableItens<OrderItem>(items, 'ORDER_ITEM');
```

## Configuration Requirements

### For listType and listAllFromType

Requires `typeIndex` with an index that exists in DynamoDB:

```typescript
const table = new SingleTable({
  ...config,
  typeIndex: {
    name: 'TypeIndex',        // Must exist in DynamoDB
    partitionKey: '_type',
    rangeKey: '_timestamp'
  }
});
```

### For findTableItem and filterTableItens

Only requires `typeIndex.partitionKey` configured (index need not exist):

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  typeIndex: {
    name: 'FakeIndexName',
    partitionKey: '_type',  // Only this is required - it will be added to items
    // Index doesn't need to exist
  }
});
```

## See Also

- [Configuration](/single-table/configuration#typeindex) - typeIndex configuration
- [query](/single-table/query) - Query by partition key
- [Schema](/schema/) - Entity-based type management

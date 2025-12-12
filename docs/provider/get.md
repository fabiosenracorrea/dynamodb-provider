# get

Retrieves a single item by primary key.

## Method Signature

```typescript
get<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
  params: GetItemParams<Entity, PKs>
): Promise<Entity | undefined>
```

## Parameters

### `table` (required)
- **Type**: `string`
- Table name

### `key` (required)
- **Type**: `object`
- Primary key (partition key and optionally sort key)

### `consistentRead` (optional)
- **Type**: `boolean`
- **Default**: `false`
- Use strongly consistent reads

### `propertiesToRetrieve` (optional)
- **Type**: `array of string`
- Specific attributes to return (root-level only)

## Return Value

Returns the item or `undefined` if not found.

## Example

```typescript
interface User {
  userId: string;
  name: string;
  email: string;
  age: number;
}

const user = await provider.get<User>({
  table: 'UsersTable',
  key: { userId: '12345' },
  consistentRead: true,
  propertiesToRetrieve: ['name', 'email'],
});
```

## Consistent Reads

By default, DynamoDB uses eventually consistent reads. For strongly consistent reads:

```typescript
const user = await provider.get<User>({
  table: 'Users',
  key: { userId: '12345' },
  consistentRead: true  // Ensures you get the most recent data
});
```

## Partial Retrieval

Retrieve only specific properties to reduce data transfer:

```typescript
const user = await provider.get<User>({
  table: 'Users',
  key: { userId: '12345' },
  propertiesToRetrieve: ['name', 'email']  // Only fetch these fields
});

// user will only have name and email properties
```

**Note**: `propertiesToRetrieve` only works with root-level properties, not nested paths.

## Composite Keys

For tables with both partition and sort keys:

```typescript
interface OrderItem {
  orderId: string;
  itemId: string;
  quantity: number;
  price: number;
}

const item = await provider.get<OrderItem>({
  table: 'OrderItems',
  key: {
    orderId: 'ORDER-123',  // Partition key
    itemId: 'ITEM-456'     // Sort key
  }
});
```

## See Also

- [query](/provider/query) - For retrieving multiple items by partition key
- [batchGet](/provider/batch-get) - For retrieving multiple items by keys
- [list](/provider/list) - For scanning entire table

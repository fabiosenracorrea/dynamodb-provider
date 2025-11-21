# Dynamo DB Provider

[![npm version](https://img.shields.io/npm/v/dynamodb-provider.svg)](https://www.npmjs.com/package/dynamodb-provider)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/dynamodb-provider)](https://bundlephobia.com/result?p=dynamodb-provider)
[![License](https://img.shields.io/npm/l/dynamodb-provider)](./LICENSE)

Fast Develop for DynamoDB with this type-safe & single-table awareness library!

## Introduction

The DynamoDB SDK (both v2 and v3) lacks type safety and requires significant boilerplate. Building expressions, avoiding attribute name collisions, and managing code repetition typically results in verbose, hard-to-maintain abstractions.

This library wraps DynamoDB operations with type-safe methods that work for both table-per-entity and single-table designs. Apart from `uuid` and `ksuid` for ID generation, it has zero dependencies.

## Architecture

The library has three parts:

1. **DynamoDB Provider** - Type-safe wrappers around DynamoDB operations (get, update, query, transaction, etc.). Use this for table-per-entity designs.
2. **SingleTable** - Table configuration layer that removes repetition when all operations target the same table with fixed keys and indexes.
3. **Schema** - Entity and collection definitions for single-table designs, with partition and access pattern management.

Each part builds on the previous. Use only what you need—the provider works standalone, and SingleTable works without schemas.

## 1. DynamoDB Provider

The provider wraps AWS SDK clients (v2 or v3) with type-safe methods. Only DocumentClient instances are supported.

### Using v2

```ts
import { DynamoDB } from 'aws-sdk';
import { DynamodbProvider } from 'dynamodb-provider'

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v2',

    instance: new DynamoDB.DocumentClient({
      // any config you may need. region, credentials...
    }),
  },
});
```

### Using v3

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  GetCommand,
  DeleteCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
  TransactWriteCommand,
 } from "@aws-sdk/lib-dynamodb";

import { DynamodbProvider } from 'dynamodb-provider'

const ddbClient = new DynamoDBClient({
  // any config you may need. region, credentials...
});

const documentClient = DynamoDBDocumentClient.from(ddbClient);

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',

    instance: documentClient,

    commands: {
      BatchGetCommand,
      GetCommand,
      DeleteCommand,
      PutCommand,
      UpdateCommand,
      ScanCommand,
      QueryCommand,
      TransactWriteCommand,
    };
  },
});
```

The library doesn't bundle AWS SDK packages—install the version you need.

### Configuration

```ts
interface DynamoDbProviderParams {
  dynamoDB: DynamoDBConfig;
  logCallParams?: boolean;
}
```

**`logCallParams`** - Logs the parameters sent to DynamoDB before each operation. Useful for debugging.

### Provider Methods

Here you'll find each method exposed on the provider.

Quick Access

- [get](#get)
- [create](#create)
- [delete](#delete)
- [update](#update)
- [batchGet](#batchGet)
- [list](#list)
- [listAll](#listAll)
- [query](#query)

### get

Retrieves a single item by primary key.

```ts
get<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
  params: GetItemParams<Entity, PKs>,
): Promise<Entity | undefined>
```

**Parameters:**

- `table` - Table name
- `key` - Primary key (partition key and optionally sort key)
- `consistentRead` - Use strongly consistent reads (default: false)
- `propertiesToRetrieve` - Specific attributes to return (root-level only)

Returns the item or `undefined` if not found.

**Example:**

```ts
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

### create

Creates an item in the table. DynamoDB's PutItem overwrites existing items—use `conditions` to prevent this.

```ts
create<Entity>(params: CreateItemParams<Entity>): Promise<Entity>
```

**Parameters:**

- `table` - Table name
- `item` - Item to create (must include primary key)
- `conditions` - Optional conditions that must be met before creating

**Example:**

```ts
const user = await provider.create({
  table: 'Users',
  item: {
    userId: '12345',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  conditions: [
    { operation: 'not_exists', property: 'userId' }
  ],
});
```

For composite keys, as dynamodb doc, check both:

```ts
conditions: [
  { operation: 'not_exists', property: 'partitionKey' },
  { operation: 'not_exists', property: 'sortKey' }
]
```

**Condition Operations:**

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

**Condition Structure:**

```ts
{
  property: string;
  operation: ExpressionOperation;
  value?: string | number;           // for basic operations
  values?: (string | number)[];      // for 'in', 'not_in'
  start?: string | number;           // for 'between'
  end?: string | number;             // for 'between'
  joinAs?: 'and' | 'or';            // default: 'and'
  nested?: ItemExpression[];         // for parenthesized expressions
}
```

**Nested Conditions:**

Use `nested` for complex parenthesized conditions:

```ts
conditions: [
  {
    property: 'status',
    operation: 'equal',
    value: 'active',
    nested: [
      { property: 'price', operation: 'lower_than', value: 100, joinAs: 'or' },
      { property: 'featured', operation: 'equal', value: true }
    ]
  }
]
// Generates: (status = 'active' AND (price < 100 OR featured = true))
```

### delete

Deletes an item by primary key.

```ts
delete<Entity>(params: DeleteItemParams<Entity>): Promise<void>
```

**Parameters:**

- `table` - Table name
- `key` - Primary key of the item to delete
- `conditions` - Optional conditions that must be met before deleting

**Example:**

```ts
await provider.delete({
  table: 'Users',
  key: { id: '12345' },
  conditions: [
    { operation: 'exists', property: 'id' }
  ]
});
```

### update

Updates an item with support for value updates, property removal, and atomic operations.

```ts
update<Entity>(params: UpdateParams<Entity>): Promise<Partial<Entity> | undefined>
```

**Parameters:**

- `table` - Table name
- `key` - Primary key
- `values` - Properties to update
- `remove` - Properties to remove (root-level only)
- `atomicOperations` - Atomic operations (see details below)
- `conditions` - Conditions that must be met
- `returnUpdatedProperties` - Return updated values (useful for counters)

**Example:**

```ts
const updated = await provider.update({
  table: 'Users',
  key: { userId: '12345' },
  values: { name: 'John Doe' },
  atomicOperations: [
    { operation: 'add', property: 'loginCount', value: 1 }
  ],
  conditions: [
    { operation: 'exists', property: 'userId' }
  ],
  returnUpdatedProperties: true
});
// returns { name: 'John Doe', loginCount: 43 }
```

Atomic operations can include inline conditions:

```ts
await provider.update({
  table: 'Items',
  key: { id: '12' },
  atomicOperations: [
    {
      operation: 'subtract',
      property: 'count',
      value: 1,
      if: { operation: 'bigger_than', value: 0 }  // prevents negative
    }
  ],
})
```

**Atomic Operations:**

- **Math Operations:**
  - `sum` - Add to existing value (fails if property doesn't exist)
  - `subtract` - Subtract from existing value (fails if property doesn't exist)
  - `add` - Add to value, auto-initializes to 0 if missing

- **Set Operations:**
  - `add_to_set` - Add values to a DynamoDB Set
  - `remove_from_set` - Remove values from a Set

- **Conditional:**
  - `set_if_not_exists` - Set value only if property doesn't exist
    - Optional `refProperty` - Check different property for existence

```ts
atomicOperations: [
  { type: 'add', property: 'count', value: 1 },  // safe, auto-init to 0
  { type: 'sum', property: 'total', value: 50 }, // requires existing value
  {
    type: 'set_if_not_exists',
    property: 'status',
    value: 'pending',
    refProperty: 'createdAt'  // set status if createdAt missing
  }
]
```

Counter pattern for sequential IDs:

```ts
const { count } = await provider.update({
  table: 'Counters',
  key: { name: 'USER_ID' },
  atomicOperations: [{ operation: 'add', property: 'count', value: 1 }],
  returnUpdatedProperties: true
});

await provider.create({
  table: 'Users',
  item: { id: count, name: 'John' }
});
```

### batchGet

Retrieves multiple items by primary keys. Automatically handles batches >100 items and retries unprocessed items.

```ts
batchGet<Entity>(options: BatchListItemsArgs<Entity>): Promise<Entity[]>
```

**Parameters:**

- `table` - Table name
- `keys` - Array of primary keys
- `consistentRead` - Use strongly consistent reads (default: false)
- `propertiesToRetrieve` - Specific attributes to return
- `throwOnUnprocessed` - Throw if items remain unprocessed after retries (default: false)
- `maxRetries` - Max retry attempts for unprocessed items (default: 8)

**Example:**

```ts
const products = await provider.batchGet({
  table: 'Products',
  keys: [
    { productId: '123' },
    { productId: '456' }
  ],
  consistentRead: true,
  propertiesToRetrieve: ['name', 'price'],
});
```

### list

Scans a table with optional filters, limits, and pagination.

```ts
list<Entity>(table: string, options?: ListOptions<Entity>): Promise<ListTableResult<Entity>>
```

**Parameters:**

- `table` - Table name
- `propertiesToGet` - Attributes to return
- `filters` - Filter conditions (value, array, or filter config)
- `limit` - Max items to return
- `consistentRead` - Use strongly consistent reads (default: false)
- `parallelRetrieval` - Parallel scan config: `{ segment, total }`
- `index` - Index name to scan
- `paginationToken` - Continue from previous scan

Returns `{ items, paginationToken? }`

**Filter syntaxes:**
- `{ status: 'active' }` - Equality
- `{ status: ['active', 'pending'] }` - IN operation
- `{ price: { operation: 'bigger_than', value: 100 } }` - Complex filter

**Example:**

```ts
const result = await provider.list('Products', {
  filters: {
    category: 'electronics',
    price: { operation: 'bigger_than', value: 100 }
  },
  limit: 100
});
```

### listAll

Scans entire table, automatically handling pagination. Same options as `list` except no `limit` or `paginationToken`.

```ts
listAll<Entity>(table: string, options?: ListAllOptions<Entity>): Promise<Entity[]>
```

**Example:**

```ts
const products = await provider.listAll('Products', {
  filters: { category: 'electronics' },
  propertiesToGet: ['productId', 'name', 'price']
});
```

### query

Queries items by partition key with optional range key conditions.

```ts
query<Entity>(params: QueryParams<Entity>): Promise<QueryResult<Entity>>
```

**Parameters:**

- `table` - Table name
- `partitionKey` - `{ name, value }` for partition key
- `rangeKey` - Range key condition with operations: `equal`, `lower_than`, `lower_or_equal_than`, `bigger_than`, `bigger_or_equal_than`, `begins_with`, `between`
- `index` - Index name to query
- `retrieveOrder` - `ASC` or `DESC` (default: ASC)
- `limit` - Max items to return
- `fullRetrieval` - Auto-paginate until all items retrieved (default: true)
- `paginationToken` - Continue from previous query
- `filters` - Additional filter expressions

Returns `{ items, paginationToken? }`

**Example:**

```ts
const { items } = await provider.query({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  rangeKey: {
    name: 'orderId',
    operation: 'bigger_or_equal_than',
    value: 'A100'
  },
  retrieveOrder: 'DESC',
  limit: 10,
  filters: { status: 'shipped' }
});
```

### transaction

Executes multiple operations atomically. All operations succeed or all fail. Wraps TransactWrite (max 100 items or 4MB).

```ts
transaction(configs: (TransactionConfig | null)[]): Promise<void>
```

**Note:** `executeTransaction` is deprecated. Use `transaction` instead.

**Transaction types:**
- `{ create: CreateItemParams }` - Put item
- `{ update: UpdateParams }` - Update item
- `{ erase: DeleteItemParams }` - Delete item
- `{ validate: ValidateTransactParams }` - Condition check

**Example:**

```ts
await provider.transaction([
  {
    update: {
      table: 'Orders',
      key: { orderId: 'A100' },
      values: { status: 'completed' },
      conditions: [{ property: 'status', operation: 'equal', value: 'pending' }]
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
      item: { orderId: 'A100', customerId: '12345', totalAmount: 100 }
    }
  },
  {
    validate: {
      table: 'Customers',
      key: { id: '12345' },
      conditions: [{ operation: 'exists', property: 'id' }]
    }
  }
]);
```

### Helper Methods

**createSet** - Normalizes DynamoDB Set creation across v2 and v3:

```ts
await provider.create({
  table: 'Items',
  item: {
    id: '111',
    tags: provider.createSet([1, 2, 10, 40]),
    statuses: provider.createSet(['active', 'pending'])
  }
});
```

**generateTransactionConfigList** - Maps items to transaction configs:

```ts
generateTransactionConfigList<Item>(
  items: Item[],
  generator: (item: Item) => (TransactionConfig | null)[]
): TransactionConfig[]
```

---

If you're not using single-table design, the provider is all you need

## Single table

If you are familiar with single table design, you know there's quite a bit of boiler plate setup to be done. If you are not organized with it, it can quickly become a hassle, compromising your code readability and increasing maintenance time.

To enforce a pattern, you can create a single table instance to configure your table and execute your actions on it. For each table you might have, you can create an instance.

The `SingleTable` instance requires a `DynamoDbProvider` to be created.

#### Parameters

#### `dynamodbProvider`

- **Type**: `IDynamodbProvider`
- **Description**: An instance of `DynamodbProvider`, configured with the appropriate settings and required to interact with DynamoDB.

#### `keySeparator`

- **Type**: `string`
- **Default**: `#`
- **Description**: The logical separator used to join key paths. For example, if the item key is `['USER', id]`, the actual DynamoDB key becomes `USER#id`.

#### `table`

- **Type**: `string`
- **Description**: The name of the DynamoDB table.

#### `partitionKey`

- **Type**: `string`
- **Description**: The partition (hash) key column used in the single table.

#### `rangeKey`

- **Type**: `string`
- **Description**: The range (sort) key column used in the single table.

#### `typeIndex`

- **Type**: `object`
- **Description**: A global index that uniquely identifies each entity in the table. The methods `listType` and `findType` rely on this index to work. Future versions will hide these methods if `typeIndex` is not provided.
  - `partitionKey`: The partition/hash column for this index.
  - `rangeKey`: Defaults to the item's creation timestamp (ISO format `new Date().toISOString()`).
  - `name`: The index name.
  - `rangeKeyGenerator(item, type)`: Generates a range key value for the type index. If you are not actually using the index, you can pass in `() => undefined`, which will not produce the sort property on the item.

**Important**: You do not need to actually have the index on the table to enforce the type prop on your items. Although recommended, as its the easiest to extract the "tables" inside, you can simply define a type property, and it would only produce it. Not having a `type` like property at all inside your single table entities **is extremely not recommended**

#### `expiresAt`

- **Type**: `string`
- **Description**: Specifies the TTL column name if Time to Live (TTL) is configured in the DynamoDB table.

#### `indexes`

- **Type**: `Record<string, { partitionKey: string; rangeKey: string; }>`
- **Description**: Configures additional indexes in the table. Use this to define local or global secondary indexes.
  - `key`: Index name, as its named on dynamodb
  - `partitionKey`: The partition/hash column for the index.
  - `rangeKey`: The range/sort column for the index.

#### `autoRemoveTableProperties`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Automatically removes internal properties from items before they are returned by the methods. Internal properties include partition keys, range keys, TTL attributes, and index keys. This ensures that items have all relevant properties independently, without relying on key extractions. Remember, its the best practice to not rely on these internal properties for your actual data. Even if your PK is `USER#id`, you should have a separate property "id" on the entity.

#### `keepTypeProperty`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Keeps the `typeIndex` partition key from removal during item cleanup. Useful when the entity type is needed to distinguish between different query results or use-cases.

#### `propertyCleanup`

- **Type**: `(item: AnyObject) => AnyObject`
- **Description**: A function that processes and returns the item to be exposed by the methods. Overrides the automatic cleanup behavior set by `autoRemoveTableProperties` and `keepTypeProperty`. Useful for customizing how internal properties are removed from items.

#### `blockInternalPropUpdate`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enables a safety check on every update operation inside your single table to block (with a thrown error) any operation that tries to update an internal property of an item. This includes any key, index key, type key or TTL attribute. Useful to prevent indirect code to mess with the internal configuration of your items. You can set this to `false` and use the `badUpdateValidation` to further customize which property should be blocked

#### `badUpdateValidation`

- **Type**: `(propertiesInUpdate: Set<string>) => boolean | string`
- **Description**: Validates updates by inspecting all properties referenced in an update (in `values`, `remove`, or `atomicOperations`). The default validation ensures that the partition key is not modified, which is a DynamoDB rule. You can use this validation to block internal property updates or throw a custom error message. This has a niche use case and should not see much usage.


### Single Table usage

```ts
import { SingleTable, DynamodbProvider } from 'dynamodb-provider'

const provider = new DynamodbProvider({
  // provider params
});


const table = new SingleTable({
  dynamodbProvider: provider,

  table: 'YOUR_TABLE_NAME',

  partitionKey: 'pk',
  rangeKey: 'sk',

  keySeparator: '#',

  typeIndex: {
    name: 'TypeIndexName',

    partitionKey: '_type',
    rangeKey: '_timestamp',
  },

  expiresAt: 'ttl',

  indexes: {
    SomeIndex: {
      partitionKey: 'gsipk1',
      rangeKey: 'gsisk1',
    }
  }
})
```

### Single Table Methods

With your single table created, you can now use it to execute all the same actions from the provider, but fully aware of the table config.

Available Methods:

- [get](#single-table-get)
- [batchGet](#single-table-batch-get)
- [create](#single-table-create)
- [delete](#single-table-delete)
- [update](#single-table-update)
- [query](#single-table-query)
- [transaction](#single-table-execute-transaction)
- [listType](#single-table-list-type)
- [listAllFromType](#single-table-list-all-from-type)


### single table get

#### Parameters:

- `partitionKey`: The partition key of the item you want to retrieve.
- `rangeKey`: The range key of the item you want to retrieve.
- `consistentRead` (optional): If set to `true`, the operation uses strongly consistent reads; otherwise, it uses eventually consistent reads. Default is `false`.
- `propertiesToRetrieve` (optional): Specifies which properties to retrieve from the item. This is helpful when you only need specific fields instead of the entire item.

#### Valid Keys

```ts
type Key = null | string | Array<string | number | null>;
```

Note: `null` is mainly useful if you want to block an index update to happen due to lack of params. We'll see an example later on.

#### Example

```ts
import { SingleTable } from 'dynamodb-provider'

const table = new SingleTable({
  // ...config
})

const user = await table.get({
  partitionKey: ['USER', id],

  rangeKey: '#DATA',

  consistentRead: true,
})
```

The call above correctly matches your table actual keys under the hood, joins any array key with the configured separator for you.

You can use these methods as they are, create your own entity x repository like extraction methods out of it or use our own entity abstraction to fully utilize the best out of the single table design.


### single table batch get

#### Parameters:

- `keys`: An array of objects, where each object contains:
  - `partitionKey`: The partition key of the item.
  - `rangeKey`: The range key
- `consistentRead` (optional): If set to `true`, the operation uses strongly consistent reads; otherwise, it uses eventually consistent reads. Default is `false`.
- `propertiesToRetrieve` (optional): Specifies which properties to retrieve for each item.
- `throwOnUnprocessed` (optional): By default, this call will try up to 8 times to resolve any `UnprocessedItems` result from the `batchGet` call. If any items are still left unprocessed, the method will return them. If set to `true`, the method will throw an error if there are unprocessed items.

#### Example:

```ts
  const items = await singleTable.batchGet({
    keys: [
      { partitionKey: 'USER#123', rangeKey: 'INFO#456' },
      { partitionKey: 'USER#789', rangeKey: 'INFO#012' },
    ],

    propertiesToRetrieve: ['name', 'email'],

    throwOnUnprocessed: true,
  });
```

### single table create

#### Parameters:

- `item`: The object representing the item you want to create. The object should contain all the fields of the entity.
- `key`: An object containing:
  - `partitionKey`: The partition key for the new item.
  - `rangeKey`: The range key (if applicable) for the new item.
- `indexes` (optional): If applicable, provides the index key information for other indexes the item will be added to.
  Structure: `Record<IndexName, { partitionKey, rangeKey }>`
- `expiresAt` (optional): A UNIX timestamp for setting a TTL on the item. Only acceptable if `expiresAt` is configured on table.
- `type` (optional): Defines the entity type for a single table design setup. Only acceptable if `typeIndex` is configured on table.

#### Example:

```ts
const user = await singleTable.create({
  key: {
    partitionKey: 'USER#123',
    rangeKey: '#DATA',
  },

  item: {
    id: '123',
    name: 'John Doe',
    email: 'john.doe@example.com',
  },

  type: 'USER',

  expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days TTL
});
```

### single table delete

#### Parameters:

- `partitionKey`: The partition key of the item you want to delete.
- `rangeKey`: The range key of your item.
- `conditions` (optional): A set of conditions that must be met before the deletion is executed.

#### Example:

```ts
await singleTable.delete({
  partitionKey: 'USER#123',
  rangeKey: '#DATA',
});
```

### single table update

We'll show just the params that differ from [update](#update)

#### Parameters:

- `partitionKey`: The primary partition key of the item to update.
- `rangeKey`: The range key of the item to update
- `indexes` (optional): Allows updating associated secondary indexes. You can specify which indexes to update by providing partial or full values for the index's partition and/or range keys.
- `expiresAt` (optional): The UNIX timestamp defining when the item should expire (for tables configured with TTL).
- `values` (optional): An object containing key-value pairs representing the properties to update. These values will be merged into the existing item.
- `remove` (optional): An array of properties to be removed from the item.
- `atomicOperations` (optional): A list of operations to perform on numeric or set properties. Supported operations:
  - `sum`: Add a value to an existing numeric property.
  - `subtract`: Subtract a value from an existing numeric property.
  - `add_to_set`: Add values to a set property.
  - `remove_from_set`: Remove values from a set property.
  - `set_if_not_exists`: Set a property value only if it does not already exist.
- `conditions` (optional): A set of conditions that must be satisfied for the update to succeed. The update will be aborted if the conditions are not met.
- `returnUpdatedProperties` (optional): If `true`, the updated properties are returned. This is useful if you're performing atomic operations and want to retrieve the result.

#### Example:

```ts
const result = await singleTable.update({
  partitionKey: ['USER', 'some-id'],

  rangeKey: '#DATA',

  values: {
    email: 'newemail@example.com',
    status: 'active'
  },

  remove: ['someProperty'],

  atomicOperations: [{ operation: 'sum', prop: 'loginCount', value: 1 }],

  expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Expires in 30 days

  indexes: {
    SomeIndex: { partitionKey: 'NEW_PARTITION' },
  },

  conditions: [{ key: 'status', value: 'pending', operation: 'equal' }],

  returnUpdatedProperties: true,
});
```

### single table query

Most of the params are the same from the [query](#query) method from provider

#### Different Parameters:

- `partition`: Simply the Key, as we know the column name
- `range`: Here you can build your key condition exactly as before, but also wi

#### Example:

Retrieving the last 10 user logs:

```ts
const results = await singleTable.query({
  partition: ['USER', 'your-id'],

  range: {
    value: 'LOG#',
    operation: 'begins_with',
  },

  retrieveOrder: 'DESC',

  limit: 10,
});
```

### single table execute transaction

Works the logic same as [transaction](#execute-transaction) from the provider, the params for the create/update/delete methods can be used here to build the transaction, as well as using `validate` calls to ensure the rules of your action are being respected

#### Parameters reminder:

- `configs`: An array of transaction configurations. Each transaction can be one of the following:
  - `update`: An update operation (see the `update` method for more details).
  - `create`: A create operation (see the `create` method for more details).
  - `erase`: A delete operation (see the `delete` method for more details).
  - `validate`: A condition check (ensures certain conditions are met before applying other operations).

### single table list all from type

**Important**: This method only works if you have a proper defined `typeIndex` that matches an existing index on the table.

This method retrieves all items of a specified type from the table. It is a wrapper around the query function that simplifies the retrieval of all items associated with a particular type.

#### Parameters:

- `type`: string - The entity type to retrieve from the table, based on the typeIndex partition key.

#### Example Usage:

```ts
const items = await table.listAllFromType('USER');
```

### single table list type

**Important**: This method only works if you have a proper defined `typeIndex` that matches an existing index on the table.

This method performs a paginated query to retrieve items of a specific type, supporting range key filtering, pagination, and other query parameters.

#### Parameters:
- params: ListItemTypeParams - An object with the following properties:
  - `type`: string - The entity type to retrieve from the table, based on the typeIndex partition key.
  - `range`?: BasicRangeConfig | BetweenRangeConfig - Optional range key filter. This can either be a single comparison operation (e.g., greater than) or a between operation.
  - `limit`?: number - Limits the number of items returned in a single call.
  - `paginationToken`?: string - Token to continue retrieving paginated results.
  - `retrieveOrder`?: 'ASC' | 'DESC' - The order in which items should be retrieved, either ascending (ASC) or descending (DESC).
  - `fullRetrieval`?: boolean - If set to true, retrieves all items until no more pagination tokens are returned.
  - `filters`?: FilterConfig - Additional filters to apply on the query.

#### Returns:

An object containing:

- `items`: Entity[] - The list of items retrieved.
- `paginationToken`?: string - If applicable, a token for retrieving the next set of paginated results.

#### Example Usage:

```ts
const result = await table.listType({
  type: 'USER',

  range: {
    operation: 'begins_with',
    value: 'john',
  },

  limit: 10,
});
```

Because type match is such a common use case, we also provide 2 helper methods for handling item lists:

```ts
interface TypeHelperMethods {
  findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined

  filterTableItens<Entity>(items: AnyObject[], type: string): Entity[]
}
```

## Single Table Schema

Now that every direct single table method is covered, it time to talk about the last part of the library: `schema` abilities.

With your single table instance, you can define partitions, entities and even collections to be easily acted upon. Lets explore this with the most basic type of DB piece you may need: `entity`

### Single Table Schema: Entity

Entities are the representation of a data type inside your table. There can be made a parallel between an SQL table and a single table entity

#### Creating entity syntax

```ts
type tUser = {
  id: string;
  name: string;
  createdAr: string;
  // ... more props
}

const User = table.schema.createEntity<User>().as({
  // create entity params
})
```

We have a double invocation here to properly forward the entities type in conjunction with the params inferred from the creation. This is done as you'll see the entity type is solely reliant on TS' types as of now, there's not in code schema definition atm.

Lets explore the params allowed:

#### Create entity params

- `getPartitionKey`: A partition resolver for your entity
- `getRangeKey`: A range resolver for your entity

Both key resolvers have the same key getter structure as before, but **restricted** to the actual entity properties:

```ts
type EntityKeyResolvers<Entity> = {
  getPartitionKey: (params: EntityParamsOnly<Entity>) => KeyValue;

  getRangeKey: (params: EntityParamsOnly<Entity>) => KeyValue;
};
```

This means you can't pass in a getter that uses params not found in its type:

```ts
type tUser = {
  id: string;
  name: string;
  createdAr: string;
  // ... more props
}

const BadUser = table.schema.createEntity<User>().as({
  // create entity params
  getPartitionKey: ({userId}: {userId: string}) => ['USER', userId] // TYPE ERROR!
})

const User = table.schema.createEntity<User>().as({
  // create entity params
  getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id] // ok!
})
```

As a reminder, the allowed values:

```ts
type KeyValue = null | string | Array<string | number | null>;
```

Just remember `null` is useful if you want to indicate that you generated a bad key that shouldn't be updated. That means its relevant on index key getters, but no actual partition/range context

##### Dotted property references

Most of the time, your partition/range keys will be simple combination of constants and property values. Because of how the getter requirement is constructed, a lot of times you are writing a lot of the same boiler plate code:

```ts
type Event = {
  id: string;
  timestamp: string;
  type: string;
  userId: string;
  // ...more props
}

export const eEvent = schema.createEntity<Event>().as({
  type: 'USER_EVENT',

  getPartitionKey: () => 'USER_EVENT',

  // destructure + pick (or inline type def) + array
  getRangeKey: ({ id }: Pick<Event, 'id'>) => [id],

  indexes: {
    byUser: {
      // destructure + pick (or inline type def) + array
      getPartitionKey: ({ userId }: Pick<Event, 'userId'>) => ['SOME_ENTITY_KEY', userId],

     // destructure + pick (or inline type def) + array
      getRangeKey: ({ timestamp }: Pick<Event, 'timestamp'>) => ['SOME_ENTITY_KEY', timestamp],

      index: 'IndexOne',
    },
  },

  autoGen: {
    onCreate: {
      id: 'KSUID',
      timestamp: 'timestamp',
    },
  },
});
```

This is mostly fine, as its clear and demonstrates the relation clearly. But it does get repetitive. We provide a way to reference this logic with a dot notation:

```ts
type Event = {
  id: string;
  timestamp: string;
  type: string;
  userId: string;
  // ...more props
}

export const eEvent = schema.createEntity<Event>().as({
  type: 'USER_EVENT',

  getPartitionKey: ['USER_EVENT'],

  getRangeKey: ['.id']

  indexes: {
    byUser: {
      getPartitionKey:  ['SOME_ENTITY_KEY', '.userId'],

      getRangeKey:  ['SOME_ENTITY_KEY', '.timestamp'],

      index: 'IndexOne',
    },
  },

  autoGen: {
    onCreate: {
      id: 'KSUID',
      timestamp: 'timestamp',
    },
  },
});
```

**IMPORTANT!** This brings some opinions on how it works. It provides QOL on most entity creations, but be aware of:

- You have IDE assistance to auto complete any `.[prop]` you may way to reference, **but EVERY string is accepted**. Meaning typos can lead to bad key resolvers.
- Every entry will have the initial `.` automatically removed `[.CONSTANT, .prop]` becomes `[CONSTANT, ${prop}]`
- The `getPartitionKey` and `getRangeKey` generated will look and inject every `.prop` from the params received into the key generation, so typos can lead to `undefined` getting into the key and ultimately invalidating it.

If you need complex login on your key generation, you need to pass in as a function. We do not pretend to extend this functionality to handle dynamic references. Thats the clear cut use case of a function.

- `type` (string): An **unique** describer of an entity inside your single table. Think of it as the "table name". If you try to create 2 entities with the same type, an error is thrown.

- `autoGen` (object, optional): Defined properties that should be auto generated `onCreation` or `onUpdate`:
  ```ts
  type AutoGenFieldConfig<Entity> = {
    [Key in keyof Entity]?: AutoGenOption;
  };

  export type AutoGenParams<Entity> = {
    onCreate?: AutoGenFieldConfig<Entity>;

    onUpdate?: AutoGenFieldConfig<Entity>;
  };
  ```

  `AutoGenOption` are as follows:

  * `UUID`: generates a `v4` uuid
  * `KSUID`: generates a *K-Sortable Globally Unique IDs (KSUID)*
  * `count`: automatically assigns `0`
  * `timestamp`: generates the current timestamp with `new Date().toISOString()`
  * `() => any`: Pass in a function if you need a custom auto-generation strategy


- `rangeQueries` (object, optional): Configure possible queries to be easily referenced when using the entity. Here you can easily define query configuration to be used to retrieve the entity

  Pass in an object in which:
  * Key: query name
  * Value: query config, which operation will be performed, and value getter

  ```ts
  type tLogs = {
    type: string;
    timestamp: string;
    // ...props
  }

  const Logs = table.schema.createEntity<tLogs>().as({
    type: 'APP_LOGS',

    getPartitionKey: () => ['APP_LOG'],

    getRangeKey: ({ timestamp }: Pick<tLogs, 'timestamp'>) => timestamp,

    rangeQueries: {
      dateSlice: {
        operation: 'between',
        getValues: ({ start, end }: { start: string, end: string }) => ({
          start,
          end,
        })
      }
    }
  })
  ```

  When the time comes to use the entity, this will produce a `dateSlice` method, which will require `start` and `end` params to work (as our partition key does not require any addition params), properly typed. the method will build the underlying dynamodb query need to perform the retrieval. You can further configure the `dateSlice` methods with the `query` params we have.


- `index` (object, optional): Only available if table configured with indexes. A record mapping of your entity indexes definition:

  Format: `Record<string, IndexConfig>`
  * key: a custom index name to describe it
  * value: `IndexConfig`
    - `getPartitionKey` - same logic as the root entity getPartitionKey
    - `getRangeKey` - same logic as the root entity getRangeKey
    - `index` - the actual table index name related, as is on the dynamodb table
    - `rangeQueries?` - same logic as the root entity rangeQueries

  Example:

  ```ts
  type tLogs = {
    type: string;
    timestamp: string;
    // ...props
  }

  const table = new SingleTable({
    // ... other params

    indexes: {
      DynamoIndex1: {
        partitionKey: 'gsipk1',
        rangeKey: 'gsipsk1',
      },

      OtherTableIndex: {
        partitionKey: 'gsipk2',
        rangeKey: 'gsipsk2',
      },
    }
  })

  const Logs = table.schema.createEntity<tLogs>().as({
    type: 'APP_LOGS',

    getPartitionKey: () => ['APP_LOG'],

    getRangeKey: ({ timestamp }: Pick<tLogs, 'timestamp'>) => timestamp,

    indexes: {
      MY_CUSTOM_INDEX_NAME: {
        getPartitionKey: ({ type }: Pick<tLogs, 'type'>) => ['APP_LOG_BY_TYPE', type],

        getRangeKey: ({ timestamp }: Pick<tLogs, 'timestamp'>) => timestamp,

        index: 'DynamoIndex1' // could be DynamoIndex1 or OtherTableIndex as per config
      }
    }
  })
  ```

- `extend`: A function you can use to add/modify properties from the entity automatically upon retrieval on `from(xxx)` calls

  ```ts
    type tUser = {
      id: string;
      name: string;
      dob: string;
      // ... more props
    }

    const User = table.schema.createEntity<User>().as({
      // ...other props

      extend: ({ dob }) => ({
        age: calculateAge(dob)
      })
    })
  ```

  The example above represent a property addition, the user calculate `age`. It will be present automatically after every retrieval call from `from(xxx)`. Be it for entities or collections

### Single table entity usage

The generated entity has properties that you can leverage to interact with the single table methods, such as:

#### Relevant entity properties

- `getKey` - A complete key getter that accepts the exact params required in `getPartitionKey` and `getRangeKey` to generate the entity key reference `{ partitionKey: KevValue, rangeKey: KeyValue }`

- `getCreationParams(item: Entity, { expiresAt?: number }?)` - as the name implies, generates the [single table create](#single-table-create) params. If `expiresAt` is defined in your table, a second optional param with allowed if that configuration

- `getUpdateParams(params: UpdateParams)` - same logic as the getCreationParams, but produces the params for [single table update](#single-table-update) instead. Here all the key params are required, plus the updates such as `values`, `atomicOperations` and etc

- `transact param builders` - You can easily generate any of the `create`, `update`, `erase` and/or `validate` transact params with:
  * **transactCreateParams** - results in `{ create: {...} }`
  * **transactUpdateParams** - results in `{ update: {...} }`
  * **transactDeleteParams** - results in `{ erase: {...} }`
  * **transactValidateParams** - results in `{ validate: {...} }`

#### Using entity directly on schema

You can also leverage the `schema.from` method to create a "repository-like" instance to perform actions on your entity:

```ts
type tUser = {
  id: string;
  name: string;
  createdAr: string;
  // ... more props
}

const User = table.schema.createEntity<User>().as({
  type: 'USER',

  getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],

  getRangeKey: () => ['#DATA'],
})

const userActions = table.schema.from(User)
```

This will expose all the methods we are used to, but fully specified to meet the user needs/type. For example:

```ts
const userActions = table.schema.from(User)

await userActions.create({
  // all user props that are required on the User type
})

await userActions.update({
  id: 'user-id', // because its a key param

  values: {
    status: 'new-status'
  }

  // other update specific params
})
```

Here's a list of all available methods:

- get
- batchGet
- create
- update
- delete
- listAll - *only if typeIndex is present*
- list - *only if typeIndex is present*
- query
- queryIndex - *only if entity has index defined*

Out of these methods, `query` and `queryIndex` are in a different format. As you can execute custom queries and/or have pre-defined queries on `rangeQueries`:

- `query` exposes a `custom` method to execute any query on the entity partition plus each range query defined
- `queryIndex` while `queryIndex` exposes a similar structure as `query`, but for each individual index defined

Example:

```ts
type tLogs = {
  type: string;
  timestamp: string;
  // ...props
}

const Logs = table.schema.createEntity<tLogs>().as({
  type: 'APP_LOGS',

  getPartitionKey: () => ['APP_LOG'],

  getRangeKey: ({ timestamp }: Pick<tLogs, 'timestamp'>) => timestamp,

  indexes: {
    logsByType: {
      getPartitionKey: ({ type }: Pick<tLogs, 'type'>) => ['APP_LOG_BY_TYPE', type],

      getRangeKey: ({ timestamp }: Pick<tLogs, 'timestamp'>) => timestamp,

      index: 'DynamoIndex1',

      dateSlice: {
        operation: 'between',
        getValues: ({ start, end }: { start: string, end: string }) => ({
          start,
          end,
        })
      }
    }
  }
})

// all valid queries:

await table.from(Logs).query.custom() // valid call, as getPartitionKey does not have params, it will simply execute a query against its partition

await table.from(Logs).query.custom({
  limit: 10,
  retrieveOrder: 'DESC'
})

await table.from(Logs).queryIndex.logsByType.custom({
  type: 'LOG-TYPE-1', // required as logsByType getPartitionKey expects it
})

await table.from(Logs).queryIndex.logsByType.dateSlice({
  type: 'LOG-TYPE-2',
  start: 'some-ts',
  end: 'some-ts',
  limit: 20,
})
```

> Note: Any retrieval method will apply the `extend` action if available

With the `from` you can strongly enforce the data access patterns you have within you table, simplifying the process of handling the underlying table properties that should be excluded from app logic.

### Single Table Schema: Partition

As you might be familiar while using the single table design, it's all about **partitions**. If you are new to it, partitions are all the data under a certain partitionKey logic. It could have one type of entity or many.

Lets use the user example, in which the partitionKey is in the `USER#userId` format. Under it, we have entities for the main user data, permissions, login logs and purchase history. To closely keep that information together with the partition/range key, it is recommended to create a partition before its relative entities.

```ts
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',

  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

  entries: {
    mainData: () => ['#DATA'],

    permissions: ({ permissionId }: { permissionId: string }) => ['PERMISSION', permissionId],

    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],

    orders: ({ orderId }: { { orderId: string } }) => ['ORDER', orderId],
  },
})
```

Its recommended to give the partition params the most descriptive names possible, why we chose `userId` and not `id`

With your created partition, you can now use it to create its relative entities. **If you need to adjust the key getter params, you can do it here too:**

```ts
type tUser = {
  id: string;
  name: string;
  createdAt: string;
  email: string;
  updatedAt?: string;
}

type tUserLoginAttempt = {
  userId: string;
  timestamp: string;
  success: boolean;
  ip: string;
}

const User = userPartition.use('mainData').create<tUser>().entity({
  type: 'USER',

  // You **must** match any partition param that is not
  // found inside the entity (tUser) you are creating
  // Optionally, you can match same name params if they mean different things
  // If all params are found inside the entity, it will be an optional param
  paramMatch: {
    userId: 'id'
  },

  // every other create entity param...
})

const UserLoginAttempt = userPartition.use('loginAttempt').create<tUserLoginAttempt>().entity({
  type: 'USER_LOGIN_ATTEMPT',

  // since all key params from partition+loginAttempt are already present on tUserLoginAttempt,
  // we do not need to match params
})
```

**Important** You can only *use* each entry once.

#### Index Partition

Its also common to have partitions localized to certain table's index instead of the main pk+sk combo. You can create an `index partition` easily as well. So let's repeat the above example with an Index based logic:

```ts
type tUser = {
  id: string;
  name: string;
  createdAt: string;
  email: string;
  updatedAt?: string;
}

type tUserLoginAttempt = {
  userId: string;
  timestamp: string;
  success: boolean;
  ip: string;
}

const userIndexPartition = table.schema.createPartition({
  name: 'USER_PARTITION',

  index: 'YourIndexNameFromConfig',

  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

  entries: {
    mainData: () => ['#DATA'],

    permissions: ({ permissionId }: { permissionId: string }) => ['PERMISSION', permissionId],

    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],

    // other entries...
  },
})

const User = table.schema.createEntity<tUser>().as({
  type: 'USER',

  getPartitionKey: () => ['APP_USERS'],

  getRangeKey: ({ id }: Pick<tUser, 'id'>) => ['USER', id],

  indexes: {
    userData: userIndexPartition.use('mainData').create<tUser>().index({
      paramMatch: {
        userId: 'id'
      },

      // rangeQueries? ... other index params
    }),
  }
})

const UserLoginAttempt = table.schema.createEntity<tUserLoginAttempt>().as({
  type: 'USER_LOGIN_ATTEMPT',

  getPartitionKey: () => ['APP_LOGINS'],

  getRangeKey: ({ id, timestamp }: Pick<tUserLoginAttempt, 'id' | 'timestamp'>) => ['USER_LOGIN', timestamp, id],

    indexes: {
      // no param to match or other index params? no need to provide params
      userData: userIndexPartition.use('loginAttempt').create<tUser>().index(),
    }
})
```

As you have noticed, the `use('entry').create<EntryType>()` call can either provide you with an `entity` OR an `index`, based on if your partition is default or index based.

#### Partition Creation Params

All params have been covered on the example above, but here's them aggregated:

- **name**: An **UNIQUE** name to your partition
- **getPartitionKey**: The partition getter (only as fn form!)
- **index?**: The table index this partition might be from
- **entries**: An object mapping a partition entity to its `getRangeKey` resolver

## Single Table Schema: Collection

Now that we know how to create and use entities, be it solo or partition types, we need a way to define precisely which complex structures we can retrieve. In the user example above, we could want to retrieve the entire `User` type, including permissions, login attempts, etc. This is a common pattern on single table design, as ofter our data is spread across multiple entries on the table.

To help you define these complex structures that live inside your table, you can create a `Collection`.

### Collection Parameters

- `ref`: The root entity of the collection. It can be `null` if the base entry will be an empty object with the `join` keys.

- `type`: Specifies the join type, either `'SINGLE'` or `'MULTIPLE'`.

- `getPartitionKey`: Function or reference for retrieving the partition key for the collection.
  If this is provided, `partition` is not accepted

- `index?`: Which table index this collection is relevant. Only acceptable if you provide `getPartitionKey` instead of a partition.

- `partition`: An existing partition for your collection. **It can be either entity or index partition**. The collection will properly infer the index/non-index state to perform the query
  If this is provided, `getPartitionKey` and `index` are not accepted

- `narrowBy`: Optional filter to narrow down the range key search for the collection, either by a range key prefix or a custom function.
  Accepted values:
  * `RANGE_KEY`: will narrow the query starting with the `getRangeKey` of the ref entity. Only works if `ref` is an entity
  * `(params?: AnyObject) => RangeQueryConfig`: A custom handler that returns the range query to be passed down to the collection query


- `join`: Configuration for how entities should be joined together. Each key will represent an entity relationship in the collection.
  Structure: `Record<string, JoinConfig>`. Each key referenced here will be the resulting key on the extracted result

  Each entry in the `join` object should follow the structure:

  ```ts
  type JoinConfig = {
    entity: RefEntity;

    type: 'SINGLE' | 'MULTIPLE';

    extractor?: (item: AnyObject) => any;

    sorter?: Sorter;

    joinBy?: 'POSITION' | 'TYPE' | JoinResolver;

    join?: Record<string, JoinConfig>;
  }
  ```

  Lets explore each param:

  * **`entity`** (Required):
    The reference to the entity you want to join with.

  * **`type`** (Required):
    Specifies whether the join will result in a single reference (`'SINGLE'`) or multiple references (`'MULTIPLE'`).

  * **`extractor`** (Optional):
    A function to extract and return specific data from the joined entity before adding it to the parent entity.
    **Example**: Extracting only a subset of the fields like `permission` from the `UserPermission` entity.

  * **`sorter`** (Optional):
    A function to custom sort the list of entities when `type` is `'MULTIPLE'`. This is ignored for `'SINGLE'` joins.
    **Example**: Sorting the user login attempts by a timestamp or a custom logic

  * **`joinBy`** (Optional):
    Defines how the join is performed. It defaults to `'POSITION'` but supports the following options:
    - **`POSITION`**: Joins entities based on their sequential extraction from the query. **Requires a `typeIndex` to exist in the table.**
    - **`TYPE`**: Joins entities by their type. Required **at least** your entities to have the `typeIndex.partitionKey` defined. The index does not need to actually exist in the table
    - **Custom Resolver**: A function to define custom join logic, with the signature `(parent, child) => boolean`. It returns `true` if the entities should be joined.

  * **`join`** (Optional):
    A nested configuration for joining other entities that are related to the current entity. You can create complex join chains by adding more entities within this property. The structure of each nested join follows the same format as the root-level `join`.


### Returns

A `Collection` to be used both for **type definition** and table extraction.

### Extracting Collection Type

A `GetCollectionType` is exposed for you to infer correctly its type using `type YourType = GetCollectionType<typeof yourCollection>`

### Example Usage

```ts
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',

  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],

  entries: {
    mainData: () => ['#DATA'],

    permissions: ({ permissionId }: { permissionId: string }) => ['PERMISSION', permissionId],

    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],

    orders: ({ orderId }: { { orderId: string } }) => ['ORDER', orderId],
  },
})

type tUser = {
  id: string;
  name: string;
  createdAt: string;
  email: string;
  updatedAt?: string;
}

type tUserLoginAttempt = {
  userId: string;
  timestamp: string;
  success: boolean;
  ip: string;
}

const User = userPartition.use('mainData').create<tUser>().entity({
  type: 'USER',

  paramMatch: {
    userId: 'id'
  },
})

const UserLoginAttempt = userPartition.use('loginAttempt').create<tUserLoginAttempt>().entity({
  type: 'USER_LOGIN_ATTEMPT',
})

const userWithLoginAttemptsCollection = createCollection({
  ref: User,

  join: {
    logins: {
      entity: UserLoginAttempt,

      type: 'MULTIPLE',

      joinBy: 'TYPE',
    },
  },

  type: 'SINGLE',

  partition: userPartition,
});

/*
  UserWithLoginAttempts = tUser & { logins: tUserLoginAttempt[] }
*/
type UserWithLoginAttempts = GetCollectionType<typeof userWithLoginAttemptsCollection>
```

Or, creating simply the user's attempts and permissions:

```ts
type tUserPermission = {
  permissionId: string;
  timestamp: string;
  addedBy: string;
}

const UserPermission = userPartition.use('permissions').create<tUserPermission>().entity({
  type: 'USER_PERMISSION',
})

const someCollection = createCollection({
  ref: null, // this!

  join: {
    logins: {
      entity: UserLoginAttempt,

      type: 'MULTIPLE',

      joinBy: 'TYPE',
    },

    permissions: {
      entity: UserPermission,

      type: 'MULTIPLE',

      joinBy: 'TYPE',

      extractor: ({ permissionId }: tUserPermission) => permissionId,
    }
  },

  type: 'SINGLE',

  partition: userPartition,
});

/*
  YourCollection = { logins: tUserLoginAttempt[], permissions: string[] }
*/
type YourCollection = GetCollectionType<typeof someCollection>
```

### Using your collection

Same as with the entity, you can now leverage the schema to execute actions on your collection.

For now, only the `get` method is exposed:

```ts
const userWithAttempts = await table.schema.from(userWithLoginAttemptsCollection).get({
  // its the partition param passed to the collection!
  userId: 'user-id-12',
})
```

And thats it! The result will be of the expected type (or undefined if not found, since its a `SINGLE` collection)




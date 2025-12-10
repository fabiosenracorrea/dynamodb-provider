# Dynamo DB Provider

[![npm version](https://img.shields.io/npm/v/dynamodb-provider.svg)](https://www.npmjs.com/package/dynamodb-provider)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/dynamodb-provider)](https://bundlephobia.com/result?p=dynamodb-provider)
[![License](https://img.shields.io/npm/l/dynamodb-provider)](./LICENSE)

Fast Develop for DynamoDB with this type-safe & single-table awareness library!

> Min Node version: 16

## Introduction

The DynamoDB SDK (both v2 and v3) lacks type safety and requires significant boilerplate. Building expressions, avoiding attribute name collisions, and managing code repetition typically results in verbose, hard-to-maintain abstractions.

This library wraps DynamoDB operations with type-safe methods that work for both table-per-entity and single-table designs. Apart from the `ksuid` for ID generation, it has zero dependencies.

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
- `propertiesToRetrieve` - Attributes to return
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
  propertiesToRetrieve: ['productId', 'name', 'price']
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
- `propertiesToRetrieve` - Specific attributes to return (root-level only)

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
  filters: { status: 'shipped' },
  propertiesToRetrieve: ['orderId', 'totalAmount', 'createdAt']
});
```

### transaction

Executes multiple operations atomically. All operations succeed or all fail. Wraps TransactWrite (max 100 items or 4MB).

```ts
transaction(configs: (TransactionParams | null)[]): Promise<void>
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

**toTransactionParams** - Maps items to transaction configs:

```ts
toTransactionParams<Item>(
  items: Item[],
  generator: (item: Item) => (TransactionParams | null)[]
): TransactionParams[]
```

---

If you're not using single-table design, the provider is all you need

## Single table

SingleTable provides table configuration and reduces boilerplate for single-table designs. Create one instance per table.

Requires a `DynamoDbProvider` instance.

### Configuration Parameters

#### `dynamodbProvider`

- **Type**: `IDynamodbProvider`
- **Required**: Yes
- An instance of `DynamodbProvider`.

#### `table`

- **Type**: `string`
- **Required**: Yes
- The DynamoDB table name.

#### `partitionKey`

- **Type**: `string`
- **Required**: Yes
- The partition key column name.

#### `rangeKey`

- **Type**: `string`
- **Required**: Yes
- The range key column name.

#### `keySeparator`

- **Type**: `string`
- **Default**: `#`
- Separator used to join key paths. If item key is `['USER', id]`, the DynamoDB key becomes `USER#id`.

#### `typeIndex`

- **Type**: `object`
- **Optional**
- Index configuration for entity type identification. Required for `listType`, `listAllFromType`, `findTableItem`, and `filterTableItens` methods.
  - `partitionKey` (string): Column name for the type identifier. Its value is the entity `type`.
  - `rangeKey` (string): Column name for the sort key.
  - `name` (string): Index name in DynamoDB.
  - `rangeKeyGenerator` (function, optional): `(item, type) => string | undefined` - Generates range key value. Defaults to `new Date().toISOString()`. Return `undefined` to skip range key creation.

The index does not need to exist in DynamoDB if only using the type property for filtering. The index must exist for query-based methods like `listType` and `listAllFromType`.

#### `expiresAt`

- **Type**: `string`
- **Optional**
- TTL column name if configured in DynamoDB.

#### `indexes`

- **Type**: `Record<string, { partitionKey: string; rangeKey: string; }>`
- **Optional**
- Secondary index configuration.
  - Key: Index name as defined in DynamoDB.
  - Value: Object with `partitionKey` and `rangeKey` column names.

#### `autoRemoveTableProperties`

- **Type**: `boolean`
- **Default**: `true`
- Removes internal properties from returned items:
  - Main table partition and range keys
  - Type index partition and range keys
  - All secondary index partition and range keys
  - TTL attribute

Items should contain all relevant properties independently without relying on key extraction. For example, if PK is `USER#id`, include an `id` property in the item.

#### `keepTypeProperty`

- **Type**: `boolean`
- **Default**: `false`
- Retains the `typeIndex` partition key column in returned items. Applies only when `autoRemoveTableProperties` is true.

#### `propertyCleanup`

- **Type**: `(item: AnyObject) => AnyObject`
- **Optional**
- Custom cleanup function for returned items. Overrides `autoRemoveTableProperties` and `keepTypeProperty` when provided.

#### `blockInternalPropUpdate`

- **Type**: `boolean`
- **Default**: `true`
- Blocks updates to internal properties (keys, index keys, type key, TTL). Default behavior throws error if attempted. Set to `false` to disable or use `badUpdateValidation` for custom validation.

#### `badUpdateValidation`

- **Type**: `(propertiesInUpdate: Set<string>) => boolean | string`
- **Optional**
- Custom validation for update operations. Receives all properties referenced in `values`, `remove`, or `atomicOperations`.
- Return values:
  - `true`: Update is invalid (throws error).
  - `false`: Update is valid.
  - `string`: Custom error message to throw.

The partition key check always runs as it violates DynamoDB rules.


### Usage

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

Available methods:

- [get](#single-table-get)
- [batchGet](#single-table-batch-get)
- [create](#single-table-create)
- [delete](#single-table-delete)
- [update](#single-table-update)
- [query](#single-table-query)
- [transaction](#single-table-transaction)
- [ejectTransactParams](#single-table-eject-transact-params)
- [toTransactionParams](#single-table-generate-transaction-config-list)
- [createSet](#single-table-create-set)
- [listType](#single-table-list-type)
- [listAllFromType](#single-table-list-all-from-type)
- [findTableItem](#single-table-find-table-item)
- [filterTableItens](#single-table-filter-table-itens)


### single table get

Retrieves a single item by partition and range keys.

```ts
get<Entity>(params: SingleTableGetParams<Entity>): Promise<Entity | undefined>
```

**Parameters:**

- `partitionKey` - Partition key value. Type: `null | string | Array<string | number | null>`
- `rangeKey` - Range key value. Type: `null | string | Array<string | number | null>`
- `consistentRead` (optional) - Use strongly consistent reads. Default: `false`
- `propertiesToRetrieve` (optional) - Root-level attributes to return

Returns the item or `undefined` if not found.

**Key Types:**

```ts
type KeyValue = null | string | Array<string | number | null>;
```

Array keys are joined with the configured `keySeparator`. `null` values are primarily for index updates where parameters may be incomplete.

**Example:**

```ts
const user = await table.get({
  partitionKey: ['USER', id],
  rangeKey: '#DATA',
  consistentRead: true,
})
```


### single table batch get

Retrieves multiple items by keys. Handles batches >100 items and retries unprocessed items automatically.

```ts
batchGet<Entity>(params: SingleTableBatchGetParams<Entity>): Promise<Entity[]>
```

**Parameters:**

- `keys` - Array of key objects, each containing:
  - `partitionKey` - Partition key value
  - `rangeKey` - Range key value
- `consistentRead` (optional) - Use strongly consistent reads. Default: `false`
- `propertiesToRetrieve` (optional) - Root-level attributes to return
- `throwOnUnprocessed` (optional) - Throw error if items remain unprocessed after retries. Default: `false`
- `maxRetries` (optional) - Maximum retry attempts for unprocessed items. Default: `8`

**Example:**

```ts
const items = await table.batchGet({
  keys: [
    { partitionKey: 'USER#123', rangeKey: 'INFO#456' },
    { partitionKey: 'USER#789', rangeKey: 'INFO#012' },
  ],
  propertiesToRetrieve: ['name', 'email'],
  throwOnUnprocessed: true,
});
```

### single table create

Creates an item in the table.

```ts
create<Entity>(params: SingleTableCreateItemParams<Entity>): Promise<Entity>
```

**Parameters:**

- `item` - The item to create
- `key` - Object containing:
  - `partitionKey` - Partition key value
  - `rangeKey` - Range key value
- `indexes` (optional) - Index key values. Structure: `Record<IndexName, { partitionKey, rangeKey }>`. Only available if table has `indexes` configured.
- `expiresAt` (optional) - UNIX timestamp for TTL. Only available if table has `expiresAt` configured.
- `type` (optional) - Entity type identifier. Only available if table has `typeIndex` configured.

**Example:**

```ts
const user = await table.create({
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
  expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
});
```

### single table delete

Deletes an item by partition and range keys.

```ts
delete<Entity>(params: SingleTableDeleteParams<Entity>): Promise<void>
```

**Parameters:**

- `partitionKey` - Partition key value
- `rangeKey` - Range key value
- `conditions` (optional) - Conditions that must be met before deletion

**Example:**

```ts
await table.delete({
  partitionKey: 'USER#123',
  rangeKey: '#DATA',
});
```

### single table update

Updates an item with support for value updates, property removal, and atomic operations.

```ts
update<Entity>(params: SingleTableUpdateParams<Entity>): Promise<Partial<Entity> | undefined>
```

**Parameters:**

- `partitionKey` - Partition key value
- `rangeKey` - Range key value
- `values` (optional) - Properties to update
- `remove` (optional) - Root-level properties to remove
- `atomicOperations` (optional) - Atomic operations (see [update](#update) for operations)
- `conditions` (optional) - Conditions that must be met
- `returnUpdatedProperties` (optional) - Return updated values
- `indexes` (optional) - Update index keys. Structure: `Record<IndexName, Partial<{ partitionKey, rangeKey }>>`. Only available if table has `indexes` configured.
- `expiresAt` (optional) - UNIX timestamp for TTL. Only available if table has `expiresAt` configured.

**Example:**

```ts
const result = await table.update({
  partitionKey: ['USER', 'some-id'],
  rangeKey: '#DATA',
  values: {
    email: 'newemail@example.com',
    status: 'active'
  },
  remove: ['someProperty'],
  atomicOperations: [{ operation: 'sum', property: 'loginCount', value: 1 }],
  expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  indexes: {
    SomeIndex: { partitionKey: 'NEW_PARTITION' },
  },
  conditions: [{ property: 'status', operation: 'equal', value: 'pending' }],
  returnUpdatedProperties: true,
});
```

### single table query

Queries items by partition key with optional range key conditions.

```ts
query<Entity>(params: SingleTableQueryParams<Entity>): Promise<QueryResult<Entity>>
```

**Parameters:**

- `partition` - Partition key value. Type: `KeyValue`
- `range` (optional) - Range key condition with operations: `equal`, `lower_than`, `lower_or_equal_than`, `bigger_than`, `bigger_or_equal_than`, `begins_with`, `between`
- `index` (optional) - Index name to query. Only available if table has `indexes` configured.
- `retrieveOrder` (optional) - `ASC` or `DESC`. Default: `ASC`
- `limit` (optional) - Maximum items to return
- `fullRetrieval` (optional) - Auto-paginate until all items retrieved. Default: `true`
- `paginationToken` (optional) - Continue from previous query
- `filters` (optional) - Filter expressions
- `propertiesToRetrieve` (optional) - Specific attributes to return (root-level only)

Returns `{ items, paginationToken? }`

**Example:**

```ts
const { items, paginationToken } = await table.query({
  partition: ['USER', 'your-id'],
  range: {
    value: 'LOG#',
    operation: 'begins_with',
  },
  retrieveOrder: 'DESC',
  limit: 10,
  propertiesToRetrieve: ['id', 'timestamp', 'message']
});
```

### single table transaction

Executes multiple operations atomically. All operations succeed or all fail.

```ts
transaction(configs: (SingleTableTransactionParams | null)[]): Promise<void>
```

**Note:** `executeTransaction` is deprecated. Use `transaction` instead.

**Parameters:**

- `configs` - Array of transaction configurations (max 100 items or 4MB total):
  - `{ create: SingleTableCreateItemParams }` - Put item
  - `{ update: SingleTableUpdateParams }` - Update item
  - `{ erase: SingleTableDeleteParams }` - Delete item
  - `{ validate: SingleTableValidateTransactParams }` - Condition check

Transaction parameters match the corresponding single table method parameters. `null` values in the array are filtered out.

**Example:**

```ts
await table.transaction([
  {
    update: {
      partitionKey: 'ORDER#A100',
      rangeKey: '#DATA',
      values: { status: 'completed' },
      conditions: [{ property: 'status', operation: 'equal', value: 'pending' }]
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
      key: { partitionKey: 'COMPLETED#A100', rangeKey: '#DATA' },
      item: { orderId: 'A100', customerId: '12345', totalAmount: 100 }
    }
  },
  {
    validate: {
      partitionKey: 'CUSTOMER#12345',
      rangeKey: '#DATA',
      conditions: [{ operation: 'exists', property: 'id' }]
    }
  }
]);
```

### single table eject transact params

Converts single table transaction configs to provider transaction configs for merging with transactions from other tables.

```ts
ejectTransactParams(configs: (SingleTableTransactionParams | null)[]): TransactionParams[]
```

**Parameters:**

- `configs` - Array of single table transaction configurations

Returns array of provider-compatible transaction configurations.

**Example:**

```ts
const singleTableTransacts = table.ejectTransactParams([
  { create: { key: { partitionKey: 'A', rangeKey: 'B' }, item: { name: 'test' } } }
]);

await otherProvider.transaction([
  { create: { table: 'OtherTable', item: { id: '1' } } },
  ...singleTableTransacts,
]);
```

### single table generate transaction config list

Maps items to transaction configurations.

```ts
toTransactionParams<Item>(
  items: Item[],
  generator: (item: Item) => SingleTableTransactionParams | (SingleTableTransactionParams | null)[] | null
): SingleTableTransactionParams[]
```

**Parameters:**

- `items` - Array of items to process
- `generator` - Function that returns transaction config(s) for each item

**Example:**

```ts
const configs = table.toTransactionParams(users, (user) => ({
  update: {
    partitionKey: ['USER', user.id],
    rangeKey: '#DATA',
    values: { lastSync: new Date().toISOString() }
  }
}));

await table.transaction(configs);
```

### single table create set

Creates a DynamoDB Set. Normalizes Set creation across SDK v2 and v3.

```ts
createSet<T>(items: T[]): DBSet<T[number]>
```

**Parameters:**

- `items` - Array of strings or numbers

**Example:**

```ts
await table.create({
  key: { partitionKey: 'ITEM#1', rangeKey: '#DATA' },
  item: {
    id: '1',
    tags: table.createSet(['tag1', 'tag2', 'tag3']),
    counts: table.createSet([1, 2, 3])
  }
});
```

### single table list all from type

Retrieves all items of a specified type. Requires `typeIndex` with an existing DynamoDB index.

```ts
listAllFromType<Entity>(type: string): Promise<Entity[]>
```

**Parameters:**

- `type` - Entity type value matching the `typeIndex` partition key

Automatically paginates until all items are retrieved.

**Example:**

```ts
const users = await table.listAllFromType('USER');
```

### single table list type

Retrieves items of a specific type with pagination support. Requires `typeIndex` with an existing DynamoDB index.

```ts
listType<Entity>(params: ListItemTypeParams): Promise<ListItemTypeResult<Entity>>
```

**Parameters:**

- `type` - Entity type value matching the `typeIndex` partition key
- `range` (optional) - Range key filter with operations: `equal`, `lower_than`, `lower_or_equal_than`, `bigger_than`, `bigger_or_equal_than`, `begins_with`, `between`
- `limit` (optional) - Maximum items to return
- `paginationToken` (optional) - Continue from previous query
- `retrieveOrder` (optional) - `ASC` or `DESC`
- `fullRetrieval` (optional) - Auto-paginate until all items retrieved. Default: `false`
- `filters` (optional) - Filter expressions

Returns `{ items, paginationToken? }`

**Example:**

```ts
const { items, paginationToken } = await table.listType({
  type: 'USER',
  range: {
    operation: 'begins_with',
    value: 'john',
  },
  limit: 10,
});
```

### single table find table item

Finds the first item matching a type. Requires `typeIndex` configured.

```ts
findTableItem<Entity>(items: AnyObject[], type: string): Entity | undefined
```

**Parameters:**

- `items` - Array of items to search
- `type` - Entity type value

Returns first matching item or `undefined`.

**Example:**

```ts
const items = await table.query({ partition: ['USER', id] });
const userData = table.findTableItem<User>(items.items, 'USER');
```

### single table filter table itens

Filters items by type. Requires `typeIndex` configured.

```ts
filterTableItens<Entity>(items: AnyObject[], type: string): Entity[]
```

**Parameters:**

- `items` - Array of items to filter
- `type` - Entity type value

Returns array of matching items.

**Example:**

```ts
const items = await table.query({ partition: ['USER', id] });
const logs = table.filterTableItens<Log>(items.items, 'USER_LOG');
```

## Single Table Schema

The schema system provides entity definitions, partition management, and collection joins. Access via `table.schema`.

### Single Table Schema: Entity

Entities represent data types within the table.

**Syntax:**

```ts
type tUser = {
  id: string;
  name: string;
  createdAt: string;
}

const User = table.schema.createEntity<tUser>().as({
  // entity parameters
})
```

The two-step invocation (`createEntity<Type>().as()`) enables proper type inference. Entity types rely on TypeScript types without runtime schema validation.

**Entity Parameters:**

- **`type`** (string, required) - Unique identifier for the entity type within the table. Throws error if duplicate types are registered.

- **`getPartitionKey`** (function or array, required) - Generates partition key from entity properties.
  - Function: `(params: Partial<Entity>) => KeyValue`
  - Array: Supports dot notation for property references (see below)
  - Type: `KeyValue = null | string | Array<string | number | null>`
  - Parameters restricted to entity properties only

- **`getRangeKey`** (function or array, required) - Generates range key from entity properties. Same structure as `getPartitionKey`.

**Key Resolver Example:**

```ts
type User = {
  id: string;
  name: string;
  createdAt: string;
}

const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
  getRangeKey: () => '#DATA',
})
```

Parameters must exist in the entity type. Using non-existent properties causes type errors.

**Dot Notation Shorthand:**

Key resolvers can use array syntax with dot notation for property references:

```ts
type Event = {
  id: string;
  timestamp: string;
  userId: string;
}

const Event = table.schema.createEntity<Event>().as({
  type: 'USER_EVENT',
  getPartitionKey: ['USER_EVENT'],
  getRangeKey: ['.id'],  // References Event.id
  indexes: {
    byUser: {
      getPartitionKey: ['EVENT_BY_USER', '.userId'],
      getRangeKey: ['.timestamp'],
      index: 'IndexOne',
    },
  },
});
```

**Dot Notation Behavior:**

- Strings starting with `.` reference entity properties
- Leading `.` is removed before property lookup (`'.id'` becomes `id`)
- IDE provides autocomplete for property names
- Typos cause `undefined` values in keys
- Constants without `.` remain unchanged (`'USER_EVENT'` stays `'USER_EVENT'`)

Use functions for complex key generation logic. Dot notation handles simple property references only.

- **`autoGen`** (object, optional) - Auto-generate property values on create or update.
  ```ts
  type AutoGenParams<Entity> = {
    onCreate?: { [Key in keyof Entity]?: AutoGenOption };
    onUpdate?: { [Key in keyof Entity]?: AutoGenOption };
  };
  ```

  Options for `AutoGenOption`:
  - `'UUID'` - Generates v4 UUID
  - `'KSUID'` - Generates K-Sortable Unique ID
  - `'count'` - Assigns `0`
  - `'timestamp'` - Generates ISO timestamp via `new Date().toISOString()`
  - `() => any` - Custom generator function


- **`rangeQueries`** (object, optional) - Predefined range key queries for the entity.
  - Key: Query method name
  - Value: Query configuration with `operation` and `getValues`

  ```ts
  type Log = {
    timestamp: string;
  }

  const Logs = table.schema.createEntity<Log>().as({
    type: 'APP_LOGS',
    getPartitionKey: () => ['APP_LOG'],
    getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,
    rangeQueries: {
      dateSlice: {
        operation: 'between',
        getValues: ({ start, end }: { start: string, end: string }) => ({ start, end })
      }
    }
  })
  ```

  Generates typed query methods accessible via `table.schema.from(Logs).query.dateSlice({ start, end })`.

- **`indexes`** (object, optional) - Secondary index definitions. Only available if table has `indexes` configured.
  - Key: Custom index identifier
  - Value: Index configuration
    - `getPartitionKey` - Partition key resolver (function or array)
    - `getRangeKey` - Range key resolver (function or array)
    - `index` - Table index name matching `indexes` configuration
    - `rangeQueries` (optional) - Predefined queries for this index

  ```ts
  type Log = {
    type: string;
    timestamp: string;
  }

  const Logs = table.schema.createEntity<Log>().as({
    type: 'APP_LOGS',
    getPartitionKey: () => ['APP_LOG'],
    getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,
    indexes: {
      byType: {
        getPartitionKey: ({ type }: Pick<Log, 'type'>) => ['APP_LOG_BY_TYPE', type],
        getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,
        index: 'DynamoIndex1'
      }
    }
  })
  ```

- **`extend`** (function, optional) - Adds or modifies properties on retrieved items.
  - Signature: `(item: Entity) => AnyObject`
  - Applied automatically to all retrieval operations via `from()`

  ```ts
  type User = {
    id: string;
    name: string;
    dob: string;
  }

  const User = table.schema.createEntity<User>().as({
    type: 'USER',
    getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
    getRangeKey: () => '#DATA',
    extend: ({ dob }) => ({ age: calculateAge(dob) })
  })
  ```

  Retrieved items include the extended properties automatically.

### Using Entities

Entities expose helper methods and integration with `schema.from()`.

**Entity Helper Methods:**

- `getKey(params)` - Generates key reference from parameters required by `getPartitionKey` and `getRangeKey`. Returns `{ partitionKey: KeyValue, rangeKey: KeyValue }`.

- `getCreationParams(item, options?)` - Generates parameters for [single table create](#single-table-create). Optional `expiresAt` parameter available if table has TTL configured.

- `getUpdateParams(params)` - Generates parameters for [single table update](#single-table-update). Requires key parameters plus update operations (`values`, `atomicOperations`, etc.).

- **Transaction Builders:**
  - `transactCreateParams` - Returns `{ create: {...} }`
  - `transactUpdateParams` - Returns `{ update: {...} }`
  - `transactDeleteParams` - Returns `{ erase: {...} }`
  - `transactValidateParams` - Returns `{ validate: {...} }`

**Using `schema.from()`:**

Creates a repository interface for entity operations:

```ts
type User = {
  id: string;
  name: string;
  createdAt: string;
}

const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
  getRangeKey: () => ['#DATA'],
})

const userRepo = table.schema.from(User)

await userRepo.create({
  id: 'user-id',
  name: 'John',
  createdAt: new Date().toISOString()
})

await userRepo.update({
  id: 'user-id',
  values: { name: 'Jane' }
})
```

**Available Methods:**

- `get`
- `batchGet`
- `create`
- `update`
- `delete`
- `listAll` - Requires `typeIndex`
- `list` - Requires `typeIndex`
- `query`
- `queryIndex` - Requires entity `indexes` definition

**Query Methods:**

`query` and `queryIndex` expose `custom` method plus any defined `rangeQueries`:

```ts
type Log = {
  type: string;
  timestamp: string;
}

const Logs = table.schema.createEntity<Log>().as({
  type: 'APP_LOGS',
  getPartitionKey: () => ['APP_LOG'],
  getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,
  rangeQueries: {
    recent: {
      operation: 'bigger_than',
      getValues: ({ since }: { since: string }) => ({ value: since })
    }
  },
  indexes: {
    byType: {
      getPartitionKey: ({ type }: Pick<Log, 'type'>) => ['APP_LOG_BY_TYPE', type],
      getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,
      index: 'DynamoIndex1',
      rangeQueries: {
        dateSlice: {
          operation: 'between',
          getValues: ({ start, end }: { start: string, end: string }) => ({ start, end })
        }
      }
    }
  }
})

// Query main partition
await table.schema.from(Logs).query.custom()
await table.schema.from(Logs).query.custom({ limit: 10, retrieveOrder: 'DESC' })
await table.schema.from(Logs).query.recent({ since: '2024-01-01' })

// Query index
await table.schema.from(Logs).queryIndex.byType.custom({ type: 'ERROR' })
await table.schema.from(Logs).queryIndex.byType.dateSlice({
  type: 'ERROR',
  start: '2024-01-01',
  end: '2024-01-31'
})
```

All retrieval methods apply `extend` function if defined.

### Single Table Schema: Partition

Partitions group entities sharing the same partition key. Centralizes key generation for related entities.

**Parameters:**

- **`name`** (string, required) - Unique partition identifier. Throws error if duplicated.
- **`getPartitionKey`** (function, required) - Partition key generator. Function form only (dot notation not supported).
- **`index`** (string, optional) - Table index name. Creates index partition when specified.
- **`entries`** (object, required) - Range key generators mapped by name. Each entry can be used once to create an entity or index definition.

**Example:**

```ts
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  entries: {
    mainData: () => ['#DATA'],
    permissions: ({ permissionId }: { permissionId: string }) => ['PERMISSION', permissionId],
    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
    orders: ({ orderId }: { orderId: string }) => ['ORDER', orderId],
  },
})
```

Use descriptive parameter names (`userId` instead of `id`) for clarity.

**Creating Entities from Partitions:**

Use `partition.use(entry).create<Type>().entity()` for main table or `.index()` for index partitions:

```ts
type User = {
  id: string;
  name: string;
  createdAt: string;
  email: string;
}

type UserLoginAttempt = {
  userId: string;
  timestamp: string;
  success: boolean;
  ip: string;
}

const User = userPartition.use('mainData').create<User>().entity({
  type: 'USER',
  paramMatch: {
    userId: 'id'  // Maps partition param 'userId' to entity property 'id'
  },
  // Other entity parameters...
})

const UserLoginAttempt = userPartition.use('loginAttempt').create<UserLoginAttempt>().entity({
  type: 'USER_LOGIN_ATTEMPT',
  // No paramMatch needed - all partition params exist in entity type
})
```

**Parameter Matching:**

- **`paramMatch`** - Maps partition parameters to entity properties when names differ. **Required when partition parameters are not present in entity type**. Optional when all parameters exist in entity.

Each partition entry can be used only once.

**Index Partitions:**

Partitions can target secondary indexes by specifying the `index` parameter:

```ts
type User = {
  id: string;
  name: string;
}

const userIndexPartition = table.schema.createPartition({
  name: 'USER_INDEX_PARTITION',
  index: 'DynamoIndex1',  // Must match table indexes configuration
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  entries: {
    mainData: () => ['#DATA'],
    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
  },
})

// Use index partition in entity definition
const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: () => ['APP_USERS'],
  getRangeKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
  indexes: {
    userData: userIndexPartition.use('mainData').create<User>().index({
      paramMatch: { userId: 'id' },
      // rangeQueries and other index parameters
    }),
  }
})
```

Index partitions return `.index()` method instead of `.entity()` when used.

Another great usage of partition is to facilitate your **collections** creation. Let's explore what a collection is:

## Single Table Schema: Collection

Collections define joined entity structures for retrieval. Data in single-table designs often spans multiple entries that need to be retrieved and joined together.

### Collection Parameters

- **`ref`** (entity or null, required) - Root entity of the collection. Use `null` for collections with only joined entities.

- **`type`** (`'SINGLE'` or `'MULTIPLE'`, required) - Collection cardinality. `'SINGLE'` returns one result, `'MULTIPLE'` returns an array.

- **`getPartitionKey`** (function, optional) - Partition key generator for the collection. Mutually exclusive with `partition`.

- **`index`** (string, optional) - Table index name. Only valid with `getPartitionKey`.

- **`partition`** (Partition, optional) - Existing partition (entity or index partition). Mutually exclusive with `getPartitionKey` and `index`. The collection infers index usage automatically.

- **`narrowBy`** (optional) - Range key filter for collection query:
  - `'RANGE_KEY'` - Uses ref entity's range key as query prefix. Requires `ref` to be an entity.
  - `(params?: AnyObject) => RangeQueryConfig` - Custom range query function.

- **`join`** (object, required) - Entity join configuration. Structure: `Record<string, JoinConfig>`. Each key becomes a property in the result type.

**Join Configuration:**

```ts
type JoinConfig = {
  entity: RefEntity;
  type: 'SINGLE' | 'MULTIPLE';
  extractor?: (item: AnyObject) => any;
  sorter?: (a: any, b: any) => number;
  joinBy?: 'POSITION' | 'TYPE' | ((parent: any, child: any) => boolean);
  join?: Record<string, JoinConfig>;
}
```

**Join Parameters:**

- **`entity`** (required) - Entity to join.

- **`type`** (required) - `'SINGLE'` for single item, `'MULTIPLE'` for array.

- **`extractor`** (optional) - Transforms joined entity before inclusion. Signature: `(item) => any`.

- **`sorter`** (optional) - Sorts `'MULTIPLE'` type joins. Ignored for `'SINGLE'`. Signature: `(a, b) => number`.

- **`joinBy`** (optional) - Join strategy. Default: `'POSITION'`.
  - `'POSITION'` - Sequential join based on query order. Requires table `typeIndex` with existing DynamoDB index.
  - `'TYPE'` - Join by entity type property. Requires `typeIndex.partitionKey` defined (index need not exist in DynamoDB).
  - `(parent, child) => boolean` - Custom join function. Returns `true` to join.

- **`join`** (optional) - Nested join configuration. Same structure as root `join`. Enables multi-level joins.

Returns a collection object for type extraction and query execution.

### Collection Type Extraction

Use `GetCollectionType` to infer the collection's TypeScript type:

```ts
type YourType = GetCollectionType<typeof yourCollection>
```

### Collection Examples

**Collection with Root Entity:**

```ts
const userPartition = table.schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }: { userId: string }) => ['USER', userId],
  entries: {
    mainData: () => ['#DATA'],
    loginAttempt: ({ timestamp }: { timestamp: string }) => ['LOGIN_ATTEMPT', timestamp],
  },
})

type User = {
  id: string;
  name: string;
  email: string;
}

type UserLoginAttempt = {
  userId: string;
  timestamp: string;
  success: boolean;
  ip: string;
}

const User = userPartition.use('mainData').create<User>().entity({
  type: 'USER',
  paramMatch: { userId: 'id' },
})

const UserLoginAttempt = userPartition.use('loginAttempt').create<UserLoginAttempt>().entity({
  type: 'USER_LOGIN_ATTEMPT',
})

// This will correctly need the userId param to retrieve when doing schema.from(userWithLogins).get
const userWithLogins = userPartition.collection({
  ref: User,
  type: 'SINGLE',
  join: {
    logins: {
      entity: UserLoginAttempt,
      type: 'MULTIPLE',
      joinBy: 'TYPE',
    },
  },
});

// Type: User & { logins: UserLoginAttempt[] }
type UserWithLogins = GetCollectionType<typeof userWithLogins>
```

**Collection without Root Entity:**

```ts
type UserPermission = {
  permissionId: string;
  timestamp: string;
  addedBy: string;
}

const UserPermission = userPartition.use('permissions').create<UserPermission>().entity({
  type: 'USER_PERMISSION',
})

const userDataCollection = userPartition.collection({
  ref: null,
  type: 'SINGLE',
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
      extractor: ({ permissionId }: UserPermission) => permissionId,
    }
  },
});

// Type: { logins: UserLoginAttempt[], permissions: string[] }
type UserData = GetCollectionType<typeof userDataCollection>
```

You can also call `table.schema.createCollection` if you need to pass in partitions/partition-getters inline

### Using Collections

Collections expose a `get` method via `schema.from()`:

```ts
const result = await table.schema.from(userWithLogins).get({
  userId: 'user-id-12',
})
```

Returns the collection type for `'SINGLE'` collections or `undefined` if not found. Returns array for `'MULTIPLE'` collections.




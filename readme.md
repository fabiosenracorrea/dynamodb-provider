# Dynamo DB Provider

Fast Develop for DynamoDB with this type-safe & single-table awareness library!

## Introduction

No matter if you are using v2 or v3, the DynamoDB SDK is not very friendly (or type safe). With interesting (to say the least) design choices, developing and handling easy operations onto it requires a lot of boiler plate (even more if you are not using the DocumentClient). From building string expressions and trying to avoid collisions and code repetition you are generally left with a lot of code that does little, its hard to maintain and is inevitable wrapped inside a custom abstraction that may fall short.

After trying different approaches and used DynamoDB for years with them, interchanging between some table-to-table and single-table designs, I decided to create an easy-to-inject + customize wrapper around the dynamoDB calls that can work well on each use-case I've seen over these years.

Nice: apart from the established `uuid` and `ksuid` libraries to generate IDs on the schema part, this library has zero dependencies!

## Three part lib

With the different use cases DynamoDB has, it would not suffice to simply abstract and type the dynamoDB calls. That is, however, the first step to tame the beast. Because you can be in a table-to-table environment and/or single-table (yes, could be both!), what this provider offers had to be split to better accommodate each use case as much as possible.

As such, 3 different main concepts are exposed:

1. A **DynamoDB client-like provider**. This is where you'll find the abstraction to each method (get, update, transaction...). If you are not using single-table, you may only need this.
2. **SingleTable instance**, in which you can define your table config and easily execute all the methods (contained in the provider) without repeating yourself about keys/indexes etc that are always fixed
3. **Schema capabilities** inside your SingleTable instance, in which you can define partitions, entities and collections to properly define you DB data and execute actions on them with ease

This division is done with a bit of `extensibility` in mind. If you like the lib's abstraction, but pictured the schema part a bit differently (or even, the whole single-table aspect), you can use our abstractions to then customize the usages to your liking.

For the future there is a plan to fully expose the DynamoDB methods, params and responses through a `raw` section of our `1. Provider` to facilitate this more and not lock you with our abstractions/responses while keeping the type-safe etc in check.

It's important to note that while it looks like an ORM while using 2 + 3, its still not quite there. This is by design, as each dynamodb single-table design has its own query/join conditions and choices. I do plan on creating more options on this matter, without being as opinionated as some might be.

Now lets dive on these 3 parts

## 1. DynamoDB Provider (client)

The DynamodbProvider substitutes you aws clients, but is created with them so you can customize it as needed to work properly. The provider accepts **either v2 or v3 clients, but they must be the DocumentClient type**. Yes, this lib only worries about the DocumentClient version, not the convoluted default version.

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
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamodbProvider } from 'dynamodb-provider'

const ddbClient = new DynamoDBClient({
  // any config you may need. region, credentials...
});

const documentClient = DynamoDBDocumentClient.from(ddbClient);

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',

    instance: documentClient,
  },
});
```

As you have the choise, this lib does not come with any of the aws libraries and is up to you when implementing

### Configuration params

Apart from the dynamoDB version, the provider currently supports the following params:

```ts
interface DynamoDbProviderParams {
  dynamoDB: DynamoDBConfig;

  logCallParams?: boolean;
}
```

#### logCallParams

A `bolean` param that enables you to tap in on dynamoDB call params. That will log to the console the actual params produced by the lib and passed by the X dynamodb call

Usefull for debugging or tracking each action that actually reached your Dynamo.

On the future more tap-in params will be provided, both on instance creation and on specific methods.

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

The `get` method retrieves a single item from a DynamoDB table based on its primary key. This method allows you to specify whether to use strongly consistent reads, and it also provides the flexibility to retrieve only specific properties from the item.

##### Signature

```ts
interface Method {
  get<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: GetItemParams<Entity, PKs>,
  ): Promise<Entity | undefined>;
}
```

##### Parameters

**Entity (Type Parameter):**

The expected type of the entity being retrieved. This allows for strong typing of the return value based on the entity structure.

**PKs (Type Parameter):**

Specifies the primary key(s) to be used for the query. This is typically the partition key and optional sort key for composite keys. It can be inferred or passed explicitly.

This allows for narrow operations and is mostly used internally, but exposed if you want to do those kind of restrictions or building from the provider into a custom handler

##### GetItemParams<Entity, PKs>

- **table**: string
The name of the DynamoDB table from which to retrieve the item.

- **key**: EntityPK<Entity, PKs>

The primary key of the item. This can include both partition key and sort key, depending on your table schema. The key structure will be inferred based on the entity type.

- **consistentRead**: boolean (optional)

If set to true, the operation will use strongly consistent reads, ensuring the most up-to-date data is retrieved. Defaults to false, meaning the operation uses eventually consistent reads (faster but may return stale data).

- **propertiesToRetrieve**: (keyof Entity)[] (optional)

An array of specific properties (attributes) to retrieve from the item. If not specified, all attributes of the item will be retrieved. Currently, this only supports root-level attributes (no nested fields).

##### Return Value

`Promise<Entity | undefined>`

The method returns a promise that resolves to the retrieved item (Entity) or undefined if the item does not exist.

##### Usage

```ts
interface User {
  userId: string;
  name: string;
  email: string;
  age: number;
}

const result = await db.get<User>({
  table: 'UsersTable',

  key: {
    userId: '12345',
  },

  consistentRead: true,  // Optional: Ensures strongly consistent reads

  propertiesToRetrieve: ['name', 'email'],  // Optional: Fetches only name and email
});
```

##### Error Handling

If the table name or key is invalid, an error will be thrown by DynamoDB. The method itself does not return any errors directly, but errors can occur due to invalid parameters or issues with the underlying DynamoDB service.

### create

Create an item to your dynamodb table. Remember: dynamo's create (put) action can overwrite existing items. If that is an issue, usse the `conditions` property to ensure the creation only happens when it should.

##### Method Signature

```ts
type Method {
  create<Entity>(params: CreateItemParams<Entity>): Promise<Entity>;
}
```

##### Method Signature

**Entity (Type Parameter):**
The type of the entity being created. This allows for strong typing and validation of the provided data based on the entity structure.

**Parameters (Object):**

An object containing the following properties:

  - `table (string)`:
  The name of the DynamoDB table into which the item will be inserted.

  - `item (Object)`:

  The item to be created in the table. This object should include all necessary attributes, such as the partition key and (if applicable) the sort key, along with any other attributes defined by the entity.

  - `conditions (Array<ItemExpression>): (optinal)`
  An optional set of conditions that must be fulfilled before the item is created. This can be used to ensure that specific attributes or values meet criteria before inserting.

Example: Creating an user only if it does not exists

```ts
interface User {
  userId: string;
  name: string;
  email: string;
  age: number;
}

const createdUser = await provider.create({
  table: 'Users',

  item: {
    userId: '12345',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },

  conditions: [
    {
      condition: 'not_exists',
      property: 'userId',
    },
  ],
});
```

Just remember that if your table has a partition key and a range key, you need to check for both:

```ts
{
  conditions: [
    {
      condition: 'not_exists',
      property: 'paritionKey',
    },
    {
      condition: 'not_exists',
      property: 'rangeKey',
    },
  ],
}

// this condition will check if the item being created does not previously exist on your table, failing if true
```

##### Valid Conditions

Heres a breakdown of all condition types

```ts
export type ExpressionOperation =
  | 'equal'
  | 'not_equal'
  | 'lower_than'
  | 'lower_or_equal_than'
  | 'bigger_than'
  | 'bigger_or_equal_than'
  | 'begins_with'
  | 'contains'
  | 'not_contains'
  | 'between'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists';

interface BasalExpressionValues<Entity> {
  /**
   * The property to perform the expression on
   */
  property: StringKey<Entity>;

  /**
   * How should this expression be joined with other expressions?
   *
   * This does not take into account parenthesis
   */
  joinAs?: 'and' | 'or';
}

export interface BasicExpression<Entity> extends BasalExpressionValues<Entity> {
  value: string | number;

  operation: Extract<
    ExpressionOperation,
    | 'equal'
    | 'not_equal'
    | 'lower_than'
    | 'lower_or_equal_than'
    | 'bigger_than'
    | 'bigger_or_equal_than'
    | 'begins_with'
    | 'contains'
    | 'not_contains'
  >;
}

export interface BetweenExpression<Entity> extends BasalExpressionValues<Entity> {
  low: string | number;
  high: string | number;

  operation: Extract<ExpressionOperation, 'between'>;
}

export interface ListExpression<Entity> extends BasalExpressionValues<Entity> {
  values: (string | number)[];

  operation: Extract<ExpressionOperation, 'in' | 'not_in'>;
}

export interface AttributeExistenceExpression<Entity> extends BasalExpressionValues<Entity> {
  operation: Extract<ExpressionOperation, 'exists' | 'not_exists'>;
}

export type ItemExpression<Entity> =
  | BasicExpression<Entity>
  | BetweenExpression<Entity>
  | AttributeExistenceExpression<Entity>
  | ListExpression<Entity>;
```

The `joinAs` property ensures the expression you are building will be properly created. Inner expressions are not currently supported.

### delete

The `delete` method removes an item from a DynamoDB table based on the provided primary key. You can also add conditions to control the deletion process, ensuring that certain conditions must be met before the item is deleted.

#### Method Signature

```ts
interface Method {
  delete<Entity extends Record<string, any>>(
    params: DeleteItemParams<Entity>,
  ): Promise<void> {
    await this.remover.delete(params);
  }
}
```

##### Parameters

- **`Entity` (Type Parameter)**:
  The type of the entity being deleted. This ensures the primary key type matches the expected structure.

- **`params` (Object)**:
  The object containing the following properties:

  - **`table` (string)**:
    The name of the DynamoDB table from which the item should be deleted.

  - **`key` (Object)**:
    The primary key of the item to delete.

  - **`conditions` (Array<ItemExpression>, Optional)**:
    An optional set of conditions that must be met before the deletion occurs. This can be used to ensure that the item matches certain criteria before being deleted. Same strucute as the `create` method

#### Return Value

No value is returned. If the operation fails (dynamoDB error), that is thrown

#### Example Usage

```ts
  interface User {
    id: string;
    name: string;
    email: string;
  }

  await dynamoDB.delete<User>({
    table: 'Users',

    key: {
      id: '12345',
    },

    conditions: [
      {
        condition: 'exists',
        property: 'id',
      },
    ]
  });
```

### update

The `update` method modifies an item in a DynamoDB table based on the provided primary key. You can selectively update, remove, or apply atomic operations to the item. Additionally, you can add conditions to ensure specific criteria are met before updating the item.

##### Method Signature

```ts
interface Method {
  async update<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    params: UpdateParams<Entity, PKs>,
  ): Promise<Partial<Entity> | undefined>;
}
```

###### Parameters

- **`Entity` (Type Parameter)**:
  The type of the entity being updated. This ensures the primary key and update data match the expected structure.

- **`params` (Object)**:
  The object containing the following properties:

  - **`table` (string)**:
    The name of the DynamoDB table where the item should be updated.

  - **`key` (Object)**:
    The primary key of the item to update. It can include both the partition key and sort key, depending on the table's schema.

  - **`remove` (Array<keyof Entity>, Optional)**:
    A list of attributes to remove from the item.
    _Note_: Only root-level properties are supported for removal.

  - **`values` (Object, Optional)**:
    A partial object with the values to update. This allows you to update specific fields of the item.

  - **`atomicOperations` (Array<AtomicOperation>, Optional)**:
    Defines atomic operations to be executed on the item.
    _Supported operations include_:
    - Math Operations: `sum`, `subtract`, `add`
    - Set Operations: `add_to_set`, `remove_from_set`
    - Conditional Operations: `set_if_not_exists`

  - **`conditions` (Array<ItemExpression>, Optional)**:
    An optional set of conditions that must be fulfilled before the update occurs. If any condition is not met, the update will fail.

  - **`returnUpdatedProperties` (boolean, Optional)**:
    If set to `true`, this will return the updated properties after the operation. This can be useful for tracking atomic operations such as counters.

##### Return Value

Returns a `Promise` that resolves to the updated entity (or a partial version of it) if `returnUpdatedProperties` is set to `true`, or `undefined` otherwise.

##### Example Usage

```ts
  interface User {
    userId: string;
    name: string;
    email: string;
    age: number;
  }

  const params = {
    table: 'Users',

    key: {
      userId: '12345',
    },

    values: {
      name: 'John Doe',
    },

    atomicOperations: [
      { operation: 'add', property: 'age', value: 1 },
    ],

    conditions: [
      {
        condition: 'exists',
        attribute: 'userId',
      },
    ],

    returnUpdatedProperties: true,
  };

  const updatedUser = await provider.update(params);

  // updatedUser will be { name, age }
```

One common use case of this operation is to control the number of items you have with another item. Say you want to control User with incremental ids:

```ts
// whenever creating an user

// operation 1

const { count } = await provider.update({
  table: 'CONTROL_TABLE',

  key: { pk: 'USER_COUNT', sk: 'USER_COUNT' },

  atomicOperations: [
    {
      operation: 'add',
      property: 'count',
      value: 1
    },
  ],

  returnUpdatedProperties: true
})

// operation 2

await provider.create({
  table: 'Users',

  item: {
    // ...user data
    id: count // unique counter, updated from op1
  }
})
```

### batchGet

The `batchGet` method retrieves multiple items from a DynamoDB table in a single operation. You specify an array of primary keys and DynamoDB will return all matching items. This operation supports retries for unprocessed items and offers the ability to specify which properties should be retrieved.

##### Method Signature

```ts
  async batchGet<Entity = AnyObject, PKs extends StringKey<Entity> | unknown = unknown>(
    options: BatchListItemsArgs<Entity, PKs>,
  ): Promise<Entity[]>;
```

##### Parameters

- **`Entity` (Type Parameter)**:
  The type of the entities being retrieved. This ensures that the retrieved items match the expected structure.

- **`Params` (Object)**:
  The object containing the following properties:

`table` (string):
  The name of the DynamoDB table from which the items should be retrieved.

`keys` (Array<Object>):
  An array of primary keys for the items you want to retrieve. Each primary key should contain the partition key and, if applicable, the sort key.

`consistentRead` (boolean, Optional):
  If set to `true`, the operation uses strongly consistent reads. Otherwise, eventually consistent reads are used.
  _Default is `false`._

`propertiesToRetrieve` (Array<keyof Entity>, Optional):
  A list of root-level properties to retrieve from the items.
  _Note_: The return type is currently not affected by this field.

`throwOnUnprocessed` (boolean, Optional):
  By default, this method will try up to 8 times to resolve any `UnprocessedItems` returned from the `batchGet` call. If unprocessed items still exist after all retries, the method will return whatever items were processed successfully.
  Set this to `true` if you want the method to throw an error if any unprocessed items remain.

`maxRetries` (number, Optional):
  The maximum number of retry attempts for unprocessed items.
  _Default is 8 retries, with exponential backoff._

##### Return Value

Returns a `Promise` that resolves to an array of the retrieved entities.

##### Example Usage

```ts
interface Product {
  productId: string;
  name: string;
  price: number;
}

const products = await dynamoDB.batchGet({
  table: 'Products',

  keys: [
    { productId: '123' },
    { productId: '456' },
  ],

  consistentRead: true,

  propertiesToRetrieve: ['name', 'price'],

  throwOnUnprocessed: true,

  maxRetries: 5,
});
```

### `list`

The `list` method retrieves multiple items from a DynamoDB table based on the specified options. Its a wrapper on `Scan`. It supports filters, limits, pagination, and parallel scans. The method returns a list of items and an optional pagination token that can be used to continue the retrieval in subsequent calls if more items are available than the limit.

##### Method Signature

```ts
interface Method {
  async list<Entity = AnyObject>(
    table: string,
    options = {} as ListOptions<Entity>,
  ): Promise<ListTableResult<Entity>>;
}
```

##### Parameters

- **`Entity` (Type Parameter)**:
  The type of the entities being retrieved. This ensures that the retrieved items match the expected structure.

- **`table` (string)**:
  The name of the DynamoDB table from which the items should be listed.

- **`options` (ListOptions, Optional)**:
  An object containing the following properties for filtering and configuring the list operation:

  - `propertiesToGet` (Array<string>, Optional):
    A list of root-level properties to retrieve from each entity.

  - `filters` (Object, Optional):
    Conditions that the entities must meet to be included in the result.
    You can use three different syntaxes for defining filters:
    1. `key:value` - Filters for equality (e.g., `status: 'active'`).
    2. `key:value[]` - Filters for any of the provided values (e.g., `status: ['active', 'inactive']`).
    3. `key:{<FilterConfig>}` - More complex filters using a filter configuration.

  - `limit` (number, Optional):
    Defines the maximum number of items to retrieve.
    _Note_: DynamoDB might return fewer items if the maximum allowed MB per request is reached. In such cases, a `paginationToken` will be returned for further retrieval.

  - `consistentRead` (boolean, Optional):
    When set to `true`, the operation uses strongly consistent reads.
    _Default is `false`._

  - `parallelRetrieval` (Object, Optional):
    Allows parallel scans across different segments of the table.
    Use this to speed up scanning by dividing the workload across multiple workers.
    You can specify the following properties:
    - `segment` (number): The zero-based segment index to scan.
    - `total` (number): The total number of parallel scans to run.

  - `index` (string, Optional):
    The Local or Global Secondary Index to be scanned.

  - `paginationToken` (string, Optional):
    A token that allows you to continue the list operation from where a previous request left off.
    _Note_: This is an abstraction of DynamoDB's `LastEvaluatedKey`, which is returned as an object. The `paginationToken` simplifies this process by converting the object into a string.

#### Advanced Filter Options

As noted, you can simply match value(s) to the relevant properties. But if you need to perform complex operations (such as `bigger_than`), you need to provide a different structure:

```ts
export type BasicFilterConfig = Pick<BasicExpression<any>, 'operation' | 'value' | 'joinAs'>;

export type BetweenFilterConfig = Pick<
  BetweenExpression<any>,
  'operation' | 'high' | 'low' | 'joinAs'
>;

export type AttributeExistenceFilterConfig = Pick<
  AttributeExistenceExpression<any>,
  'operation' | 'joinAs'
>;

export type ListFilterConfig = Pick<ListExpression<any>, 'operation' | 'values' | 'joinAs'>;

export type FilterConfig =
  | BasicFilterConfig
  | BetweenFilterConfig
  | AttributeExistenceFilterConfig
  | ListFilterConfig;
```

This type is based on the `Expression` type used on `conditions` on operations such as update, create or delete.

##### Return Value

Returns a `Promise` that resolves to a `ListTableResult` object containing:

- **`items` (Array<Entity>)**:
  The array of items retrieved from the table.

- **`paginationToken` (string, Optional)**:
  If there are more items to retrieve, a token is returned to continue the operation in the next call.
  _Note_: This is an abstraction of DynamoDB's `LastEvaluatedKey`, which is converted into a string for easier use.

##### Example Usage

Simple listing:

```ts
interface Product {
  productId: string;
  name: string;
  price: number;
  category: string;
}

const result = await dynamoDB.list<Product>('Products', {
  propertiesToGet: ['productId', 'name', 'price'],

  filters: {
    category: 'electronics',
  },

  limit: 100,

  consistentRead: true,
});
```

Listing with complex filtering:

```ts
interface Product {
  productId: string;
  name: string;
  price: number;
  category: string;
}

const result = await dynamoDB.list<Product>('Products', {
  filters: {
    price: {
      operation: 'bigger_than',
      value: 100,
    },

    name: {
      operation: 'begins_with',
      value: 'k'
    }
  },

  limit: 100,

  consistentRead: true,
});
```

### `listAll`

The `listAll` method retrieves all items from a DynamoDB table, running sequential scan operations until there are no more items to retrieve. It removes the need to handle pagination manually, unlike the `list` method, which may return a `paginationToken` for further retrieval. This method is useful when you need to scan an entire table without worrying about setting pagination tokens or limits.

##### Method Signature

```ts
interface Method {
  async listAll<Entity = AnyObject>(
    table: string,
    options = {} as ListAllOptions<Entity>,
  ): Promise<Entity[]>;
}
```

##### Parameters

- **`Entity` (Type Parameter)**:
  The type of the entities being retrieved. This ensures that the retrieved items match the expected structure.

- **`table` (string)**:
  The name of the DynamoDB table from which the items should be retrieved.

- **`options` (ListAllOptions, Optional)**:
  An object containing the following properties for filtering and configuring the retrieval:

  - `propertiesToGet` (Array<keyof Entity>, Optional):
    A list of root-level properties to retrieve from each entity.

  - `filters` (Object, Optional):
    Conditions that the entities must meet to be included in the result.
    You can use three different syntaxes for defining filters:
    1. `key:value`- Filters for equality (e.g., `status: 'active'`).
    2. `key:value[]`- Filters for any of the provided values (e.g., `status: ['active', 'inactive']`).
    3. `key:{<FilterConfig>}`- More complex filters using a filter configuration.

  - `consistentRead` (boolean, Optional):
    When set to `true`, the operation uses strongly consistent reads.
    _Default is `false`._

  - `parallelRetrieval` (Object, Optional):
    Allows parallel scans across different segments of the table.
    Use this to speed up scanning by dividing the workload across multiple workers.
    You can specify the following properties:
    - `segment` (number): The zero-based segment index to scan.
    - `total` (number): The total number of parallel scans to run.

  - `index` (string, Optional):
    The Local or Global Secondary Index to be scanned.

##### Return Value

Returns a `Promise` that resolves to an array of `Entity[]`, containing all items retrieved from the table.

##### Key Differences from `list`

The `listAll` method differs from the `list` method in the following ways:

- It automatically handles pagination by performing multiple scan operations until all items are retrieved.
- The `paginationToken` and `limit` options are not available in `listAll` as it retrieves all items in one go.

##### Example Usage

```ts
interface Product {
  productId: string;
  name: string;
  price: number;
  category: string;
}

// all electronics products
const allProducts = await dynamoDB.listAll<Product>('Products', {
  propertiesToGet: ['productId', 'name', 'price'],

  filters: {
    category: 'electronics',
  },
});
```

### query

The `query` method allows you to retrieve items from a DynamoDB table by querying using the partition key and (optionally) the range key. This method leverages DynamoDB's efficient querying abilities and supports further filtering and pagination. It allows both local and global index querying and supports ordering and filtering of results.

##### Method Signature

```ts
interface Method {
  query<Entity = AnyObject>(params: QueryParams<Entity>): Promise<QueryResult<Entity>>;
}
```

##### Parameters

- **`Entity` (Type Parameter)**:
  The type of the entities being retrieved. This ensures that the retrieved items match the expected structure.

- **`params` (Object)**:
  An object containing the following properties for querying the DynamoDB table:

  - `table` (string):
    The name of the DynamoDB table to query.

  - `index` (string, Optional):
    The name of the Local or Global Index to be queried.

  - `partitionKey` (Object):
    The partition key condition for the query.
    Contains two properties:
    - `name` (string): The name of the partition key on your table.
    - `value` (string): The value of the partition key to query.

  - `rangeKey` (Object, Optional):
    Further enhance the query with range key conditions.
    This supports operations as:
    - `equal`
    - `lower_than`
    - `lower_or_equal_than`
    - `bigger_than`
    - `bigger_or_equal_than`
    - `begins_with`
    - `between`

    RangeKey Configuration comes in two forms:
    - `BasicRangeKeyConfig`: For single condition operations (`equal`, `lower_than`, etc.).
    - `BetweenRangeKeyConfig`: For a `between` operation, providing both `low` and `high` values.

  - `retrieveOrder` (string, Optional):
    Specifies the order of the results.
    By default, DynamoDB retrieves items in `ASC` order. You can set this to `ASC` or `DESC`.

  - `paginationToken` (string, Optional):
    A token from a previous query result to continue retrieving items. Useful for paginated queries.

  - `limit` (number, Optional):
    The maximum number of items to retrieve in this query operation. This has higher precedence than `fullRetrieval`
    Note: If set, fewer items might be retrieved due to DynamoDB's item size limitations.

  - `fullRetrieval` (boolean, Optional):
    When set to `true`, the query will continue retrieving all items matching the partition key, even if multiple requests are needed.
    _Default is `true`._

  - `filters` (Object, Optional):
    Additional filtering conditions to apply on the items returned.
    You can use three different syntaxes for defining filters:
    1. `key:value`- Filters for equality (e.g., `status: 'active'`).
    2. `key:value[]`- Filters for any of the provided values (e.g., `status: ['active', 'inactive']`).
    3. `key:{<FilterConfig>}`- More complex filters using a filter configuration.

##### Return Value

Returns a `Promise` that resolves to a `QueryResult<Entity>` object containing the following:

- **`items` (Array<Entity>)**:
  An array of items matching the query.

- **`paginationToken` (string?)**:
  A token that can be used for paginated queries to continue retrieving items. This is an abstraction of DynamoDB's `LastEvaluatedKey`.

##### Example Usage

```ts
  interface Order {
    orderId: string;
    customerId: string;
    status: string;
    totalAmount: number;
  }

  const { items, paginationToken } = await provider.query<Order>({
    table: 'Orders',

    partitionKey: {
      name: 'customerId',
      value: '12345',
    },

    rangeKey: {
      name: 'orderId',
      operation: 'bigger_or_equal_than',
      value: 'A100',
    },

    retrieveOrder: 'DESC',

    limit: 10,

    filters: {
      status: 'shipped',
    },
  });
```

### `executeTransaction` Method

#### Description

The `executeTransaction` method allows you to perform multiple DynamoDB operations (such as creating, updating, deleting, or conditionally validating items) as a single transaction. It ensures that all operations either succeed or fail as a group, maintaining DynamoDB's ACID (Atomicity, Consistency, Isolation, Durability) properties. Its a wrap under `TransactWrite`

#### Method Signature

```ts
interface Method {
  executeTransaction(configs: (TransactionConfig | null)[]): Promise<void>;
}
```

#### Parameters

- **`configs` (Array<TransactionConfig | null>)**:
  An array of configuration objects, where each object defines a transaction operation. You null to easily create inline conditions while generating the params

  *Important: The limit of valid configs inside a transaction is 100 (or 4MB total), as per [dynamodb doc](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html)*

  Each item in the array can be one of the following transaction types:

  - **`UpdateTransaction`**
    Represents an update operation.
    Fields:
    - **`update` (UpdateParams)**: Parameters for the update operation.

  - **`CreateTransaction`**
    Represents a create (put item) operation.
    Fields:
    - **`create` (CreateItemParams)**: Parameters for the creation operation.

  - **`DeleteTransaction`**
    Represents a delete operation.
    Fields:
    - **`erase` (DeleteItemParams)**: Parameters for the deletion operation.

  - **`ConditionCheckTransaction`**
    Represents a condition check operation. This operation validates certain conditions before allowing other transactions to proceed.
    Fields:
    - **`validate` (ValidateTransactParams)**: Parameters for the condition check operation.


#### Example Usage

This example executes a fairly complex operation of updating an order to complete status, while deleting its related Card, creating a finilized ClientOrder while also validating that specific Client exists

The usage of this specific use case can be discussed, but it clearly represents the abilities of the method with ease.

```ts
await dynamoDB.executeTransaction([
  {
    update: {
      table: 'Orders',
      key: { orderId: 'A100' },
      values: { status: 'completed' },
      conditions: [
        {
          property: 'status'
          operation: 'equal',
          value: 'pending',
        }
      ],
    },
  },
  {
    erase: {
      table: 'Carts',
      key: { cardId: 'C100' },
    },
  },
  {
    create: {
      table: 'ClientOrders',
      item: {
        orderId: 'A100',
        customerId: '12345',
        status: 'completed',
        totalAmount: 100,
      },
    },
  },
  {
    validate: {
      table: 'Client',

      key: { id: '12345' },

      conditions: [
        {
          operation: 'exists',
          property: 'id'
        }
      ],
    },
  },
]);
```

### Helper methods

Aside from the methods that execute an action on dynamoDB, the provider exposes 2 helper methods to interact with the actions

- [createSet](#create-set)
- [generateTransactionConfigList](#generate-transaction-config-list)

### create set

Depending on the sdk version, referencing a set to be created on DynamoDB. To get around this and ensure a normalized usage, you can use the `createSet` method:

```ts
await provider.create({
  table:  'table-name',

  item: {
    id: '111',
    // ...props
    someSetProp: provider.createSet([1, 2, 10, 40]),

    statuses: provider.createSet(['done', 'archived'])
  }
})
```

### generate transaction config list

A type helper to generate transaction params referenced to an entity

```ts
interface Method {
  generateTransactionConfigList<Item>(
    items: Item[],
    generator: (item: Item) => (TransactionConfig | null)[],
  ): TransactionConfig[]
}
```

If you do not use Single Table, this is as far as you need to go to

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
- [executeTransaction](#single-table-execute-transaction)
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

Works the logic same as [executeTransaction](#execute-transaction) from the provider, the params for the create/update/delete methods can be used here to build the transaction, as well as using `validate` calls to ensure the rules of your action are being respected

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
const result = await myTable.listType({
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

- SingleTable Schema -> Partition+Entity
- RepoLike -> Collection, fromCollection, fromEntity



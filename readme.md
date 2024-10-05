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

#### get

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

- Explain SingleTable
- SingleTable Schema -> Partition+Entity
- RepoLike -> Collection, fromCollection, fromEntity



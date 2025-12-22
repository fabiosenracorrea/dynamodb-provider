# DynamoDB Provider Changelog

# v3.1.1

### Warning! Possible behavior change

- **Fix**: Index values were being automatically converted to *strings*, ignoring the `numeric: true` configuration. That meant you would have to define entities like `getRangeKey: () => [null]` and solely rely on the atomic updates to properly set the numeric value to your range key. Now the behavior is consistent with the expectation:

  - Partition Keys always get converted to strings (as per SingleTable patterns)
  - Range Keys are converted to strings **by default**; Set `numeric: true` to their configuration to have them allow numeric value only
  - If `numeric: true`, range key updates are only ever valid **if the value is a number or an array with a single number inside of it**
  - You can safely reference numeric properties from your entities to ensure it gets generated properly eg `getRangeKey: ['.score']` or `getRangeKey: ({ score }: Pick<MyEntity, 'score'>) => [score]`


# v3.1.0

- **Feature**: **Atomic Numeric Index Updates** - Safely perform atomic operations (add, subtract, sum) on numeric index range keys without worrying about `blockInternalPropUpdate` restrictions or knowing the internal column names.

Configure indexes as numeric by setting `numeric: true` in your table configuration:

```ts
const table = new SingleTable({
  // ...config
  indexes: {
    LeaderboardIndex: {
      partitionKey: 'lbPK',
      rangeKey: 'score',    // Numeric range key for leaderboard scores
      numeric: true,         // Mark as numeric for atomic operations
    },
    RankIndex: {
      partitionKey: 'rankPK',
      rangeKey: 'rank',      // Numeric range key for ranking
      numeric: true,
    },
    CategoryIndex: {
      partitionKey: 'catPK',
      rangeKey: 'category',  // Regular string index
      // numeric not set - can't use atomic operations
    },
  },
});

await table.update({
  ...updateParams,

  atomicIndexes: [
    {
      index: 'LeaderboardIndex',
      type: 'add',
      value: 500,
    },
    {
      index: 'RankIndex',
      type: 'subtract',
      value: 1,
      if: {
        operation: 'bigger_than',
        value: 0,
      },
    },
  ],
});
```

### Entity-Level Support

You can also use these on entities:

```ts
type Player = {
  id: string;
  name: string;
  score: number;
  rank: number;
};

const Player = table.schema.createEntity<Player>().as({
  type: 'PLAYER',
  getPartitionKey: ['.id'],
  getRangeKey: ['#DATA'],

  indexes: {
    // Entity-level index names (developer-friendly)
    scoreIndex: {
      index: 'LeaderboardIndex',
      getPartitionKey: ['LEADERBOARD'],
      getRangeKey: ['.score'],
    },
    rankIndex: {
      index: 'RankIndex',
      getPartitionKey: ['RANKING'],
      getRangeKey: ['.rank'],
    },
  },
});

Player.getUpdateParams({
  ...config,

  // reference the entity-specific index
  atomicIndexes: [{ index: 'scoreIndex', type: 'add', value: 1 }],
})

const playerRepo = table.schema.from(Player);

// Update using entity index names
await playerRepo.update({
  id: 'player-123',
  values: { name: 'Updated Name' },

  atomicIndexes: [
    {
      // Use entity index name, not table index name
      index: 'scoreIndex',
      type: 'add',
      value: 500,
    },
  ],
});
```

- **Internal** Entity type now has a type reference to the single configuration `__tableConfig`; Type only property.

# v3.0.0

Our biggest update yet! Lots of QOLs, 300+ more tests and more!

New documentation website [here](https://fabiosenracorrea.github.io/dynamodb-provider)

### Breaking Changes

- [**BREAKING**] *UUID*: Remove `uuid` library in favor of crypto's `randomUUID`. Min node supported version is now v16.
- [**BREAKING**] `schema.fromCollection` and `schema.fromEntity` generators removed. Use `schema.from(xxx)` for both!
- [**BREAKING**] `propertiesToGet` renamed on `list`/`listAll` methods, as `propertiesToRetrieve` is used on `get`/`batchGet` and is more descriptive.
- [**BREAKING**] Helper method `generateTransactionConfigList` renamed to `toTransactionParams`
- [**BREAKING**] `executeTransaction` removed. Use the `transaction` method instead
- [**BREAKING**] `query` / `schema.from(ENTITY).query.custom()` / `schema.from(ENTITY).queryIndex.custom()` **no longer fully retrieves the data by default**. This means you should pass in `fullRetrieval: true` to them to keep the same behavior or use the new queryAll options.

- [**BREAKING - Types**] Renamed for better clarity:
  - `ExtendableCollection` type renamed to `AnyCollection`
  - `ExtendableSingleTableEntity` type renamed to `AnyEntity`
  - `TransactionConfig` type renamed to `TransactionParams`
  - `SingleTableTransactionConfig` type renamed to `SingleTableTransactionParams`
  - `CreateItemParams` type renamed to `CreateParams`
  - `DeleteItemParams` type renamed to `DeleteParams`
  - `SingleTableCreateItemParams` type renamed to `SingleTableCreateParams`

### Features

- **Feature**: Direct `collection` creation from `partition.collection()`
- **Feature**: New entity helper types:  `GetEntityParams`, `UpdateEntityParams`, `CreateEntityParams` - easily reference the required params doing `Helper<typeof entity>`
- **Feature**: `propertiesToRetrieve` added to query methods
- **Feature**: `schema.from(xxx).update()` now property infers return type if `returnUpdatedProperties` is true.

- **Feature**: Enable `includeTypeOnEveryUpdate` on your entity definition to automatically include the type value on every update operation. Especially useful if you have an entity you solely perform updates

- **Feature**: Entities' **Range Queries** now support definitions with only the operation provided. Required params will be the default for its respective operation

```ts
const entity = table.schema.createEntity<{ name: string, id: string }>().as({
  getPartitionKey: ['FIXED_KEY'],
  getRangeKey: ['.name', '.id'],
  type: 'ENTITY',
  rangeQueries: {
    param: {
      operation: 'begins_with',
      getValues: (p: { name: string }) => ({ value: p.name }),
    },
    noParam: {
      operation: 'begins_with',
    }
  },
});

table.schema.from(entity).query.param({ name: 'Something' })

table.schema.from(entity).query.noParam({ value: 'Something' })
```

- **Feature**: New `key_prefix` range query for entities! Automatically match the valid prefixes of your range keys! It matches up until the first non constant value of your key.

```ts
const Entity = table.schema.createEntity<EntityType>().as({
  type: 'ENTITY',
  getPartitionKey: ({ id }) => ['ENTITY', id],
  getRangeKey: ({timestamp}: {timestamp: string}) => ['LOG', timestamp],

  rangeQueries: {
    allLogs: { operation: 'key_prefix' }
  }
});

// no param required! No need to repeat the 'LOG' prefix!!
// automatically queries for { begins_with: 'LOG' }
const logs = await table.schema.from(Entity).query.allLogs()
```

- **Feature**: In line with the `key_prefix` idea, Partition `toKeyPrefix` method! Extract the constant prefix from partition entries without repeating yourself. Automatically returns all constant values up to the first variable parameter.

```ts
const partition = schema.createPartition({
  name: 'USER_PARTITION',
  getPartitionKey: ({ userId }) => ['USER', userId],
  entries: {
    // All constants - returns all values
    metadata: () => ['METADATA', 'PROFILE'],

    // Constants followed by variable - returns only constants
    logs: ({ timestamp }) => ['LOG', 'ERROR', timestamp],

    // Variable first - returns empty array
    dynamic: ({ id }) => [id, 'SUFFIX'],
  },
});

partition.toKeyPrefix('metadata');  // ['METADATA', 'PROFILE']
partition.toKeyPrefix('logs');      // ['LOG', 'ERROR']
partition.toKeyPrefix('dynamic');   // []
```

- **Feature**: `autoGenerators` configuration added to `SingleTable`. Define custom value generators or override built-in ones (`UUID`, `KSUID`, `timestamp`, `count`) that can be referenced in entity `autoGen` configurations. Custom generators are shared across all entities in the table.

```ts
const table = new SingleTable({
  // ...config
  autoGenerators: {
    tenantId: () => getTenantFromContext(),

    // Override built-in generators
    UUID: () => customUUIDImplementation(),
    timestamp: () => customTime(),
  },
});

const Entity = table.schema.createEntity<EntityType>().as({
  type: 'ENTITY',
  getPartitionKey: ({ id }) => ['ENTITY', id],
  getRangeKey: () => '#DATA',

  autoGen: {
    onCreate: {
      id: 'UUID',              // Uses custom UUID implementation
      tenantId: 'tenantId',    // Uses custom generator
      createdAt: 'timestamp',  // Uses custom timestamp
      versionId: 'KSUID'       // Uses built in generator
    },
  },
});
```

- **Feature**: New query methods `queryOne` and `queryAll` for simplified query operations:
  - `queryOne` - Returns the first matching item or undefined.
  - `queryAll` - Returns all matching items as a simple array. Supports optional `limit` parameter as maximum total items to return.

```ts
// Query for first match
const user = await provider.queryOne({
  table: 'Users',
  partitionKey: { name: 'email', value: 'user@example.com' }
});

// Query for all matches
const allOrders = await provider.queryAll({
  table: 'Orders',
  partitionKey: { name: 'customerId', value: '12345' },
  limit: 100  // Optional: max total items
});

// Works with SingleTable too
const log = await table.queryOne({
  partition: ['USER', 'id'],
  range: { value: 'LOG#', operation: 'begins_with' }
});

const allLogs = await table.queryAll({
  partition: ['USER', 'id'],
  range: { value: 'LOG#', operation: 'begins_with' }
});
```

- **Feature**: Schema query methods now support `.one()` and `.all()` variants for simplified querying with entities. These methods provide a cleaner API for common query patterns:
  - `.one()` - Returns first matching item or `undefined` (no `limit` or `paginationToken` allowed)
  - `.all()` - Returns all items as array (no `paginationToken`, but accepts `limit` as max total items)

Available on all query methods: `query.custom`, range queries, `queryIndex.custom`, and index range queries.

```ts
const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }: { id: string }) => ['USER', id],
  getRangeKey: () => ['#DATA'],
  rangeQueries: {
    recent: {
      operation: 'bigger_than',
      getValues: ({ since }: { since: string }) => ({ value: since })
    }
  },
  indexes: {
    byEmail: {
      getPartitionKey: ['USER_BY_EMAIL', '.email'],
      getRangeKey: ['#DATA'],
      index: 'EmailIndex',
      rangeQueries: {
        dateRange: {
          operation: 'between',
          getValues: ({ start, end }) => ({ start, end })
        }
      }
    }
  }
});

const userRepo = table.schema.from(User);

// Query variants
const firstUser = await userRepo.query.one({ id: 'user-123' });
// Returns: User | undefined

const allUsers = await userRepo.query.all({ id: 'user-123' });
// Returns: User[]

// Range query variants
const recentItem = await userRepo.query.recent.one({ id: 'user-123', since: '2024-01-01' });
// Returns: User | undefined

const allRecent = await userRepo.query.recent.all({ id: 'user-123', since: '2024-01-01', limit: 50 });
// Returns: User[]

// Index query variants
const userByEmail = await userRepo.queryIndex.byEmail.one({ email: 'test@example.com' });
// Returns: User | undefined

const allByEmail = await userRepo.queryIndex.byEmail.all({ email: 'test@example.com' });
// Returns: User[]

// Index range query variants
const firstInRange = await userRepo.queryIndex.byEmail.dateRange.one({
  email: 'test@example.com',
  start: '2024-01-01',
  end: '2024-12-31'
});
// Returns: User | undefined

const allInRange = await userRepo.queryIndex.byEmail.dateRange.all({
  email: 'test@example.com',
  start: '2024-01-01',
  end: '2024-12-31',
  limit: 100  // Optional: max total items
});
// Returns: User[]
```

### Fixes

- **Fix**: Resolution of Entity's range queries required params. Some calls were falling into the optional param branch when it shouldn't
- **Fix**: Transaction size validation reference after null checks
- **Fix**: `schema.from(xxx).delete()` params no longer required if entity has no key params
- **Fix**: `paginationToken` on `QueryResult` was marked as required.
- **Fix**: `nested` conditions were not properly generating their `ExpressionAttributeNames` and `ExpressionAttributeValues`

### Huge Coverage increase!

- **Testing**: Type checks enabled and type tests incorporated on every test file. Previously, updates to types could easily break usages via type-check breaks. Actual runtime results were OK but one of the huge benefits of our lib was basically vulnerable to badly tested modifications. Added **300+ tests**.

# v2.1.2

- **Fix**: `.property` references on `getPartitionKey` and/or `getRangeKey` specifically when creating an entity from a partition would result in `never` instead of the proper entity

# v2.1.1

- **Fix**: DynamoDB's v3 type. Passing commands directly from `@aws-sdk/lib-dynamodb` was being rejected

# v2.1.0

- **Feature**: `schema.from`: Merge your `schema.fromEntity(xxx)` and `schema.fromCollection(yyy)` declarations! Simplified API to reduce overhead of building from your entities.

- **Feature**: `schema.transaction` and `table.transaction` methods for better readability. `executeTransaction` was unnecessarily longer. It is still available, as this is not a breaking version

### Deprecation plan:

- ~~`schema.fromEntity(xxx)` and `schema.fromCollection(yyy)`  will be removed in a future version, but will only be marked as deprecated later on. Prefer the new `from` moving forward~~. Removed on v3.

- ~~`schema.executeTransaction` and `table.executeTransaction`  will be removed in a future version, but will only be marked as deprecated later on. Prefer the new `transaction` moving forward~~. Removed on v3.

# v2.0.2

- **Infra**: `.js.map` files removed from published version

# v2.0.1

- **Infra**: Build script adjusted to properly exclude bad files/local artifacts

# v2.0.0

## Breaking changes

- **Feature**: `between` expression now accepts `start` and `end` params instead of `low` and `high`

```ts

// v1:

const expressionV1 = {
  operation: 'between',
  property: prop,


  low: 'a', // <---------------
  high: 'f', // <---------------
}

// v2:

const expressionV2 = {
  operation: 'between',
  property: prop,


  start: 'a', // <---------------
  end: 'f', // <---------------
}
```

This is an idiomatic change. We've noticed this expression was not as clear as it should have been. While you can still figure out the meaning with low/high, it did not follow common naming practices

- **Feature**: Partition `paramMatch` references are now enforced if a non entity key is found inside the partition key references.

Previously this was a valid call:

```ts
type Media = {
  id: string;

  name: string;
  description: string;

  searchTerms: string;

  fileName: string;
  contentType: string;

  s3Key: string;
};

const mediaPartition = singleTable.schema.createPartition({
  name: 'MEDIA_PARTITION',

  getPartitionKey: ({ mediaId }: { mediaId: string }) => ['MEDIA', mediaId],

  entries: {
    data: () => ['#DATA'],
    // ...other entries
  },
});

const MEDIA = mediaPartition
  .use('data')
  .create<Media>()
  .entity({
    type: 'MEDIA',
  });
```

Even though `mediaId` was not found inside our `Media` type. You kind had to pass it, otherwise every media call would need the extra `mediaId` prop and it would be injected into the actual DB data.

Now, if you create this exact declaration, you'll get yelled at, enforcing `paramMatch` is required. Furthermore, its `mediaId` property is required.

This means if you have other properties on the key references that actually exits inside `Media` they won't be required (but still accepted and adjusted accordingly)

- **Name change**: Schema `createEntity().withParams({...})` call changed to `createEntity().as({...})`

## Improvements & fixes

- **Feature**: Support for **nested expressions**! You can now build a much more complex expression that is fully type safe and properly built with the parenthesis necessary

- **Feature**: entity `getPartitionKey` and `getRangeKey` now supports both the function and array notation

When defining an entity we were obligated to create function getters every time:

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

  getRangeKey: ({ id }: Pick<Event, 'id'>) => [id],

  indexes: {
    byUser: {
      getPartitionKey: ({ userId }: Pick<Event, 'userId'>) => ['SOME_ENTITY_KEY', userId],

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

While the above declaration **remains 100% valid**, you can also pass a simplified reference for non-logic keys:

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

> **IMPORTANT**: Array referenced keys provide the auto-complete for every available property, but *accepts any string*. When resolving the `getPartitionKey` and `getRangeKey` for the entity, **we consider EVERY .dot string as an param access**. Meaning typos can lead to bad key resolvers. For the getter option, we have the added bonus of validating each parameter is actually a property of our entity. Its more boiler plate, but TS-safer.

- **Infra**: PR checks for TS/tests

## v1.1.15

- **Fix**: `in` and `not_in` expressions were not properly built
- **Fix**: `condition` on some transaction tests fixed to account for its prefix

## v1.1.14

- **Fix**: `transaction.validate` condition expression was not properly generated with the corresponding prefix

## v1.1.13

- **Feature**: `getValidationParams` added to single table entity
- **Fix**: `Validation` params now correctly expected `conditions` to be defined when created from entity
- **Fix**: `Delete` params now correctly accepts optional `conditions` when generated from entity
- **Fix**: `v.1.1.12` Equality expression definition broke some type resolutions
- **Use case tests**: Introduction of use-case tests to simulate real world use cases and catch errors like this before shipping. Will be fully implemented in an upcoming version

## v1.1.12

- **Feature**: `atomicOperations` on update calls now support an `if` param to easily reference a condition from within it

Tightly reference a condition for your operation!

If you use this, the `property` defaults to the same you are trying to operate on. You can still provide a different one if necessary

With this you can go from:

```ts
db.update({
  id: '12',

  atomicOperations: [
    {
      type: 'subtract',
      property: 'count',
      value: 1
    }
  ],

  conditions: [
    {
      operation: 'bigger_than',
      property: 'count',
      value: 0,
    }
  ]
})
```

to this:

```ts
db.update({
  id: '12',

  atomicOperations: [
    {
      type: 'subtract',
      property: 'count',
      value: 1,

      if: {
        operation: 'bigger_than',
        value: 0
      }
    }
  ],
})
```

Both of the above examples are **valid**!. You can choose what makes more sense to you.

- **Fix**: `equal` | `not_equal` operations now correctly accept boolean/null values

## v1.1.11

- **Fix**: Entity index config now correctly throws if the same index is reference multiple times.

```ts
const entity = schema.createEntity<EntityType>().withParams({
  type: 'ENTITY_TYPE',

  // ...other params

  indexes: {
    SOME_INDEX: {
      // ... key params

      index: 'IndexOne', // <---------------------
    },

    OTHER_INDEX: {
      // ... key params

      index: 'IndexOne', // <---------------------
    },
  },
});
```

## v1.1.10

- **Feature**: SingleTable config is exposed if you want to reference an index, etc

## v1.1.9

- **Fix**: `extend` Entity x Collection parser reference - safety checks added

## v1.1.8

- **Fix**: `extend` Entity x Collection retrieval. Entity parser was not being applied when retrieving the collection

## v1.1.7

- **Fix**: `extend` Entity interaction fixed. `fromEntity` creations were not passing it down properly to get it called

## v1.1.6

- **Fix**: `autoGen` was not respecting values already present on create/update values

## v1.1.5

- **Feature**: `getEntityByType` helper added to the `singleTable.schema` to facilitate dynamic entity extractions
- **Fix**: `GenericIndexMappingFns` return types were not properly defined as a `Record<string, ...>`

## v1.1.4

- **Fix**: `swapParams` typing for partition param matching when creating an entity/index fix. If we had an incomplete paramMatch before, the resulting type for the keyGetter would not be properly merged.

Quick example:

```ts
export const pProjectPartition = schema.createPartition({
  name: 'PROJECT_PARTITION',

  getPartitionKey: ({ projectId }: { projectId: string }) => ['PROJECT', projectId],

  entries: {
    comments: ({ timestamp, taskId }: { projectId: string; taskId: string }) => [
      'TASK',
      taskId,
      'COMMENT',
      timestamp,
    ],

    // ...other entries
  },
});

interface TaskComment {
  project: string;
  task: string;
  timestamp: string;

  user: string;
  id: string;
  text: string;
}

export const eTaskComment = pProjectPartition
  .use('comments')
  .create<TaskComment>()
  .entity({
    type: 'TASK_COMMENT',

    paramMatch: {
      projectId: 'project',
      taskId: 'task',
      // we do not need to match timestamp, as the prop exists on TaskComment
    },

    autoGen: {
      onCreate: {
        timestamp: 'timestamp',
        id: 'KSUID',
      },

      onUpdate: {
        updatedAt: 'timestamp',
      },
    },
  });

// before the fix: eTaskComment.getKey() params would be inferred as project/timestamp only
// now: correctly infers project/task/timestamp as the valid key params
```

## v1.1.3

- **Fix**: `IndexPartition` type for `rangeQueries` - it was typed as the parsed obj (which happens at the entity level) instead of a pass-through.
- **Fix**: Double low level transact params log on single table removed

## v1.1.2

- **Type Enhance**: Resolved entity type when `extend` is present was reworked to present some weird behavior with `Omit`

## v1.1.1

- **Fix**: Type for `ExtendableSingleTableEntity` adjusted based on new conditional `parser` property

## v1.1.0

- `Fix`: DynamoDB `v3` tests breaking due to `commands` property missing

- `Feature`: Entity can now receive an `extend` function upon creation:

  ```ts
    type tUser = {
      id: string;
      name: string;
      dob: string;
      // ... more props
    }

    const User = table.schema.createEntity<User>().withParams({
      // ...other props

      extend: ({ dob }) => ({
        age: calculateAge(dob)
      })
    })
  ```
  The example above represent a property addition, the user calculated `age`. It will be present automatically after every retrieval call from `fromEntity`. Its also applied to the `fromCollection` result.


## v1.0.6

- `Fix` entity index param generation prevented from passing an object with `{ undefined: undefined }` down

## v1.0.5

- `ejectTransactParams` method added to the `SingleTable` instance. Useful if you need to merge actions from other tables and want the proper param conversions done with the table config

## v1.0.4

- Type Enhance: `createSet` now properly infers DynamoDB version and arguments to give its result value
- **FIX** : `createSet` was referencing itself on an infinite loop

## v1.0.3

- Removed the "You must provided a type parameter" type hack from `partition.use('XX').create<T>()`. It was causing the `.entity({})` calls from it to be glitchy when the type `T` passed was a `type T = Some & Other` declaration. Future revisions might evaluate how to enforce the type param down

## v1.0.2

- `rangeKeyGenerator` type on `SingleTable.typeIndex` now correctly allows `undefined` as value. Useful for opting out the automatic generation

## v1.0.1

- New utility types exposed:

1. `ExtractTableConfig`: Get the config object from your SingleTable instance

```ts
const table = new SingleTable({
  // .. config
})

type YourConfig = ExtractTableConfig<typeof table>
```

2. `ExtendableSingleTableEntity`: Create helper types that expect an entity

```ts
import { SingleTable, ExtractTableConfig, ExtendableSingleTableEntity, FromEntity } from 'dynamodb-provider'

const table = new SingleTable({
  // .. config
})

type YourConfig = ExtractTableConfig<typeof table>

type EntityActions<Entity extends ExtendableSingleTableEntity> = FromEntity<Entity, YourConfig>
// easily reference the type of a table.schema.fromEntity(XXX) result
```

3. `ExtendableCollection`: Create helper types that expect a collection

```ts
import { SingleTable, ExtractTableConfig, ExtendableCollection, FromCollection } from 'dynamodb-provider'

const table = new SingleTable({
  // .. config
})

type YourConfig = ExtractTableConfig<typeof table>

type CollectionActions<Collection extends ExtendableCollection> = FromCollection<Entity, YourConfig>
// easily reference the type of a table.schema.fromCollection(XXX) result
```

## v1.0.0

- First version release. Stable.

## v0.0.8

- ExtendableSingleTableEntity type fix for the new transact param generators

## v0.0.7

- type of `ExtendableCRUDProps`responsible for defining `fromEntity` adjusted to new entity transact param getters

## v0.0.6

- `transact` params generation added to entity. Now you can simplify transact params creations:

```ts
await table.executeTransaction([
  {
    create: entity1.getCreationParams({...})
  },
  {
    create: entity2.getCreationParams({...})
  },
  // ...
])

// to

await table.executeTransaction([
  entity1.transactCreateParams({...}),

  entity2.transactUpdateParams({...}),

  entity3.transactDeleteParams({...}),

  entity4.transactValidadeParams({...}),
  // ...
])
```


## v0.0.5

- `blockInternalPropUpdate` configuration added to SingleTable. now by default, any update that references any internal table prop will throw. You can disable this behavior and use the `badUpdateValidation` to only block the ones you want

## v0.0.4

- some Collection, FromEntity and FromCollection types exposed

## v0.0.1

- Early release
- Documentation Incomplete

Expect a lot of updates while we push to v1.0.0 and reach stability and follow SEMVER properly.

Usage in production before than is not recommended

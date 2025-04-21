# DynamoDB Provider Changelog

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

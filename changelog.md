# DynamoDB Provider Changelog

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

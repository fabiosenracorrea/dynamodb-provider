# dynamodb-provider - SCHEMA:partitions

Define centralized partitions keys in one place

## Setup

```typescript
import { DynamodbProvider, SingleTable } from 'dynamodb-provider';
const dynamodbProvider = new DynamodbProvider({ dynamodbClient });
export const table = new SingleTable({ dynamodbProvider, ...TABLE_CONFIG });
export const { schema } = table;
```

- Validate our table config at `UPDATE_PATH_TO_TABLE_SETUP`

## Partitions

Define as: `const PARTITION = schema.createPartition({...params})`

### Available params

- `name`: Unique identifier, use a friendly name, eg `PROJECT_PARTITION`
- `getPartitionKey`: Generators for partition key.
  eg: `getPartitionKey: ({ projectId }: { projectId: string }) => ['PROJECT', projectId]`
  ALWAYS use named params: `projectId` instead of `id` -> this can be converted to match columns later (see `paramMatch` below)
- `index?` - If indexes defined on table config + this is an index partition => index name exactly as in table config.
- `entries`: Every entity for this partition: `Record<ENTRY_NAME, (params?) => [Key, Parts]>`
  RangeKey getter should follow the same practices as `getPartitionKey`

### Partition Reference

Project partition as an example:

```ts
export const PROJECT_PARTITION = schema.createPartition({
  name: 'PROJECT_PARTITION',
  getPartitionKey: ({ projectId }: { projectId: string }) => ['PROJECT', projectId],
  entries: {
    data: () => ['#DATA'],
    tasks: ({ taskId }: { taskId: string }) => ['TASK', taskId],
    subTasks: ({ taskId, subTaskId }: { taskId: string, subTaskId: string }) => ['TASK', taskId, 'SUBTASK', subTaskId],
    tags: ({ tags }: { tags: string }) => ['TAG', tags],
  },
});
```

### Using partitions

You partition has every param used available to usage, eg `partition.entries.data()`, `partition.name` etc, plus:

- `id` - internal unique identifier
- `collection(parmas)` - create a **collection** directly. basically the same params found in `./collection.md` except for `partition`, `getPartitionKey` or `index` as these are inferred automatically - if `./collection.md` not found and you need more information, request file location.
- `toKeyPrefix(entry)` - generate the key prefix of a given entry. eg `PROJECT_PARTITION.toKeyPrefix('tasks')` returns `['TASK']`

- `use(entry)` - main functionality - use your `entries` to generate entities/indexes.
  - Each entry CAN ONLY BE USED ONCE
  - Usage depends on if its a main or an index partition
  - **PARAM MATCHING** - both usages will REQUIRE a `paramMatch` config param if there's a mismatch between the defined key params and the entities params
    Format: `Record<PARTITION_PARAM, ENTITY_PROPERTY>`
    Examples:
      - PROJECT: `paramMatch: { projectId: 'id' }`
      - TASK1: `paramMatch: { taskId: 'id' }` ==> `projectId` If 'projectId' is the norm defined
      - TASK2: `paramMatch: { taskId: 'id', projectId: 'project' }` ==> If 'project' is the norm defined
    You **only need to match whats different than whats defined in the partition**. If all the params for the entity key are already the same, no `paramMatch` will be required.
  - **INDEX PARTITION**
    Format: `PROJECT_PARTITION.use('tasks').create<TASK_TYPE>().index(params?)`
    Usage: Inside an entity's index config, eg:
    ```ts
    export const Task = schema
      .createEntity<TASK_TYPE>()
      .as({
        ...params,
        indexes: {
          BY_PROJECT: PROJECT_PARTITION.use('tasks').create<TASK_TYPE>().index()
        },
      });
    ```
    Accepted params:
      - `paramMatch?` - Required/Filling logic explained above
      - `rangeQueries?` - Optional queries, same format as defined in `./entities.md`

  - **ENTITY PARTITION**
    Format: `PROJECT_PARTITION.use('tasks').create<TASK_TYPE>().entity(params?)`
    Usage:
    ```ts
    export const eDeck = PROJECT_PARTITION
      .use('data')
      .create<PROJECT_TYPE>()
      .entity({
        type: 'PROJECT_TASK',

        paramMatch: { taskId: 'id' },
      });
    ```
    Accepted params:
      - `paramMatch?` - Required/Filling logic explained above
      - Same rules as the other entity creation params defined on `./entities.md` - excluding `getPartitionKey` and `getRangeKey`

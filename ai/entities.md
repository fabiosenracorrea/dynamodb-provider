# dynamodb-provider

Type-safe DynamoDB single-table design library with zero dependencies.

## Setup

```typescript
import { DynamodbProvider, SingleTable } from 'dynamodb-provider';
const dynamodbProvider = new DynamodbProvider({ dynamodbClient });
export const table = new SingleTable({ dynamodbProvider, ...TABLE_CONFIG });
export const { schema } = table;
```

- Validate our table config at `UPDATE_PATH_TO_TABLE_SETUP`

With your table instance, there's two main ways to interact with the DB:

1. `schema.from(ENTITY)` methods
1. `table.transaction([...params])` for multi item executions

## Entities

Define as: `const ENTITY = schema.createEntity<ENTITY_TYPE>().as({...params})`

### Available params

- `type` - REQUIRED. Unique identifier for this kind
- `getPartitionKey` + `getRangeKey` - REQUIRED. Generators for the item key
  Two notations available:
    1. `getPartitionKey: ({ id }: {id: string}) => ['USER', id]`
    2. `getPartitionKey: ['USER', '.id']`
  - .dot notation autocompletes to all `ENTITY_TYPE` properties
  - Prefer dot notation unless you need to perform logic to the properties of the key eg: `getRangeKey: ({ createdAt, updatedAt }: {createdAt: string, updatedAt: string}) => [updatedAt ?? createdAt]`
  - ALWAYS type the function getter params. Only parameters accepted are `ENTITY_TYPE` compatible, no unknown property

- `rangeQueries?` - Custom query definition against the range key. Should be `Record<YOUR_CUSTOM_NAMES, { operation, getValues? }>`
  - Operations:
    - `"equal" | "lower_than" | "lower_or_equal_than" | "bigger_than" | "bigger_or_equal_than" | "begins_with"` - expect a `value` when using. Pass in `getValues({name}:{name: string}) => ({ value: name })` the required params change from the default references. (more on `schema.from(XXX).query` bellow)
    - `"between"` - expect `start` and `end` when using, optional `getValues` accepted if change necessary
    - `"key_prefix"` - No param needed. Calls `getRangeKey` with no params and leaves all valid prefixes. Eg: if key `['LOG', '.timestamp']` = prefix === `LOG`.

- `indexes?` - Only available if `tableConfig.indexes` is defined. A mapping of `Record<YOUR_CUSTOM_NAMES, { getPartitionKey, getRangeKey, index, rangeQueries? }>`
  - same key rules as above
  - `index` is one of the `tableConfig.indexes` names
  - `rangeQueries` optional custom query definitions. Same rules entities' above.
  - NOTE! If you want a numeric index, define its getRangeKey to `() => [null]` - lib currently autoconverts index values to string on creation/update

- `autoGen?` - Automatic property generations. Format: `{ onCreate?: RefObj; onUpdate?: RefObj }` where `RefObj` = `{ [Key in keyof ENTITY_TYPE]?: GENERATOR }`
  - `GENERATOR` can be: `'UUID'`, `'KSUID'`, `'timestamp'` (uses new Date().toISOString()), `'count'` (sets to 0) or inline function call `() => any`
  - It can also be all properties defined in `keyof tableConfig.autoGenerators`

- `extend?` - Add in calculated propers **after retrieval**. Eg `extend: ({ dob }) => ({ age: calculateAge(dob) })`. Any return is merged with `ENTITY_TYPE`.

### Relevant entity properties

- `type` - Reference the identifier
- `getPartitionKey`, `getRangeKey`, `getKey` - partial/full key builders
- `getCreationParams(toCreate, { expiresAt? }?)` - type safe, takes into account you `autoGen` to require exactly whats missing for `ENTITY_TYPE`. If `tableConfig.expiresAt`, takes optional 2nd param to indicate the epoch expiration.
- `getUpdateParams(params: UPDATE_PARAMS)` type safe. `UPDATE_PARAMS` consists of:
  - REQUIRED: any `getPartitionKey` AND `getRangeKey` params. Eg if `getPartitionKey: ['USER', '.id'], getRangeKey: ['#DATA']` it would be `id`
  - `values?`:  `Partial<ENTITY_TYPE>` = any property you may want to set
  - `expiresAt?`: If `tableConfig.expiresAt`, indicate the epoch expiration
  - `remove?`: `Array<keyof ENTITY_TYPE>` any property to remove
  - `returnUpdatedProperties?`: If true, everything updated will be returned as the update call.
  - `atomicOperations?`: Atomic in place operations. Format: `Operation[]`
    Available operations:
      - Math: `add | sum | subtract` - `add` treats missing value as `0`, sum/subtract require the prop to be set. Format: `{type, property: keyof ENTITY_TYPE, value: number}`
      - Set: `add_to_set | remove_from_set` - adds/removes from an set Format: `{type, property: keyof ENTITY_TYPE, values: string[] | number[]}`
      - Conditional write: `set_if_not_exists` - only modifies if property not already present. Format: `{type, property: keyof ENTITY_TYPE, value: any}`
    All operations can have an optional `if` property to add a conditional check, same format as `Condition` below. If `property` is omitted from this `if`, it goes against the same prop we are trying to update
  - `atomicIndexes?` Available if any `numeric:true` index is defined in table config.
    Same format as `atomicOperations` but swaps `property` for `index`. index's value options are your custom ENTITY indexes names that reference `numeric:true` indexes only
  - `conditions?`: Validations that may match for the update to succeed. Format: `Condition[]`
    Available conditions:
      - `'equal'| 'not_equal'| 'lower_than'| 'lower_or_equal_than'| 'bigger_than'| 'bigger_or_equal_than'| 'begins_with'| 'contains'| 'not_contains'`. Format: `{operation, property, value}`
      -  `between` - Format: `{operation, property, start, end}`
      - `in | not_in` - Format: `{operation, property, values}`
      - `exists | not_exists` - Format: `{operation, property}`
    Each condition can also have:
      - `joinAs?: 'and' | 'or'` - defaults to `and` - to indicate how the current operation **will be joined with the previous**.
      - `nested?: Condition[]` - nested conditions for that specific check
- `getValidationParams` - Build Validation operations to be used on transactions
  - REQUIRED: any `getPartitionKey` AND `getRangeKey` params.
  - `conditions: Condition[]` - validations to perform
- `transactCreateParams`, `transactUpdateParams`, `transactValidateParams` versions of their `getXXX` counterparts that produce `TransactParams` directly
  Example, these are equivalent:
  ```ts
  await table.transaction([
    { create: ENTITY.getCreationParams(params) },
    ENTITY.transactCreateParams(params)
  ])
  ```
- `transactDeleteParams` - Also transaction helper
  - REQUIRED: any `getPartitionKey` AND `getRangeKey` params.
  - `conditions?: Condition[]` - validations to perform


### Using entities

After definition, we can use entities to basically:

1. generate params to form a transaction with multiple entities, like:

```ts
await table.transaction([
  { create: PROJECT.getCreationParams(params) },
  { update: PROJECT_COUNTS.getUpdateParams(params) },
  { create: USER_LOGS.getCreationParams(params) },
  { erase: SAVED_FORMS.getKey(params) },
])
```

2. Build an "repository-like" using `schema.from(ENTITY)` - lets cover them:

### Entity Methods

- CRUD operations:
  - `create` - same **parameters** as `getCreationParams`. Return `ENTITY_TYPE`
  - `delete` - same **parameters** as `transactDeleteParams`. No return
  - `update` - same **parameters** as `getUpdateParams`. No return unless `returnUpdatedProperties:true`
  - `get` - entities `getKey` params plus:
    - `consistentRead?: boolean` - only when necessary
    - `propertiesToRetrieve?: Array<keyof ENTITY_TYPE>` - pick which to receive back. Warning: it might change the `extend` behavior
  - `batchGet` - auto handles dynamo's 100 item limit. Return `ENTITY_TYPE[]`
    -  Required: `keys: Array<KeyParams>`
    - `consistentRead?: boolean`
    - `propertiesToRetrieve?: Array<keyof ENTITY_TYPE>`
    - `maxRetries?: number` - Amount of times to retry unprocessed entres
    - `throwOnUnprocessed?: boolean` - Defaults to true - if there's still unprocessed entries, throws an error
  - LISTING METHODS - !Warning - only available if `typeIndex` is configured on the table and the index is properly created
    - `list(params?)` - Return `{ items: ENTITY_TYPE[], paginationToken?: string }`
      - `fullRetrieval?: boolean` - auto paginates
      - `paginationToken?: string` - continue from a previous listing
      - `limit?: number` - max items to get. Takes precedence over `fullRetrieval`
      - `retrieveOrder?: 'ASC' | 'DESC'` - Defaults to ASC
      - `range` - Range key narrowing, same operations and shape as `rangeQueries` params above
    - `listAll()` - No config, get it all - Return `ENTITY_TYPE[]`
  - QUERY methods
    - `query` - Object that contains 3 special methods + any defined on `rangeQueries`
      - `custom(params?)` - queries against the rangeKey. `params` is REQUIRED if there's any REQUIRED param inside `getPartitionKey` - Return `{ items: ENTITY_TYPE[], paginationToken?: string }`
        - REQUIRED: any `getPartitionKey` params.
        - Same as listing: `fullRetrieval`, `paginationToken`, `limit`, `retrieveOrder`, `range`
        - `filters?: { [Key in keyof ENTITY_TYPE]?: FilterValue }` - narrow by matching operations. Only properties that have `string | number | boolean | null | undefined` values are allowed
          `FilterValue` can be:
            - `string` | `number` | `null` | `boolean`
            - `Array<string | number | null | boolean>`
            - `Condition` (yes, same as defined above)
      - `one(params?)`
        - Same logic as `custom()`, but returns the first matched `ENTITY_TYPE`, so no `limit`, `paginationToken` or `fullRetrieval`
      - `all(params?)`
        - Same logic as `custom()`, but returns the first matched `ENTITY_TYPE[]`, so no `paginationToken` or `fullRetrieval`. `limit` is accepted.
      - Any custom `rangeQuery` defined will be available as methods here as well:
        If you have `schema.createEntity<TYPE>().as({...params, rangeQueries: { myQuery: { operation: 'begins_with' } }})`, you'll have `myQuery` method:
        - `customQuery(params?)` - Return `{ items: ENTITY_TYPE[], paginationToken?: string }`
          - REQUIRED: any `getPartitionKey` AND range operation params. in the `myQuery` example, it would be `{value: string}`
          - Other configs available: `fullRetrieval`, `paginationToken`, `limit`, `retrieveOrder`, `filter` - same rules as before
        - one/all sub methods for custom queries: Your custom queries have `one(params?)` and `all(params?)` available for them, same rules as their global versions, but applied to this range.
          Example: `schema.from(ENTITY).query.myQuery({...params})` OR `schema.from(ENTITY).query.myQuery.one({...params})`
          WATCH OUT! Theres NO `custom` methods for these queries. Call the `myQuery` directly for it.\
    - `queryIndex` - same rules as `query`, but applied to every index defined inside the entity definition
      Usage: `schema.from(ENTITY).queryIndex.INDEX_NAME.XXXX` where XXX are the exact behavior found on `query` - custom/all/one + range queries

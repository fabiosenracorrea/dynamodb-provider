# To dos

- Make expressions have sub expressions ()
- Change between params from low/high to start/end
- Make paramMatch be required for props that do not exist on entity but do on key getter
- Create a "item_exists" & "item_not_exists" conditions that merge the use of pk+sk exists/not_exists operations. Make it accept the 2 values on provider and autofill on single table
- Collection "create" method
- Allow simplified collection creation on joins - ref entity as [Entity] or Entity instead of { type: 'MULTIPLE', entity: Entity } or { type: 'SINGLE', entity: Entity }. If more config is needed (like sorter, etc), allow also { entity: [Entity], sorter: ... }
- Create a `Table` instance to allow easy extraction on multi-table scenarios
- Have a "set fields config" on entities that have string[], number[] or Set<string>/Set<number> on their typing. This config stands: auto convert to Set (good for v2, safety placeholder definition)

- Range query option to reference 'constant' values from key

eg on a partition if we have services: ({ serviceId }: StringObj<'serviceId'>) => ['SERVICE', serviceId]

use like keyRefs.services => automatically fills with ['SERVICE']

- Optional to force the "type" of a single entity to always be included in the "update" operation
```ts
{
  /**
 * By setting this to `true`, **EVERY UPDATE** from an entity will include the `type` value
 *
 * Useful if you use any logic that exclusively rely on `update` to mutate an item
 *
 * This is opt-in as will require more write capacity for every update operation
 *
 * Only the `partitionKey` here will be populated
 *
 * IMPORTANT: This has higher priority over `blockInternalPropUpdate` and `badUpdateValidation`
 */
includeTypeOnEveryUpdate?: boolean;
}
```

- add a "safeUpdate" / "safeGetUpdateParams" to entity interactions that blocks any action that results in index keys de-sync (ex: if key if status+date and you provide the status, the index won't be updated correctly)

- Study an easier way to generate partitionKeys/rangeKeys from the already known typing.

Current we have something like:

```ts
export const ENTITY = schema.createEntity<ENTITY_TYPE>().withParams({
  type: 'ENTITY__',

  getPartitionKey: () => 'ENTITY__',

  getRangeKey: ({ id }: Pick<ENTITY_TYPE, 'id'>) => [id],

  indexes: {
    byUser: {
      getPartitionKey: ({ userId }: Pick<ENTITY_TYPE, 'userId'>) => ['SOME_ENTITY_KEY', userId],

      getRangeKey: ({ timestamp }: Pick<ENTITY_TYPE, 'timestamp'>) => ['SOME_ENTITY_KEY', timestamp],

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

Even tho the typing validates if the function arguments are indeed properties of the `ENTITY_TYPE` we have, it still feel like a lot to repeat.

In one hand, its crystal clear, and allows us to do add logic to the generation (eg `({ createdAt, updatedAt }: Pick<XXX, 'createdAt' | 'updatedAt'>) => ['MY_INDEX', updatedAt || createdAt]`)
but it seems repetitive to general cases. Investigate an api that could facilitate this at least for non-logic keys

Initial thoughts would be:

```ts
export const ENTITY = schema.createEntity<ENTITY_TYPE>().withParams({
  type: 'ENTITY__',

  getPartitionKey: () => 'ENTITY__',

  getRangeKey: ['.id'],

  indexes: {
    byUser: {
      getPartitionKey: ['SOME_ENTITY_KEY', '.userId'],

      getRangeKey: ['SOME_ENTITY_KEY', '.timestamp'],

      index: 'IndexOne',
    },
  },
});
```

This would not cover logic-keys, but would easily generate type correct typed getKey fn

The dot notation is needed not for the type (we can filter for keys to type the function properly), but for the runtime code, as we would be generating this function
on the fly, and want the call to do:

```js
const generateKey = ({timestamp}) => ['SOME_ENTITY_KEY', timestamp]
```

We could try for something like

```js
const generateKey = (entity) => params.map(refKey => entity[refKey] ?? refKey)
```

But this would be not deterministic, as an entity could have a property like `status` that can be nullable/not present.
In the event of indexing by status, we would like for an entity with no status to NOT get indexed with the rest of them

Sure we can just pass in the function to account for that logic, but i do not like the implicit key value that would lead.

We could simply expand that dotted notation to account at least for simple checks like the by date index above:

```ts
export const ENTITY = schema.createEntity<ENTITY_TYPE>().withParams({
  ...props,

  getRangeKey: [
    'ENTITY_BY_TIMESTAMP',

    ['.updatedAt', '.createdAt']
  ],
});
```

But thats just not as clear, and it adds yet another level of knowledge we must have to use the library. All is a tradeoff at the end of the day.

Will test more before adding this in;

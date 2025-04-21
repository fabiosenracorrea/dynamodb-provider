# To dos

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

- use-case tests across the lib

- fix ts usages on .spec files (re-enforce ts checks properly - fix jest.config)

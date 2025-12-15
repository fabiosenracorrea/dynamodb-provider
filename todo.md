# To dos

- Create a "item_exists" & "item_not_exists" conditions that merge the use of pk+sk exists/not_exists operations. Make it accept the 2 values on provider and autofill on single table
- Collection "create" method
- Allow simplified collection creation on joins - ref entity as [Entity] or Entity instead of { type: 'MULTIPLE', entity: Entity } or { type: 'SINGLE', entity: Entity }. If more config is needed (like sorter, etc), allow also { entity: [Entity], sorter: ... }
- Have a "set fields config" on entities that have string[], number[] or `Set<string>` or `Set<number>` on their typing. This config stands: auto convert to Set (good for v2, safety placeholder definition) **and ensures we don't create an empty set, if opt-in**

- add a "safeUpdate" / "safeGetUpdateParams" to entity interactions that blocks any action that results in index keys de-sync (ex: if key if status+date and you provide the status, the index won't be updated correctly)

- add a way to validate if we should carry an index update on create/update ops

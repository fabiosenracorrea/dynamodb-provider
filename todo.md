# To dos

- Make expressions have sub expressions ()
- Change between params from low/high to start/end
- Make paramMatch be required for props that do not exist on entity but do on key getter
- Create a "item_exists" & "item_not_exists" conditions that merge the use of pk+sk exists/not_exists operations. Make it accept the 2 values on provider and autofill on single table
- Collection "create" method
- Allow simplified collection creation on joins - ref entity as [Entity] or Entity instead of { type: 'MULTIPLE', entity: Entity } or { type: 'SINGLE', entity: Entity }. If more config is needed (like sorter, etc), allow also { entity: [Entity], sorter: ... }
- Create a `Table` instance to allow easy extraction on multi-table scenarios


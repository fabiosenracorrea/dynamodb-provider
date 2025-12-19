# Configuration

Complete configuration reference for SingleTable.

## Basic Setup

```typescript
import { SingleTable } from 'dynamodb-provider';

const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'YOUR_TABLE_NAME',
  partitionKey: 'pk',
  rangeKey: 'sk'
});
```

## Required Parameters

### `dynamodbProvider`
- **Type**: `IDynamodbProvider`
- **Required**: Yes

An instance of `DynamodbProvider`.

```typescript
const provider = new DynamodbProvider({ /* ... */ });

const table = new SingleTable({
  dynamodbProvider: provider,
  // ...
});
```

### `table`
- **Type**: `string`
- **Required**: Yes

The DynamoDB table name.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  // ...
});
```

### `partitionKey`
- **Type**: `string`
- **Required**: Yes

The partition key column name in DynamoDB.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',  // Column name in DynamoDB
  // ...
});
```

### `rangeKey`
- **Type**: `string`
- **Required**: Yes

The range key column name in DynamoDB.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',  // Column name in DynamoDB
});
```

## Optional Parameters

### `keySeparator`
- **Type**: `string`
- **Default**: `#`

Separator used to join key paths.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  keySeparator: '#'  // ['USER', '123'] becomes 'USER#123'
});
```

**Examples:**

```typescript
// With default '#'
partitionKey: ['USER', id]  // → 'USER#id'
rangeKey: ['ORDER', orderId]  // → 'ORDER#orderId'

// With custom separator
keySeparator: '::'
partitionKey: ['USER', id]  // → 'USER::id'
```

### `typeIndex` {#typeindex}
- **Type**: `object`
- **Optional**

Index configuration for entity type identification. Required for `listType`, `listAllFromType`, `findTableItem`, and `filterTableItens` methods.

Treat this as your "table name" column. While we do recommend creating an Index to easily manage all your entities, you can get by configuring it just to have the column set up
on every item. It is **strongly recommended** to mark items by their type as single table's best practices.

```typescript
typeIndex: {
  partitionKey: string;         // Column name for type identifier
  rangeKey: string;             // Column name for sort key
  name: string;                 // Index name in DynamoDB
  rangeKeyGenerator?: (item, type) => string | undefined;
}
```

**Example:**

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_timestamp',
    rangeKeyGenerator: (item, type) => new Date().toISOString()
  }
});
```

**Default Range Key Generator:**

If not specified, defaults to `new Date().toISOString()`:

```typescript
// Default behavior
rangeKeyGenerator: () => new Date().toISOString()
```

**Skip Range Key:**

Return `undefined` to skip range key creation:

```typescript
rangeKeyGenerator: () => undefined
```

**Custom Range Key:**

```typescript
rangeKeyGenerator: (item, type) => {
  // Use item property as range key
  return item.createdAt || new Date().toISOString();
}
```

**Index Existence:**

The index does NOT need to exist in DynamoDB if only using the type property for filtering. The index MUST exist for query-based methods like `listType` and `listAllFromType`.

### `expiresAt`
- **Type**: `string`
- **Optional**

TTL column name if configured in DynamoDB.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  expiresAt: 'ttl'  // DynamoDB TTL column
});

// Use with create
await table.create({
  key: { partitionKey: ['SESSION', '123'], rangeKey: '#DATA' },
  item: { sessionId: '123', data: '...' },
  expiresAt: Math.floor(Date.now() / 1000) + 3600  // Expires in 1 hour
});
```

### `indexes`
- **Type**: `Record<string, { partitionKey: string; rangeKey: string; numeric?: boolean; }>`
- **Optional**

Secondary index configuration.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  indexes: {
    // Index name as defined in DynamoDB
    EmailIndex: {
      partitionKey: 'gsih1',     // GSI partition key column
      rangeKey: 'gsir1'      // GSI range key column
    },
    StatusIndex: {
      partitionKey: 'gsih2',
      rangeKey: 'gsir2'
    },
    LeaderboardIndex: {
      partitionKey: 'gsih3',
      rangeKey: 'gsir3',
      numeric: true           // Enable atomic operations on this index's range key
    }
  }
});

// Use with create
await table.create({
  key: { partitionKey: 'USER#123', rangeKey: '#DATA' },
  item: { userId: '123', name: 'John', email: 'john@example.com' },
  indexes: {
    // type safe object key
    EmailIndex: {
      partitionKey: 'john@example.com',
      rangeKey: new Date().toISOString()
    }
  }
});
```

**Numeric Indexes:**

Set `numeric: true` on an index to enable atomic operations on its range key. This allows safe atomic updates (add, subtract, sum) on numeric index range keys without worrying about `blockInternalPropUpdate` restrictions or knowing internal column names.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  indexes: {
    LeaderboardIndex: {
      partitionKey: 'lbPK',
      rangeKey: 'score',    // Numeric range key
      numeric: true,         // Enable atomic operations
    },
    RankIndex: {
      partitionKey: 'rankPK',
      rangeKey: 'rank',
      numeric: true,
    },
  },
});

await table.update({
  partitionKey: ['PLAYER', 'player-123'],
  rangeKey: '#DATA',
  values: { name: 'Updated Name' },

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

### `autoRemoveTableProperties`
- **Type**: `boolean`
- **Default**: `true`

Removes internal properties from returned items:
- Main table partition and range keys
- Type index partition and range keys
- All secondary index partition and range keys
- TTL attribute

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  autoRemoveTableProperties: true  // Default
});

// In DynamoDB:
{
  pk: 'USER#123',
  sk: '#DATA',
  userId: '123',
  name: 'John'
}

// Returned:
{
  userId: '123',
  name: 'John'
}
```

**Disable cleanup:**

```typescript
autoRemoveTableProperties: false

// Returns all properties including pk, sk, etc.
```

:::tip ⚠️ Important
**Best practices:** Items should contain all relevant properties independently without relying on key extraction. For example, if PK is `USER#id`, include an `id` property in the item. As a rule of thumb, single table columns should be low level and not relied as app-level values.
:::

### `keepTypeProperty`
- **Type**: `boolean`
- **Default**: `false`

Retains the `typeIndex` partition key column in returned items. Only applies when `autoRemoveTableProperties` is `true`. This

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  typeIndex: {
    partitionKey: '_type',
    rangeKey: '_timestamp',
    name: 'TypeIndex'
  },
  keepTypeProperty: true
});

// Returned item includes _type:
{
  _type: 'USER',
  userId: '123',
  name: 'John'
}
```

### `propertyCleanup`
- **Type**: `(item: AnyObject) => AnyObject`
- **Optional**

Custom cleanup function for returned items. Overrides `autoRemoveTableProperties` and `keepTypeProperty` when provided.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  propertyCleanup: (item) => {
    // Custom cleanup logic
    const { pk, sk, _internal, ...cleaned } = item;

    return cleaned
  }
});
```

### `blockInternalPropUpdate`
- **Type**: `boolean`
- **Default**: `true`

Blocks updates to internal properties (keys, index keys, type key, TTL). Default behavior throws error if attempted.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  blockInternalPropUpdate: true  // Default
});

// ❌ Throws error
await table.update({
  partitionKey: 'USER#123',
  rangeKey: '#DATA',
  values: {
    _type: 'NEW_VALUE'  // Error: Cannot update internal property
  }
});
```

### `badUpdateValidation`
- **Type**: `(propertiesInUpdate: Set<string>) => boolean | string`
- **Optional**

Custom validation for update operations. Receives all properties referenced in `values`, `remove`, or `atomicOperations`.

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  badUpdateValidation: (properties) => {
    // Block updates to specific properties
    if (properties.has('immutableField')) {
      return 'Cannot update immutableField';
    }

    // Check multiple properties
    const protectedFields = ['createdBy', 'createdAt', 'id'];
    for (const field of protectedFields) {
      if (properties.has(field)) {
        return `Cannot update protected field: ${field}`;
      }
    }

    return false;  // Validation passed
  }
});
```

**Return values:**
- `true` - Update is invalid (throws generic error)
- `false` - Update is valid
- `string` - Custom error message to throw

**Note:** The partition key check always runs as it violates DynamoDB rules.

### `autoGenerators` {#autogenerators}
- **Type**: `Record<string, () => any>`
- **Optional**

Define custom value generators that can be referenced in entity `autoGen` configurations.

Extends or overrides the built-in auto-generation types (`UUID`, `KSUID`, `timestamp`, `count`).

```typescript
const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',

  autoGenerators: {
    // Add custom generators
    tenantId: () => getTenantFromContext(),
    organizationId: () => getOrgFromContext(),
    requestId: () => generateRequestId(),

    // Override built-in generators
    UUID: () => customUUIDImplementation(),
    timestamp: () => new Date().toISOString(),
  }
});
```

**Built-in Generators:**
- `UUID` - Generates v4 UUID
- `KSUID` - Generates K-Sortable Unique ID
- `timestamp` - Generates ISO timestamp
- `count` - Assigns 0

**Using with Schema:**

```typescript
const User = table.schema.createEntity<UserType>().as({
  type: 'USER',
  getPartitionKey: ({ id }) => ['USER', id],
  getRangeKey: () => '#DATA',

  autoGen: {
    onCreate: {
      id: 'UUID',              // Uses built-in or custom UUID
      tenantId: 'tenantId',    // Uses custom tenantId generator
      createdAt: 'timestamp',  // Uses built-in or custom timestamp
    },
    onUpdate: {
      updatedAt: 'timestamp',
      requestId: 'requestId'
    }
  }
});
```

## Complete Example

```typescript
const table = new SingleTable({
  // Required
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',

  // Optional
  keySeparator: '#',

  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_timestamp',
    rangeKeyGenerator: () => new Date().toISOString()
  },

  expiresAt: 'ttl',

  indexes: {
    EmailIndex: {
      partitionKey: 'gsipk1',
      rangeKey: 'gsisk1'
    },
    StatusIndex: {
      partitionKey: 'gsipk2',
      rangeKey: 'gsisk2'
    }
  },

  autoRemoveTableProperties: true,
  keepTypeProperty: false,

  blockInternalPropUpdate: true,

  badUpdateValidation: (properties) => {
    const immutableFields = ['id', 'createdAt', 'createdBy'];
    for (const field of immutableFields) {
      if (properties.has(field)) {
        return `Cannot update immutable field: ${field}`;
      }
    }
    return false;
  },

  autoGenerators: {
    tenantId: () => getCurrentTenant(),
    organizationId: () => getCurrentOrganization(),
  }
});
```

## See Also

- [Provider Setup](/provider/setup) - DynamoDB Provider configuration
- [Methods](/single-table/get) - SingleTable operations
- [Schema](/schema/) - Entity modeling with autoGenerators

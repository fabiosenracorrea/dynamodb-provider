# Entities

Entities represent data types within the table with type-safe key generation and auto-property management.

## Creating Entities

### Syntax

```typescript
const User = table.schema.createEntity<UserType>().as({
  // entity parameters
});
```

The two-step invocation (`createEntity<Type>().as()`) enables proper type inference.

### Basic Example

```typescript
type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
  getRangeKey: () => '#DATA'
});
```

## Entity Parameters

### `type` (required)

Unique identifier for the entity type within the table. Throws error if duplicate types are registered.

```typescript
const User = table.schema.createEntity<User>().as({
  type: 'USER',  // Must be unique
  // ...
});
```

### `getPartitionKey` (required)

Generates partition key from entity properties.

**Type**: `(params: Partial<Entity>) => KeyValue` or array

**KeyValue**: `null | string | Array<string | number | null>`

Parameters are restricted to entity properties only.

**Function form:**

```typescript
getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id]
```

**Array form (dot notation):**

```typescript
getPartitionKey: ['USER', '.id']  // References User.id
```

### `getRangeKey` (required)

Generates range key from entity properties. Same structure as `getPartitionKey`.

```typescript
getRangeKey: () => '#DATA'  // Static value
// or
getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp
```

## Dot Notation Shorthand

Key resolvers can use array syntax with dot notation for property references:

```typescript
type Event = {
  id: string;
  timestamp: string;
  userId: string;
}

const Event = table.schema.createEntity<Event>().as({
  type: 'USER_EVENT',
  getPartitionKey: ['USER_EVENT'],
  getRangeKey: ['.id'],  // References Event.id
  indexes: {
    byUser: {
      getPartitionKey: ['EVENT_BY_USER', '.userId'],
      getRangeKey: ['.timestamp'],
      index: 'IndexOne'
    }
  }
});
```

**Dot Notation Behavior:**
- Strings starting with `.` reference entity properties
- Leading `.` is removed before property lookup (`.id` becomes `id`)
- IDE provides autocomplete for property names
- Typos cause `undefined` values in keys
- Constants without `.` remain unchanged (`'USER_EVENT'` stays `'USER_EVENT'`)

Use functions for complex key generation logic. Dot notation handles simple property references only.

## Auto-Generation {#autogen}

Auto-generate property values on create or update.

```typescript
type AutoGenParams<Entity> = {
  onCreate?: { [Key in keyof Entity]?: AutoGenOption };
  onUpdate?: { [Key in keyof Entity]?: AutoGenOption };
};
```

### Built-in Generator Types

- `'UUID'` - Generates v4 UUID
- `'KSUID'` - Generates K-Sortable Unique ID
- `'count'` - Assigns `0`
- `'timestamp'` - Generates ISO timestamp via `new Date().toISOString()`
- `() => any` - Inline custom generator function
- Custom generator keys from table's `autoGenerators` config

### Example

```typescript
const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }) => ['USER', id],
  getRangeKey: () => '#DATA',

  autoGen: {
    onCreate: {
      id: 'UUID',              // Auto-generate UUID
      createdAt: 'timestamp',  // Auto-generate timestamp
      version: 'count',        // Set to 0
      status: () => 'active'   // Custom inline function
    },
    onUpdate: {
      updatedAt: 'timestamp'   // Update on every update
    }
  }
});

// Create user - id and createdAt auto-generated
await table.schema.from(User).create({
  name: 'John',
  email: 'john@example.com'
  // id, createdAt, version, status auto-generated
});
```

### Custom Generators

Define custom generators in table configuration:

```typescript
const table = new SingleTable({
  // ...config
  autoGenerators: {
    tenantId: () => getCurrentTenant(),
    requestId: () => generateRequestId()
  }
});

const Entity = table.schema.createEntity<EntityType>().as({
  type: 'ENTITY',
  getPartitionKey: ({ id }) => ['ENTITY', id],
  getRangeKey: () => '#DATA',

  autoGen: {
    onCreate: {
      id: 'UUID',              // Built-in
      tenantId: 'tenantId',    // Custom from table config
      requestId: 'requestId'   // Custom from table config
    }
  }
});
```

Properties with `autoGen` configured become optional in creation parameters. User-provided values always override generated ones.

## Range Queries {#range-queries}

Predefined range key queries for the entity.

```typescript
type Log = {
  timestamp: string;
  level: string;
}

const Logs = table.schema.createEntity<Log>().as({
  type: 'APP_LOGS',
  getPartitionKey: () => ['APP_LOG'],
  getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,

  rangeQueries: {
    dateSlice: {
      operation: 'between',
      getValues: ({ start, end }: { start: string; end: string }) => ({
        start,
        end
      })
    },
    since: {
      operation: 'bigger_than',
      getValues: ({ date }: { date: string }) => ({ value: date })
    }
  }
});

// Usage
const logs = await table.schema.from(Logs).query.dateSlice({
  start: '2024-01-01',
  end: '2024-01-31'
});
```

## Indexes

Secondary index definitions.

```typescript
type Log = {
  type: string;
  timestamp: string;
}

const Logs = table.schema.createEntity<Log>().as({
  type: 'APP_LOGS',
  getPartitionKey: () => ['APP_LOG'],
  getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,

  indexes: {
    byType: {
      getPartitionKey: ({ type }: Pick<Log, 'type'>) => ['APP_LOG_BY_TYPE', type],
      getRangeKey: ({ timestamp }: Pick<Log, 'timestamp'>) => timestamp,
      index: 'DynamoIndex1',  // Must match table indexes config

      rangeQueries: {
        dateRange: {
          operation: 'between',
          getValues: ({ start, end }) => ({ start, end })
        }
      }
    }
  }
});

// Query index
const errorLogs = await table.schema.from(Logs).queryIndex.byType({
  type: 'ERROR'
});
```

**Index parameters:**
- `getPartitionKey` - Partition key resolver (function or array)
- `getRangeKey` - Range key resolver (function or array)
- `index` - Table index name matching `indexes` configuration
- `rangeQueries` (optional) - Predefined queries for this index

## Extend

Adds or modifies properties on retrieved items.

```typescript
type User = {
  id: string;
  name: string;
  dob: string;
}

const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
  getRangeKey: () => '#DATA',

  extend: ({ dob }) => ({
    age: calculateAge(dob),
    isAdult: calculateAge(dob) >= 18
  })
});

const user = await table.schema.from(User).get({ id: '123' });
// user now has: { id, name, dob, age, isAdult }
```

Applied automatically to all retrieval operations via `schema.from()`.

## includeTypeOnEveryUpdate

Automatically includes the entity's `type` value on every update operation.

```typescript
const User = table.schema.createEntity<User>().as({
  type: 'USER',
  getPartitionKey: ({ id }) => ['USER', id],
  getRangeKey: () => '#DATA',
  includeTypeOnEveryUpdate: true  // Auto-include type on updates
});

// Type will be automatically included
await table.schema.from(User).update({
  id: 'user-123',
  values: { name: 'John' }
  // type: 'USER' automatically added
});
```

Or pass explicitly on each update:

```typescript
await table.schema.from(User).update({
  id: 'user-123',
  values: { name: 'John' },
  includeTypeOnEveryUpdate: true
});
```

**Note:** This only populates the `typeIndex.partitionKey` column. The `typeIndex.rangeKey` is not affected.

## Helper Methods

Entities expose helper methods:

### `getKey(params)`

Generates key reference from parameters required by `getPartitionKey` and `getRangeKey`.

```typescript
const key = User.getKey({ id: '123' });
// Returns: { partitionKey: 'USER#123', rangeKey: '#DATA' }
```

### `getCreationParams(item, options?)`

Generates parameters for single table create. Optional `expiresAt` parameter if table has TTL configured.

```typescript
const params = User.getCreationParams({
  id: '123',
  name: 'John',
  email: 'john@example.com'
});
```

### `getUpdateParams(params)`

Generates parameters for single table update. Requires key parameters plus update operations.

```typescript
const params = User.getUpdateParams({
  id: '123',
  values: { name: 'Jane' }
});
```

### Transaction Builders

- `transactCreateParams` - Returns `{ create: {...} }`
- `transactUpdateParams` - Returns `{ update: {...} }`
- `transactDeleteParams` - Returns `{ erase: {...} }`
- `transactValidateParams` - Returns `{ validate: {...} }`

```typescript
const configs = [
  User.transactCreateParams({ id: '123', name: 'John' }),
  Order.transactUpdateParams({ id: 'O1', values: { status: 'completed' } })
];

await table.transaction(configs);
```

## Using schema.from()

Creates a repository interface for entity operations:

```typescript
const userRepo = table.schema.from(User);

// CRUD operations
await userRepo.create({ name: 'John', email: 'john@example.com' });
await userRepo.update({ id: '123', values: { name: 'Jane' } });
await userRepo.delete({ id: '123' });
const user = await userRepo.get({ id: '123' });
const users = await userRepo.batchGet({ keys: [{ id: '1' }, { id: '2' }] });

// List operations (requires typeIndex)
const allUsers = await userRepo.listAll();
const { items, paginationToken } = await userRepo.list({ limit: 100 });

// Query operations
const { items } = await userRepo.query.custom({ limit: 10 });
```

## Query Methods

`query` and `queryIndex` expose `custom` method plus any defined `rangeQueries`. Each range query method supports three invocation styles:

### Default Call

Returns `QueryResult<Entity>` with pagination support:

```typescript
const { items, paginationToken } = await table.schema.from(Logs).query.custom({
  limit: 10,
  retrieveOrder: 'DESC'
});
```

### `.one()`

Returns first matching item or `undefined`:

```typescript
const firstLog = await table.schema.from(Logs).query.one();
// Returns: Log | undefined

const recentError = await table.schema.from(Logs).query.recent.one({
  since: '2024-01-01'
});
```

### `.all()`

Returns all matching items as array:

```typescript
const allLogs = await table.schema.from(Logs).query.all();
// Returns: Log[]

const allRecent = await table.schema.from(Logs).query.recent.all({
  since: '2024-01-01',
  limit: 100  // Optional: max total items
});
```

## Complete Example

```typescript
type User = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

const User = table.schema.createEntity<User>().as({
  type: 'USER',

  // Key resolvers
  getPartitionKey: ({ id }: Pick<User, 'id'>) => ['USER', id],
  getRangeKey: () => '#DATA',

  // Auto-generation
  autoGen: {
    onCreate: {
      id: 'UUID',
      createdAt: 'timestamp',
      status: () => 'active'
    },
    onUpdate: {
      updatedAt: 'timestamp'
    }
  },

  // Range queries
  rangeQueries: {
    byStatus: {
      operation: 'equal',
      getValues: ({ status }: { status: string }) => ({ value: status })
    }
  },

  // Indexes
  indexes: {
    byEmail: {
      getPartitionKey: ({ email }: Pick<User, 'email'>) => ['EMAIL', email],
      getRangeKey: ({ createdAt }: Pick<User, 'createdAt'>) => createdAt,
      index: 'EmailIndex'
    }
  },

  // Extend
  extend: (user) => ({
    displayName: `${user.name} (${user.email})`
  })
});

// Usage
const user = await table.schema.from(User).create({
  name: 'John Doe',
  email: 'john@example.com'
  // id, createdAt, status auto-generated
});

const activeUsers = await table.schema.from(User).query.byStatus.all({
  status: 'active'
});

const userByEmail = await table.schema.from(User).queryIndex.byEmail.one({
  email: 'john@example.com'
});
```

## See Also

- [Partitions](/schema/partitions) - Group entities by partition
- [Collections](/schema/collections) - Model relationships
- [Configuration](/single-table/configuration#autogenerators) - Custom generators

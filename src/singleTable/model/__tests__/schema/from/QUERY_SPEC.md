# Query .one() and .all() Methods - Test Specification

## Overview

This document specifies the expected behavior for the new `.one()` and `.all()` query methods.

## API Specification

### query.custom

```ts
// Default call - returns QueryResult with pagination
const { items, paginationToken } = await schema.from(Entity).query.custom(params?)
// Returns: { items: Entity[], paginationToken?: string }

// .one() - returns first matching item
const item = await schema.from(Entity).query.one(params?)
// Returns: Entity | undefined

// .all() - returns all items (auto-paginated)
const items = await schema.from(Entity).query.all(params?)
// Returns: Entity[]
```

### Range Queries

```ts
// With rangeQueries defined in entity
const Entity = schema.createEntity<T>().as({
  rangeQueries: {
    recent: { operation: 'bigger_than', getValues: ({ since }) => ({ value: since }) }
  }
})

// Default call
const { items } = await schema.from(Entity).query.recent({ since: '2024-01-01' })

// .one()
const item = await schema.from(Entity).query.recent.one({ since: '2024-01-01' })
// Returns: Entity | undefined

// .all()
const items = await schema.from(Entity).query.recent.all({ since: '2024-01-01' })
// Returns: Entity[]
```

### queryIndex

```ts
// Default call
const { items } = await schema.from(Entity).queryIndex.byEmail.custom({ email: 'test@example.com' })

// .one()
const item = await schema.from(Entity).queryIndex.byEmail.one({ email: 'test@example.com' })
// Returns: Entity | undefined

// .all()
const items = await schema.from(Entity).queryIndex.byEmail.all({ email: 'test@example.com' })
// Returns: Entity[]
```

### Index Range Queries

```ts
// With rangeQueries in index definition
const { items } = await schema.from(Entity).queryIndex.byEmail.dateRange({
  email: 'test@example.com',
  start: '2024-01-01',
  end: '2024-12-31'
})

// .one()
const item = await schema.from(Entity).queryIndex.byEmail.dateRange.one({
  email: 'test@example.com',
  start: '2024-01-01',
  end: '2024-12-31'
})

// .all()
const items = await schema.from(Entity).queryIndex.byEmail.dateRange.all({
  email: 'test@example.com',
  start: '2024-01-01',
  end: '2024-12-31'
})
```

## Parameter Restrictions

### Default Call
Accepts all query parameters:
- `limit`
- `paginationToken`
- `retrieveOrder`
- `filters`
- `propertiesToRetrieve`
- `range`

### .one(params?)
Accepts all params EXCEPT:
- ❌ `limit` (always uses limit: 1 internally)
- ❌ `paginationToken` (returns first match only)

### .all(params?)
Accepts all params EXCEPT:
- ❌ `paginationToken` (auto-paginates)
- ✅ `limit` (sets maximum total items to return)

## Return Types

| Method | Return Type | Description |
|--------|-------------|-------------|
| `query.custom()` | `Promise<QueryResult<Entity>>` | `{ items: Entity[], paginationToken?: string }` |
| `query.custom.one()` | `Promise<Entity \| undefined>` | First matching item or undefined |
| `query.custom.all()` | `Promise<Entity[]>` | All matching items as array |

## Implementation Delegations

- `.one()` → calls `this.methods.queryOne()`
- `.all()` → calls `this.methods.queryAll()`
- Default call → calls `this.methods.query()`

## Test Cases to Implement

Once the implementation is complete, create tests for:

### 1. query.custom
- [ ] Default call returns QueryResult
- [ ] .one() returns Entity | undefined
- [ ] .all() returns Entity[]
- [ ] .one() rejects limit parameter
- [ ] .one() rejects paginationToken parameter
- [ ] .all() rejects paginationToken parameter
- [ ] .all() accepts limit parameter

### 2. Range Queries
- [ ] rangeQuery() returns QueryResult
- [ ] rangeQuery.one() returns Entity | undefined
- [ ] rangeQuery.all() returns Entity[]
- [ ] Parameter restrictions enforced

### 3. queryIndex.custom
- [ ] Default call returns QueryResult
- [ ] .one() returns Entity | undefined
- [ ] .all() returns Entity[]
- [ ] Parameter restrictions enforced

### 4. Index Range Queries
- [ ] indexRangeQuery() returns QueryResult
- [ ] indexRangeQuery.one() returns Entity | undefined
- [ ] indexRangeQuery.all() returns Entity[]
- [ ] Parameter restrictions enforced

### 5. Optional Parameters
- [ ] .one() with no params when partition key requires none
- [ ] .all() with no params when partition key requires none
- [ ] Range queries with no params when neither partition nor range require params

### 6. Type Safety
- [ ] Return types correctly inferred
- [ ] Parameter types correctly enforced
- [ ] Invalid parameters rejected at compile time

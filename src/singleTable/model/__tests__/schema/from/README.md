# From Entity Tests

This directory contains tests for the `schema.from(Entity)` methods.

## Test Files

### Core CRUD Operations

- **`get.test.ts`** - Tests for `.get()` method
  - Partition key params (getter and key array)
  - Range key params (getter and key array)
  - Mixed key configurations
  - Config parameter forwarding
  - Return type verification
  - Extended entity support

- **`update.test.ts`** - Tests for `.update()` method
  - Update params generation
  - Type inference for return values
  - Atomic operations type checking
  - ExpiresAt parameter availability

### Planned Test Files

The following test files should be created following the same pattern:

- **`batchGet.test.ts`** - Tests for `.batchGet()` method
- **`delete.test.ts`** - Tests for `.delete()` method
- **`create.test.ts`** - Tests for `.create()` method

### Query Tests

Query method tests are currently specified in documentation files due to ongoing implementation:

- **`QUERY_SPEC.md`** - Specification for `.one()` and `.all()` query methods
- **`IMPLEMENTATION_GUIDE.md`** - Implementation guide for query methods

Once the query implementation is complete, create:
- **`query.test.ts`** - Tests for `query.custom()`, `query.custom.one()`, `query.custom.all()`
- **`queryIndex.test.ts`** - Tests for index queries with `.one()` and `.all()`

## Helpers

**`helpers.ts`** - Shared test utilities
- `User` interface - Standard test entity type
- `baseParams` - Default table configuration
- `paramsFor()` - Mock provider creation helper
- `keyFor()` - Key generation helper for assertions

## Test Pattern

Each test file follows this structure:

```ts
import { SingleTableFromEntityMethods } from '../../../from/fromEntity/methods';
import { SingleTableSchema } from '../../../schema';
import { baseParams, paramsFor, User } from './helpers';

describe('single table - from entity - [method]', () => {
  it('should test specific behavior', async () => {
    const params = paramsFor('[method]');
    const schema = new SingleTableSchema(baseParams);

    const entity = schema.createEntity<User>().as({
      type: 'USER',
      getPartitionKey: ({ id }) => ['USER', id],
      getRangeKey: () => ['#DATA'],
    });

    const instance = new SingleTableFromEntityMethods(entity, params);

    // Test the method
    await instance.buildMethods().[method](...);

    // Assertions
    expect(params.dynamodbProvider.[method]).toHaveBeenCalledWith({
      // expected params
    });
  });

  it('[TYPES] should verify type behavior', () => {
    // Type-level tests using ts-expect-error
  });
});
```

## Note on Current State

Some tests may not compile due to ongoing type system changes in the query methods. These tests are still valid and will work once the runtime implementation is updated to match the new type signatures. See `IMPLEMENTATION_GUIDE.md` for details on completing the implementation.

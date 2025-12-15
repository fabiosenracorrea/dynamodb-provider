# create

Creates an item in the table.

::: tip
DynamoDB's PutItem overwrites existing items—use `conditions` to prevent this.
:::

## Method Signature

```typescript
create<Entity>(params: CreateParams<Entity>): Promise<Entity>
```

## Parameters

### `table` (required)
- **Type**: `string`
- Table name

### `item` (required)
- **Type**: `Entity`
- Item to create (must include primary key)

### `conditions` (optional)
- **Type**: `ItemExpression[]`
- Conditions that must be met before creating

## Return Value

Returns the created item.

## Basic Example

```typescript
const user = await provider.create({
  table: 'Users',
  item: {
    userId: '12345',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  conditions: [
    { operation: 'not_exists', property: 'userId' }
  ],
});
```

## Preventing Overwrites

By default, `create` will overwrite existing items. Use conditions to prevent this:

```typescript
// Single key table
await provider.create({
  table: 'Users',
  item: { userId: '12345', name: 'John' },
  conditions: [
    { operation: 'not_exists', property: 'userId' }
  ]
});
```

For composite keys, check both:

```typescript
// Composite key table
await provider.create({
  table: 'OrderItems',
  item: { orderId: 'A1', itemId: 'B2', qty: 5 },
  conditions: [
    { operation: 'not_exists', property: 'orderId' },
    { operation: 'not_exists', property: 'itemId' }
  ]
});
```

## Condition Operations {#conditions}

All available condition operations:

### Comparison Operations

- **`equal`** - Property equals value
- **`not_equal`** - Property does not equal value
- **`lower_than`** - Property is less than value
- **`lower_or_equal_than`** - Property is less than or equal to value
- **`bigger_than`** - Property is greater than value
- **`bigger_or_equal_than`** - Property is greater than or equal to value

### String Operations

- **`begins_with`** - String property starts with value
- **`contains`** - Property contains value
- **`not_contains`** - Property does not contain value
- **`between`** - Property value is between start and end

### List Operations

- **`in`** - Property value is in list
- **`not_in`** - Property value is not in list

### Existence Operations

- **`exists`** - Property exists on the item
- **`not_exists`** - Property does not exist on the item

## Condition Structure

```typescript
{
  property: string;                  // Property name to check
  operation: ExpressionOperation;    // Operation type
  value?: string | number;           // For basic operations
  values?: (string | number)[];      // For 'in', 'not_in'
  start?: string | number;           // For 'between'
  end?: string | number;             // For 'between'
  joinAs?: 'and' | 'or';            // Default: 'and'
  nested?: ItemExpression[];         // For parenthesized expressions
}
```

## Condition Examples

### Basic Conditions

```typescript
// Ensure item doesn't exist
{ operation: 'not_exists', property: 'userId' }

// Check property value
{ operation: 'equal', property: 'status', value: 'active' }

// Range check
{ operation: 'bigger_than', property: 'age', value: 18 }

// String operation
{ operation: 'begins_with', property: 'email', value: 'admin@' }
```

### Multiple Conditions

Combine conditions with `joinAs`:

```typescript
conditions: [
  { operation: 'not_exists', property: 'userId' },
  { operation: 'equal', property: 'status', value: 'active', joinAs: 'or' },
  { operation: 'bigger_than', property: 'credits', value: 0 }
]
// Generates: (userId does not exist AND (status = 'active' OR credits > 0))
```

### IN and BETWEEN Operations

```typescript
// IN operation
{
  operation: 'in',
  property: 'status',
  values: ['active', 'pending', 'approved']
}

// BETWEEN operation
{
  operation: 'between',
  property: 'age',
  start: 18,
  end: 65
}
```

## Nested Conditions {#nested-conditions}

Use `nested` for complex parenthesized conditions:

```typescript
conditions: [
  {
    property: 'status',
    operation: 'equal',
    value: 'active',
    nested: [
      { property: 'price', operation: 'lower_than', value: 100, joinAs: 'or' },
      { property: 'featured', operation: 'equal', value: true }
    ]
  }
]
// Generates: (status = 'active' AND (price < 100 OR featured = true))
```

More complex nesting:

```typescript
conditions: [
  {
    property: 'status',
    operation: 'equal',
    value: 'published',
    nested: [
      {
        property: 'category',
        operation: 'equal',
        value: 'electronics',
        joinAs: 'or',
        nested: [
          { property: 'inStock', operation: 'equal', value: true },
          { property: 'preorder', operation: 'equal', value: true, joinAs: 'or' }
        ]
      },
      { property: 'featured', operation: 'equal', value: true, joinAs: 'or' }
    ]
  }
]
// Generates: (status = 'published' AND ((category = 'electronics' AND (inStock = true OR preorder = true)) OR featured = true))
```

## Conditional Create Examples

### Prevent Duplicate Emails

```typescript
await provider.create({
  table: 'Users',
  item: {
    userId: generateId(),
    email: 'john@example.com',
    name: 'John'
  },
  conditions: [
    { operation: 'not_exists', property: 'email' }
  ]
});
// Throws error if email already exists
```

### Create with Business Rules

```typescript
await provider.create({
  table: 'Products',
  item: {
    productId: 'P123',
    name: 'Widget',
    price: 99.99,
    category: 'electronics'
  },
  conditions: [
    { operation: 'not_exists', property: 'productId' },
    {
      operation: 'in',
      property: 'category',
      values: ['electronics', 'appliances', 'tools']
    }
  ]
});
```

## Error Handling

When a condition fails, DynamoDB throws a `ConditionalCheckFailedException`:

```typescript
try {
  await provider.create({
    table: 'Users',
    item: { userId: '12345', name: 'John' },
    conditions: [{ operation: 'not_exists', property: 'userId' }]
  });
} catch (error) {
  if (error.name === 'ConditionalCheckFailedException') {
    console.log('User already exists');
  }
}
```

## See Also

- [update](/provider/update) - Update items with conditions
- [delete](/provider/delete) - Delete items with conditions
- [transaction](/provider/transaction) - Atomic multi-item operations with conditions

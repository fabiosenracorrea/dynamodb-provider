# DynamoDB Provider Playground

A development tool for interacting with your DynamoDB tables configured with `dynamodb-provider`.

## Installation

```bash
npm install -D dynamodb-provider-playground
```

## Quick Start

1. Create a `playground.config.ts` file in your project root:

```typescript
import { table, dynamodbProvider } from './src/db'
import { User, Product, Order } from './src/entities'
import { userWithOrders } from './src/collections'

export default {
  table,
  dynamodbProvider,
  entities: { User, Product, Order },
  collections: { userWithOrders },  // optional
  port: 3030,  // optional, default: 3030
}
```

`dynamodbProvider` is the same instance you passed to `new SingleTable({ dynamodbProvider })`.
`SingleTable` drops it from its public `config`, so the playground can't read it back off your
table — it needs its own reference to scan the table, look items up by raw key, and check that
the connection works.

2. Run the playground:

```bash
npx dynamodb-playground
```

3. Open your browser at `http://localhost:3030`

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `table` | `SingleTable` | Yes | Your SingleTable instance |
| `dynamodbProvider` | `DynamodbProvider` | Yes | The provider you built that table with |
| `entities` | `Entity[]` \| `Record<string, Entity>` | Yes | Entities to interact with, as an array or an object of named exports |
| `collections` | `Record<string, Collection>` | No | Named exports of your collections |
| `port` | `number` | No | Server port (default: 3030) |
| `autoOpen` | `boolean` | No | Specifies if we should automatically open the playground on the browser |
| `enableMutations` | `{ create?, update?, delete?: boolean }` | No | Enable write operations (all off by default) |


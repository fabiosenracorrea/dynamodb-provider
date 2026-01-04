# DynamoDB Provider Playground

A development tool for interacting with your DynamoDB tables configured with `dynamodb-provider`.

## Installation

```bash
npm install -D dynamodb-provider-playground
```

## Quick Start

1. Create a `playground.config.ts` file in your project root:

```typescript
import { table } from './src/db'
import { User, Product, Order } from './src/entities'
import { userWithOrders } from './src/collections'

export default {
  table,
  entities: { User, Product, Order },
  collections: { userWithOrders },  // optional
  port: 3030,  // optional, default: 3030
}
```

2. Run the playground:

```bash
npx dynamodb-playground
```

3. Open your browser at `http://localhost:3030`

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `table` | `SingleTable` | Yes | Your SingleTable instance |
| `entities` | `Entity[]` | Yes | Entities to interact with |
| `collections` | `Record<string, Collection>` | No | Named exports of your collections |
| `port` | `number` | No | Server port (default: 3030) |
| `autoOpen` | `boolean` | No | Specifies if we should automatically open the playground on the browser |
| `enableMutations` | `{ update?: boolean, delete?: boolean }` | No | Enable destructive operations |


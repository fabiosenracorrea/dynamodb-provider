# Playground

`dynamodb-provider-playground` is a local UI for exploring a single table built with this library.

Your schema already describes the table's access patterns — entity types, key builders, named range
queries, indexes, collections. The AWS console cannot see any of that; it shows one flat list of opaque
`pk`/`sk` strings. The playground reads your config and gives you the table as you designed it.

## Install

```bash
npm install -D dynamodb-provider-playground
```

## Configure

Create `playground.config.ts` in your project root:

```typescript
import { table, dynamodbProvider } from './src/db'
import { User, Product, Order } from './src/entities'
import { userWithOrders } from './src/collections'

export default {
  table,
  dynamodbProvider,
  entities: { User, Product, Order },
  collections: { userWithOrders },  // optional
  port: 3030,                        // optional, default: 3030
}
```

Then:

```bash
npx dynamodb-playground
```

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `table` | `SingleTable` | Yes | Your SingleTable instance |
| `dynamodbProvider` | `DynamodbProvider` | Yes | The provider you built that table with |
| `entities` | `Entity[]` \| `Record<string, Entity>` | Yes | Entities to interact with |
| `collections` | `Record<string, Collection>` | No | Named exports of your collections |
| `port` | `number` | No | Server port (default: 3030) |
| `autoOpen` | `boolean` | No | Open the browser on start (default: true) |
| `enableMutations` | `{ update?, delete?: boolean }` | No | Enable editing and deleting items — both off by default |

::: tip Why pass the provider separately?
It is the same instance you gave to `new SingleTable({ dynamodbProvider })`. `SingleTable` omits it from
its public `config`, so the playground cannot read it back off your table. It needs its own reference to
scan the table, fetch by literal key, and check the connection.
:::

::: warning Writes are opt-in
The playground is an exploration tool. It reads by default, and nothing mutates your data unless
`enableMutations` says so — the flags are enforced server-side, so a disabled operation is rejected even if
the UI tries to call it.

Item **creation is deliberately unsupported**: entities are TypeScript types with no runtime shape, so a
create form would have to guess an item's attributes. Editing and deleting act on an item that already
exists, so its shape is known.
:::

## What it gives you

**Table Map** — the whole schema on one page: table config, every entity with its key patterns, indexes
and declared range queries, shared partitions, collections, plus warnings derived from your config (no
`typeIndex`, an index pointing at an unconfigured GSI, a `numeric: true` index whose range key resolved to
a constant, entities confined to a single partition).

**Query by access pattern** — choose an entity, then the main table or one of *its* index names
(`ByStatus`, not `_gsi2pk`), then a declared `rangeQuery` or a custom range. Key parameters render as named
fields, so you never hand-concatenate `USER#123`.

**Real cursor pagination** — pages through DynamoDB's `paginationToken`. `fullRetrieval` remains an
explicit opt-in that auto-paginates the partition.

**Copy as code** — every run shows the equivalent call, built from the path the executor actually took:

```typescript
await table.schema.from(TASK).queryIndex.ByStatus.byDueDate({
  projectId: 'proj_42', status: 'todo', start: '2026-01-01', end: '2026-06-30', limit: 25,
})
```

**Partition browsing** — enter a partition key and see the whole item collection colour-coded by entity
type. This view reads raw items so `_pk`, `_sk` and `_type` survive `autoRemoveTableProperties`, which is
what makes a mixed-entity partition legible.

**Collections, item editing, history and shareable query links**, plus a ⌘K palette and a dark/light
toggle.

## Local DynamoDB

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

Point the client behind your provider at `http://localhost:8000`. Everything else is unchanged — the
playground only ever talks to DynamoDB through the provider you gave it.

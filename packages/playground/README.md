# DynamoDB Provider Playground

A local UI for exploring a single table built with `dynamodb-provider`.

Your schema already describes the table's access patterns — entity types, key builders, named range
queries, indexes, collections. The AWS console can't see any of that and shows you a flat soup of opaque
`pk`/`sk` strings. This reads your config and gives you the table as you designed it.

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
  port: 3030,                        // optional, default: 3030
}
```

2. Run it:

```bash
npx dynamodb-playground
```

3. Open `http://localhost:3030`.

The config is re-imported when it (or your `src`, `lib`, `entities`, `db`, `models` directories) changes,
so adding an entity shows up on save.

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `table` | `SingleTable` | Yes | Your SingleTable instance |
| `dynamodbProvider` | `DynamodbProvider` | Yes | The provider you built that table with |
| `entities` | `Entity[]` \| `Record<string, Entity>` | Yes | Entities to interact with, as an array or an object of named exports |
| `collections` | `Record<string, Collection>` | No | Named exports of your collections |
| `port` | `number` | No | Server port (default: 3030) |
| `autoOpen` | `boolean` | No | Open the browser on start (default: true) |
| `enableMutations` | `{ update?, delete?: boolean }` | No | Enable editing and deleting items — **both off by default** |

### Why `dynamodbProvider` is separate

It's the same instance you passed to `new SingleTable({ dynamodbProvider })`. `SingleTable` drops it from
its public `config`, so the playground can't read it back off your table. It needs its own reference to
scan the table, look items up by raw `pk`/`sk`, and check the connection.

### Writes are opt-in

The playground is an exploration tool: it reads by default and nothing mutates your data unless you say so.
Each flag is checked server-side, so a disabled operation is rejected with a 403 even if something in the
UI tried to call it:

```typescript
enableMutations: { update: true, delete: true }
```

Item **creation is deliberately not supported.** Entities are TypeScript types with no runtime shape, so a
create form would have to guess an item's attributes. Editing and deleting act on an item that already
exists, so its shape is known — creation has nothing to derive it from, and would invite malformed items.

## What you get

**Table Map** (`/`) — the whole schema on one page: table config, every entity with its key patterns,
indexes and declared range queries, shared partitions, collections, and warnings derived from your config
(no `typeIndex`, an index pointing at an unconfigured GSI, a `numeric` index whose range key is constant,
entities that live in a single partition).

**Query by access pattern** — pick an entity, pick the main table or one of *its* index names (`ByStatus`,
not `_gsi2pk`), then pick a declared `rangeQuery` or build a custom range. Key parameters render as named
fields; you never concatenate `USER#123` by hand.

**Cursor pagination** — results page through DynamoDB's real `paginationToken`. The count reads
"N loaded · more available" rather than pretending to know a total. `fullRetrieval` is an explicit opt-in
that auto-paginates the whole partition.

**Copy as code** — every run shows the equivalent library call and the exact params sent, built from the
path the executor actually took:

```typescript
await table.schema.from(TASK).queryIndex.ByStatus.byDueDate({
  projectId: 'proj_42', status: 'todo', start: '2026-01-01', end: '2026-06-30', limit: 25,
})
```

**Partition browsing** — enter a partition key and see the whole item collection, colour-coded by entity
type. This view reads raw items (through the provider, not `SingleTable`) so `_pk`, `_sk` and `_type`
survive `autoRemoveTableProperties` — which is what makes a mixed-entity partition legible.

**Collections** — run a declared collection get and see the joined tree.

**Item editing** — a JSON editor with a computed diff before commit, plus a full update builder covering
`values`, `remove`, atomic operations and conditions. Both respect `enableMutations`.

**History and shareable links** — every run is recorded for the session (target, item count, duration) and
re-runnable from the sidebar. Running a query also writes it into the URL, so the link reproduces it.

**⌘K** jumps to any entity, partition or collection. The theme toggle sits in the header; dark is the
default.

## Local development against dynamodb-local

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

Point your provider's client at `http://localhost:8000`. This repo's own `playground.config.ts` does that
by default and honours `PLAYGROUND_DYNAMO_ENDPOINT`; `yarn setup:local` creates a matching table with its
GSIs.

## Scripts

| Script | What it does |
|--------|--------------|
| `yarn dev` | Run the playground against `playground.config.ts` in this package |
| `yarn build` | Build the client bundle |
| `yarn check-ts` | Typecheck |
| `yarn lint` / `yarn lint:fix` | Lint (the fix variant rewrites files) |
| `yarn setup:local` | Create the demo table in dynamodb-local |

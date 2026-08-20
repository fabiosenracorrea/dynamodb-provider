# DynamoDB Provider Playground — Launch v1 Plan

## Context

`dynamodb-provider` (v3.1.1) is a type-safe DynamoDB library whose real value is the **Schema layer**:
entities, partitions, collections and named range queries. That layer is *declarative access-pattern
metadata* — something the AWS DynamoDB console fundamentally cannot have. The console shows one flat soup
of opaque `pk`/`sk` strings; the library knows that `TASK` lives at `PROJECT#{projectId} / TASK#{id}`, that
`ByStatus` is a GSI2 access pattern, and that `byDueDate` is a `between` query someone deliberately designed.

`packages/playground` is the local web UI that surfaces that. It's structurally sound and roughly 7,900
lines in — Vite dev server that imports the user's `playground.config.ts`, extracts key metadata by probing
key-getters with Proxy sentinels, and serves a React/Tailwind/shadcn SPA. The intent is right.

**But it has never talked to DynamoDB.** `src/api/execute.ts:3` pins `USE_MOCK_DATA = true`, so all 13
operation branches short-circuit into random fixtures and the real calls below each guard are unreachable.
Several code paths that *look* finished are wrong in ways the mock hides. Separately, the UI is unstyled
default shadcn: no dark mode, no overview of the schema, no keyboard affordances, no cursor pagination.

This plan takes it from "convincing prototype" to a shippable v1 tool that a DynamoDB developer would
choose over the console.

### Decisions locked for v1

| Question | Decision |
|---|---|
| UI direction | **Table Map home + dense workbench.** `/` renders the whole schema/config at a glance; clicking anything drops into a dark-first, keyboard-driven query workbench. |
| Extra scope | Create-item form, copy-as-code, query history + shareable URLs, raw table browser — **all four in v1**. |
| Partitions | **Keep heuristic grouping.** No new `partitions` config field; no user-facing config churn. |
| Library changes | **Playground only.** Anything needing core changes goes in §7 as a suggestion list. |
| Code structure | Both sides get a real restructure — see §0. One file per backend action, zod on every route, properly componentized frontend, no duplication, no filler comments. |
| Provider access | **`PlaygroundConfig` takes `dynamodbProvider` directly.** The user already constructs one to build their `SingleTable`, so it costs them one line. Reading it back off the table instance is deferred — see §7. |

---

## 0. Code organization standards

These apply to every phase, not just the restructuring ones.

### Backend

`src/api/` is currently a raw 272-line `execute.ts` switch plus an ad-hoc route table with no validation.
Restructure to one action per file, with zod at the boundary:

```
src/api/
├── index.ts                  route registry only
├── router.ts                 dispatch → zod parse → handler → response envelope
├── schemas/
│   ├── common.ts             rangeOperation, filterValue, condition, atomicOperation enums
│   ├── execute.ts            per-operation request schemas (discriminated union on `operation`)
│   └── resolveKeys.ts
├── routes/
│   ├── metadata.ts           thin
│   ├── resolveKeys.ts        thin
│   └── execute.ts            thin: validate, resolve target, delegate
├── operations/
│   ├── resolveTarget.ts      entity | collection | table → concrete handle + 404s
│   ├── entity/               get.ts batchGet.ts create.ts update.ts delete.ts list.ts query.ts
│   ├── collection/           get.ts
│   └── table/                query.ts listType.ts scan.ts getByKey.ts   (scan/getByKey use the provider)
├── metadata/                 (existing key/rangeQuery inference — keep, it's good)
└── lib/
    ├── callDescriptor.ts     copy-as-code builder (§4D)
    ├── errors.ts             PlaygroundError → typed response envelope
    └── timing.ts
```

Rules:
- **Zod validates every route.** A discriminated union on `operation` means each action file receives an
  already-narrowed, typed params object and never re-checks shapes.
- **Zod schemas are the single source of truth for shared types.** Derive with `z.infer` and delete the
  hand-maintained duplicates in `src/types.ts`; the client imports the inferred types. Add `zod` to
  `dependencies` (it runs in the consumer's process, like the rest of the CLI's deps).
- **Every action file exports one function** with the same signature shape
  (`(ctx: OperationContext, params: TParams) => Promise<TResult>`), where `OperationContext` carries
  `{ table, provider, entities, collections, metadata, enableMutations }` — built once at plugin start.
  Shared concerns — target resolution, pagination envelope, timing, the call descriptor — live in `lib/` and
  are called once by the router, not repeated per action.
- **Mutations are gated in one place**, in the router from `ctx.enableMutations`, not re-checked inside each
  of `create.ts` / `update.ts` / `delete.ts`. That also closes bug 10, since the gate stops depending on
  which UI path made the call.
- Validation failures return 400 with the zod issues; unknown targets 404; library errors 500 with the
  message. One envelope builder, one place.

### Frontend

Move from the flat `components/operations/` bucket to feature folders. Co-locate a feature's components,
hooks and state with it; promote to `components/shared/` only on second use.

```
src/client/
├── app/           App.tsx, routes.tsx, providers.tsx
├── features/
│   ├── table-map/         the new / route (§4C)
│   ├── workbench/         QueryBuilder/, ResultPane/, history/, state/
│   ├── entity/            schema view, create form
│   ├── collection/        collection get + join rendering
│   ├── partition/
│   ├── table-browser/     the /table route (§4G)
│   └── item/              ItemView + the update builder, split up
├── components/
│   ├── ui/                shadcn primitives
│   └── shared/            ResultTable, KeyDisplay, JsonView, EntityBadge, CopyButton, ThemeToggle
└── hooks/ context/ utils/ types/
```

Rules:
- **Componentize by responsibility, not by line count** — but two files are over the line where that stops
  being a judgement call: `ItemView/UpdateModal.tsx` (1,108 lines) splits into
  `ValuesSection` / `RemoveSection` / `AtomicOperationsSection` / `ConditionsSection` / `ChangesPreview`
  over a shared `useUpdateBuilder` hook, and `FiltersSheet.tsx` (378) splits its `FilterRow` and the
  operation registry out of the sheet shell.
- **One component per file when it's reused or independently meaningful; inline it when it isn't.** Don't
  create a file for a five-line presentational fragment used once in its parent.
- **De-duplicate on sight.** Known duplicates to collapse: `ListResultView` vs `CollectionListView`
  (near-verbatim), `utils/hooks.ts` vs the dead `hooks/useApi.ts`, the two Tailwind configs, and the
  key-pattern rendering repeated inline in `QueryForm`, `PartitionView` and `RangeFilter` instead of
  reusing `KeyDisplay`.
- **Comments earn their place.** Explain non-obvious *why* — the Proxy-sentinel trick in
  `metadata/entity/key.ts` deserves its comment. Delete section-divider banners, restatements of the next
  line, and the `// ============ ENTITY TYPES ============` style blocks. No comment is better than a
  comment that only repeats the identifier.

---

## 1. What the library gives us to build on

Everything below is already reachable at runtime from `PlaygroundConfig` — no library change required.

- **`entity.type`** — every item self-identifies. Enables colour-coding, entity attribution in mixed
  partition results, and `typeIndex` listings.
- **`getPartitionKey` / `getRangeKey`** — named, typed key builders. Already reverse-engineered into
  `KeyPiece[]` (`CONSTANT` | `VARIABLE`) by `src/api/metadata/entity/key.ts`. This is why we can render a
  *form* for a key instead of asking someone to hand-concatenate `USER#123`.
- **`rangeQueries`** — named, pre-declared sort-key access patterns with their operation and param names,
  recovered by `src/api/metadata/entity/rangeQueries.ts`. These are literally "the queries this app was
  designed to run"; clicking one should replace writing a `KeyConditionExpression`.
- **`indexes`** — entity-scoped index definitions with their own key builders and range queries, so the UI
  can say `ByStatus` instead of `_gsi2pk`.
- **`autoGen`** — tells us exactly which fields a create form must *not* ask for.
- **`extend`** — computed props already applied on every read path by `schema.from()`.
- **Collections** — declarative joins (`joinBy: POSITION | TYPE | fn`, nested, extractors, sorters), with
  `startRef` (root entity type), `getPartitionKey`, `index` and `join` all present at runtime.
- **Partition objects** — `schema.createPartition` spreads `...params`, so `name`, `index` and `entries`
  survive at runtime. We are *not* wiring these into config for v1, but §7 notes what it would unlock.

**The provider, passed in directly.** `SingleTable.config` is `Omit<SingleParams, 'dynamodbProvider'>`
(`src/singleTable/implementation.ts:32,35`), so the provider cannot be read back off the table instance.
v1 sidesteps that by taking it as its own config field — the user already has one in hand, since they must
construct it to build the table. `IDynamodbProvider` (`src/provider/definition.ts`) then gives us:

- **`list(tableName, options)` / `listAll(tableName, options)`** — these are scans (`_scanTable` in
  `src/provider/utils/dynamoDB/instance.ts`), with `filters`, `limit`, `index`, `paginationToken` and
  `parallelRetrieval`. This is what powers the raw table browser (§4G) and the connectivity probe (§4A).
- **`get` / `query` / `queryOne` / `queryAll` by literal key** — an entity-free escape hatch for when you
  have a raw `pk`/`sk` out of a log and just want the item.
- `target` (`'v2' | 'v3'`), useful to display in the header.

**Still out of reach:** the literal DynamoDB command. The provider builds it inside `DynamodbExecutor` and
will only `console.log` it when the *user* constructed their provider with `logCallParams: true`
(`src/provider/utils/dynamoDB/instance.ts:42`) — that's a debug print, not an API, and string-scraping
stdout is not a foundation. Copy-as-code therefore ships library-level and provider-level params; the raw
command stays a §7 suggestion.

---

## 2. Where the playground stands today

**Solid, keep:**
- Server architecture: `bin/cli.js` → `src/cli.ts` (find config, import with cache-bust, Vite `createServer`,
  watch + restart) → `src/vite-plugin.ts` (`/api/*` connect middleware) → `src/api/index.ts` route table.
- Proxy-sentinel key inference (`src/api/metadata/entity/key.ts`) — genuinely clever, works for both the
  function and dot-notation key notations.
- `MetadataContext` + react-query for metadata; the `KeyDisplay` component that colours constants vs variables.
- `UpdateModal.tsx` (1,108 lines) — a complete update-expression builder covering values / remove /
  atomic operations / conditions with AND-OR chaining. Big asset, do not rewrite.
- `FiltersSheet.tsx` — 14 filter operations mapped to the provider's shape via `buildFiltersParam`.
- `hooks/urlState.ts` — a careful 326-line URL-state hook with parse/validate/cross-validation. **Currently
  dead code.** It's exactly what the shareable-URL requirement needs.

**Missing relative to what the library can express:**
- No overview of the schema anywhere — you must click each entity one at a time.
- No create operation in the UI at all.
- No cursor pagination — `paginationToken` is dropped everywhere; the tables paginate client-side over
  whatever single response came back.
- No dark mode (`darkMode: ['class']` is configured, `dark:` variants are sprinkled through components, but
  `index.css` defines only the light `:root` block and nothing ever adds the class).
- No raw table browser, no copy-as-code, no query history, no toasts, no keyboard shortcuts.
- Partition view only appears for patterns shared by ≥2 entities, and never names the partition.

---

## 3. Confirmed bugs (all verified by reading the code)

**Blockers**

1. **Everything is mocked.** `src/api/execute.ts:3` — `const USE_MOCK_DATA = true`. Every branch returns
   `generateMockItem`/`generateMockList`; `get` randomly returns `null` 30% of the time and `batchGet`
   randomly drops 20%, which will read as flaky behaviour once real. Delete the flag and the generators.

2. **Named range queries never execute.** `QueryParams/utils.ts:31` sets `resultParams.rangeQuery = mode`,
   but `execute.ts` dispatches on the top-level `operation` field, which `QueryForm.tsx:115` always sets to
   `'query'`. The lib then receives an unknown `rangeQuery` key and silently runs an unfiltered
   `query.custom`. Fix: send the range-query name as `operation`, and drop `rangeQuery` from params.
   The same applies to `queryIndex.<index>.<rangeQuery>`.

3. **Index partition queries hit the main table.** `PartitionView/index.tsx:96-100` sends
   `target: 'table'`, `name: <indexName>`, but `executeTableOperation` (`execute.ts`) ignores `name`
   entirely and never sets `index` on `table.query`. Index partitions silently query the base table.

4. **`batchGet` is not a batch.** `execute.ts` case `'batchGet'` runs `keys.map(key => schema.get(key))` in
   parallel instead of calling `schema.batchGet({ keys })`. Loses the library's 100-item chunking,
   unprocessed-key retry and `throwOnUnprocessed`.

5. **`list` ignores its parameters.** `execute.ts` maps both `list` and `listAll` to `schema.listAll(params)`,
   so `limit`, `retrieveOrder`, `range` and pagination from `ListForm` are discarded.

**Correctness**

6. **Validation passes on empty input.** `partitionValues[v.name]?.trim() !== ''` returns `true` when the
   value is `undefined` (optional chaining short-circuits to `undefined`, and `undefined !== ''`). Present in
   `QueryForm.tsx:121-123`, `PartitionView/index.tsx:103-105`, and both checks in
   `QueryParams/utils.ts:66-74`. Should be `!!value?.trim()`.

7. **Controlled→uncontrolled input flip.** `QueryForm.tsx:95` resets `setPartitionValues({})` on target
   change while line 214 binds `value={partitionValues[variable.name]}` with no `?? ''` — React warns and
   the input detaches. (`PartitionView` line 169 does have the `?? ''`.)

8. **Key separator hardcoded.** `MetadataContext.tsx:52` joins key pattern pieces with a literal `'#'`
   instead of `table.keySeparator`. Wrong display for any table not using the default.

9. **Collection metadata leaks the object graph.** `src/api/metadata/index.ts` spreads `...collection` into
   the JSON response, which walks the whole `join` tree including nested entity objects. Project explicitly
   to `{ name, type, index, narrowBy, partitionKey, originEntityType, joins }`.

10. **JSON edit path is ungated.** `ItemView/index.tsx` inline JSON editor commits an `update` without
    checking `metadata.isUpdateEnabled` — only `UpdateItemButton`/`DeleteItemButton` check it.

11. **Two divergent Tailwind configs.** `tailwind.config.js` and the inline theme in `src/cli.ts:116-177`
    must match but don't (the inline copy maps `popover.DEFAULT` → `hsl(var(--accent))`). Extract one shared
    config object and import it in both places.

12. **`entities` type/doc mismatch.** `README.md` documents an object (`{ User, Product }`),
    `src/types.ts:15` declares `AnyEntity[]`, `playground.config.ts` passes an array, and
    `cli.ts:78-86` validates with `Object.keys`. Works by accident. Accept both, normalise to an array, and
    fix the README.

**Cleanup**

13. `OperationTabs.tsx:42-51` renders content for tabs marked `hide` (only the trigger list filters).
14. `hooks/useApi.ts` (95 lines) duplicates `utils/hooks.ts` and is unused — delete.
15. `buildRangeParams` returns `undefined` for `mode: 'none'`, relied on via spread-of-undefined. Return `{}`.
16. Committed `yarn-error.log` (102 KB) in the package dir; `.npmrc` at repo root contains a plaintext
    `npm_...` token. **Rotate that token and get it out of git history** — unrelated to the playground, but
    it ships alongside it.

---

## 4. Launch v1 — must have

### A. Make it real
Delete `USE_MOCK_DATA` and both generators. Rewrite `src/api/execute.ts` around an explicit operation
descriptor instead of the current nested switch, so client and server agree on one contract:

```ts
type ExecuteRequest = {
  target: 'entity' | 'collection' | 'table';
  name: string;                     // entity type / collection name / '' for table
  operation: 'get' | 'batchGet' | 'create' | 'update' | 'delete'
           | 'list' | 'query' | 'scan';
  index?: string;                   // entity index NAME (not the physical GSI)
  rangeQuery?: string;              // named rangeQuery on that target, if any
  params: Record<string, unknown>;
};
```
Resolution order in the entity handler: pick `schema.from(entity)`, then
`index ? repo.queryIndex[index] : repo.query`, then `rangeQuery ? node[rangeQuery] : node.custom`. Use
`schema.batchGet` for batchGet and `schema.list` (not `listAll`) unless `fullRetrieval` is set. Every
response carries `{ success, data, paginationToken?, meta: { durationMs, count, call } }` where `call` is
the copy-as-code payload (§D).

`PlaygroundConfig` gains the provider, alongside the existing `create` mutation flag from §4E:

```ts
export interface PlaygroundConfig {
  table: SingleTable<any>;
  dynamodbProvider: DynamodbProvider<any>;   // new, required
  entities: AnyEntity[] | Record<string, AnyEntity>;
  collections?: Record<string, AnyCollection>;
  port?: number;
  autoOpen?: boolean;
  enableMutations?: { create?: boolean; update?: boolean; delete?: boolean };
}
```

Typed as the exported `DynamodbProvider<any>` class rather than the `IDynamodbProvider` interface, because
that interface is exported from `src/provider/index.ts` but **not re-exported from the package root**
(`src/index.ts`) — so it isn't importable from `'dynamodb-provider'`. Same shape either way; matches how
`SingleTable<any>` is already typed in `src/types.ts`. A one-line root re-export is §7.

Required rather than optional: it makes the table browser and the connectivity probe unconditional, and v1
is unreleased so there's no migration cost. `validateConfig` in `src/cli.ts` grows a check for it with a
message pointing at the same instance they passed to `new SingleTable({ dynamodbProvider })`; `README.md`
gains it in the quick-start snippet.

Add a startup connectivity probe: on first `/api/metadata`, run
`provider.list(table.config.table, { limit: 1 })` and report connected / not-connected (with the underlying
error, and `provider.target` — v2 or v3) in the UI header, so "no items found" is never ambiguous.

### B. Cursor pagination
Thread `paginationToken` end to end: response → result view "Load more" → next request. Client-side page
slicing stays only as a view convenience over what has been fetched so far. Show
`N items loaded · more available` rather than implying a total. `fullRetrieval` remains an explicit opt-in
with a warning, since it auto-paginates the whole partition.

### C. Table Map (`/`)
The new home route, and the answer to "let the user see their overall entity structure/config".
One scrollable canvas, all read from existing metadata:

- **Table header** — table name, `partitionKey`/`rangeKey` column names, `keySeparator`, TTL attribute,
  `typeIndex` config, and every configured index with a `numeric` marker.
- **Entity rows** — one line per entity: colour dot, type, PK pattern, SK pattern (reusing `KeyDisplay`),
  then indented rows for each index (`⤷ GSI2 ByStatus …`) and a chip row of its `rangeQueries` with
  operation + params. Everything clickable straight into the workbench with that target preselected.
- **Partitions** — each detected group as `PROJECT#{id} ← PROJECT, TASK, MEMBER`.
- **Collections** — root entity + join tree.
- **Config warnings** — flag things the metadata already reveals: entity `list` unavailable because no
  `typeIndex`; a collection using `joinBy: 'POSITION'` without a real `typeIndex` index; an index key that
  inferred zero variables; `numeric: true` index whose range key resolved to a constant.

### D. Copy-as-code
Every executed operation exposes the equivalent library call, built server-side from the resolved
descriptor so it can't drift from what actually ran:

```ts
await table.schema.from(TASK).queryIndex.ByStatus.byDueDate({
  projectId: 'proj_42', status: 'todo',
  start: '2026-01-01', end: '2026-06-30', limit: 25,
})
```
Plus a raw view of the exact params object sent to the library. (The literal DynamoDB command is out of
reach — §7.)

### E. Create item form
New `Create` tab on `EntityView`, gated on a new `enableMutations.create` flag (default `false`, same shape
as update/delete). Fields come from the union of key variables + whatever properties appear in metadata;
properties covered by `autoGen.onCreate` are listed separately as "generated by the library" and not
requested. Live key preview via the existing `POST /api/resolve-keys`. Free-form JSON escape hatch for
nested values.

### F. Query history + shareable URLs
Wire the existing `hooks/urlState.ts` so target, index, range query, key values, filters, limit and order
all live in the query string — the URL becomes the shareable artifact. Session history list in the left rail
(timestamp, target, item count, duration) with one-click re-run. `sessionStorage`-backed, cleared on restart.

### G. Raw table browser (`/table`)
The escape hatch for "what is actually in there", now straightforward with the provider in hand. Three modes
in one view:

- **Scan** — `provider.list(tableName, { filters, limit, index, paginationToken })`, so it works with or
  without a `typeIndex`, over the base table or any GSI. Prominent "this is a scan" cost warning.
- **By type** — `table.listType({ type, range, filters, limit })` when `typeIndex` is configured, with an
  entity-type dropdown. Cheaper, and the common case.
- **By literal key** — paste a raw `pk` (and optional `sk`) straight from a log and fetch it, bypassing
  entity definitions entirely, via `provider.get` / `provider.query`.

All three reuse the shared `ResultTable` with cursor pagination, and attribute each row to an entity type by
matching `typeIndex.partitionKey` where one is configured — the colour-coding from §4H is what makes a mixed
scan readable.

### H. Design system + workbench shell
- **Tokens.** Complete the palette: add the `.dark` block to `src/client/index.css` (currently only `:root`
  exists), add a theme toggle persisted to `localStorage`, default to dark. Replace the hardcoded
  `.json-view` (`bg-slate-900 text-green-400`, which fights a light UI) with token-based colours and real
  JSON syntax highlighting.
- **Entity colour identity.** Deterministic hue per entity type, derived once and reused in the map, sidebar,
  result rows and partition view. This is what makes mixed-type partition results readable.
- **Layout.** Left rail (search + entities / partitions / collections + history) → top query builder →
  bottom result pane. Header shows table name, connection state, theme toggle.
- **⌘K command palette** — jump to any entity, index, collection, partition or route. `⏎` runs the current
  query; `⌘⏎` runs with full retrieval.
- **Shared result table.** `ListResultView.tsx` and `CollectionView/GetCollection/CollectionListView.tsx`
  are near-verbatim duplicates (same pagination, same `formatCellValue`). Extract one `ResultTable` with
  column pinning, per-cell expand for nested values, and entity attribution.
- **Toasts.** Add shadcn `sonner`. Mutation failures currently only `console.error`
  (`UpdateItemButton.tsx`, `DeleteItemButton.tsx`).

---

## 5. Nice to have — explicitly deferred past v1

Transaction builder (compose multi-entity `transactCreateParams`/`transactUpdateParams` and run them);
saved/named queries persisted to disk; item diff/history; export results to CSV/JSON; collection `create`;
a seed/fixture generator; multi-table or multi-profile switching; virtualised tables for very large results.

---

## 6. Sequence of work

Phases are ordered so each one leaves the app in a working state.

**Phase 0 — housekeeping + config shape** *(small)*
Add `dynamodbProvider` to `PlaygroundConfig` (`src/types.ts`), validate it in `cli.ts`, pass it through
`vite-plugin.ts` into the operation context, wire it in `playground.config.ts`, and document it in
`README.md`. Fix the `entities` array/object mismatch across the same three files (`cli.ts:78-86` validates
with `Object.keys`; normalise to an array once, at load). Delete `hooks/useApi.ts` and `yarn-error.log`,
gitignore the latter. Extract the shared Tailwind theme used by both `tailwind.config.js` and `src/cli.ts`.
Rotate the `.npmrc` token.

**Phase 1 — backend restructure + real execution** *(the launch blocker; do this before any UI work)*
Build out `src/api/` per §0: router with zod validation, schemas, one file per action, shared `lib/`.
Delete `execute.ts` and its mock generators in the process. Fix bugs 1–5 and 9 as part of the rewrite rather
than patching the old file. Response envelope gains `meta` (duration, count, call) and `paginationToken`;
`src/types.ts` shrinks to whatever isn't derivable from the zod schemas. Point the repo's own
`playground.config.ts` at a local DynamoDB so this is testable — replace
`new DynamodbProvider({ dynamoDB: {} as any })` (line 6).
*Done when:* every operation runs against dynamodb-local, named range queries visibly change results, and a
malformed request returns a 400 with zod issues instead of a 500.

**Phase 2 — correctness pass** *(small, isolated)*
Bugs 6, 7, 8, 10, 13, 15. Each is a few lines; batch them.

**Phase 3 — design system + shell + frontend restructure**
Move to the `features/` layout from §0 as the shell is rebuilt — the two are the same edit, so don't do them
twice. Land the dark tokens first (everything after is built on them), then entity colour identity, the
`ResultTable` extraction, toasts, then the workbench layout and ⌘K palette. Split `UpdateModal` and
`FiltersSheet` here, while their surroundings are already moving.

**Phase 4 — Table Map**
Build `/` per §4C from existing metadata. Rewire the sidebar and routes around it. No new server work.

**Phase 5 — pagination + history + URLs**
Cursor pagination through the result pane (§4B), then wire `urlState` into the query builder and add the
history rail (§4F). Grouped because both change the same query-state plumbing.

**Phase 6 — create form + raw table browser**
§4E and §4G. Independent of each other; either order.

**Phase 7 — copy-as-code + polish**
§4D, config warnings on the map, empty/error states, README rewrite covering local DynamoDB setup,
`enableMutations.create`, and the fact that nothing is mocked any more.

---

## 7. Suggestions for the core library

Not required for v1 — the playground works around all of these — but each would simplify it and benefit
every consumer. Worth folding into `notes/suggestions.md`.

1. **Schema introspection API.** `schema.getEntities()` / `schema.getEntityMetadata(type)` returning key
   shapes, indexes and range queries. The playground currently reconstructs this by probing key getters with
   Proxy sentinels, which has a documented failure mode: a getter that *transforms* a value
   (`({ email }) => [email.toLowerCase()]`) is misread as a CONSTANT
   (`src/api/metadata/entity/key.ts:64-73`). Already noted independently in `notes/review.md` §MISSING-4.

2. **Re-export `IDynamodbProvider` from the package root.** It's exported from `src/provider/index.ts` but
   missing from `src/index.ts`, so consumers typing a provider have to reach for the concrete
   `DynamodbProvider<any>` class instead of the interface. One line.

3. **Read the provider back off the table.** `SingleTable.config` omits `dynamodbProvider`
   (`src/singleTable/implementation.ts:32`), which is why v1 asks the user to pass it a second time. A
   read-only `table.provider` accessor would let `PlaygroundConfig` drop the field entirely. Low cost,
   purely additive.

4. **A dry-run / param-inspection path.** `logCallParams` already builds the exact DynamoDB command and
   `console.log`s it (`src/provider/utils/dynamoDB/instance.ts:42`) — the information exists, it just has no
   programmatic exit. Either an optional `onCallParams?: (action, params) => void` hook on
   `DynamoDbProviderParams` (a two-line change next to the existing `printLog` call), or
   `getQueryParams(...)`-style dry-run methods mirroring `ejectTransactParams`. Either one unlocks "show me
   the real DynamoDB request" in the playground, which is the single most useful thing it can't do today.

5. **Entity → partition back-reference.** `createPartition` returns a partition whose `use()` builds
   entities, but the resulting entity keeps no link back (`src/singleTable/model/schema.ts:167-192`). A
   `entity.partition = { name, entry }` field would let the playground show real partition names
   (`PACK_PARTITION`) and entry names (`data`, `deck`, `packDecks`) instead of heuristic pattern grouping —
   and would let it show single-entity partitions, which are invisible today.

6. **Optional runtime attribute schema.** Entities are types only, so the playground can never know an
   entity's properties before it has fetched a row — which is why the create form has to guess. An optional
   `properties: { name: 'string', age: 'number' }` declaration would unlock proper create/edit forms,
   validation and documentation generation for everyone.

7. **`table.scan`.** Already flagged in `notes/review.md` §BAD-7. Not blocking the playground any more — the
   table browser goes through `provider.list`/`listAll` — but `SingleTable` users still have to drop to the
   provider layer, losing entity parsing, to scan.

8. **Declared range-query operations at rest.** `inferRangeQueries` recovers `operation` by calling
   `fn({})` and falls back to the string `'unknown'` when that throws. Keeping the raw config on the entity
   would make this exact.

---

## 8. Verification

**Prerequisite:** a real DynamoDB to talk to. `docker run -p 8000:8000 amazon/dynamodb-local`, then create
`ProjectManagementTable` with `_pk`/`_sk`, GSI1–3 and `TypeIndex` matching `playground.config.ts`, and point
that config's `DynamodbProvider` at `endpoint: 'http://localhost:8000'`.

Per phase:

- **Phase 1** — `yarn playground:dev` (port 3456). For `TASK`: run main-table query, `ByStatus`, `ByOrder`
  (numeric GSI), and the `byDueDate` between-query; confirm each returns *different* result sets and that
  `allTasks` differs from an unfiltered query. Run `batchGet` with 120 keys and confirm one batched call
  path, not 120 gets. Query an index partition from `PartitionView` and confirm the index is actually used.
- **Phase 1 (validation)** — `POST /api/execute` with a bad operation, a missing key param, and a
  non-existent index each return 400 + zod issues; a real library failure returns 500 with its message.
- **Phase 1 (connectivity)** — stop dynamodb-local and reload: the header must report not-connected with
  the underlying error, not an empty result set. Restart it and confirm the header recovers.
- **Phase 2** — Empty the partition key input: the Run button must disable. Switch query target: no React
  controlled/uncontrolled warning in console. Set `keySeparator: '|'` in config: patterns render with `|`.
  Set `enableMutations` to `{}`: the inline JSON editor's save path must be unavailable.
- **Phase 3** — Toggle theme; check every screen in both, especially the JSON viewer and result tables.
  Confirm a mixed-type partition result is readable by colour alone.
- **Phase 4** — With the repo's own config, `/` must show all 9 entities, 3 GSIs, `typeIndex`, TTL, both
  partition groups and the `ProjectWithTasks` collection, with every element navigating correctly.
- **Phase 5** — Insert >2 pages of tasks in one partition; page through with the cursor. Copy the URL into a
  fresh tab: the query must reconstruct exactly and re-run.
- **Phase 6** — Create a `TASK` without supplying `id`/`createdAt`/`commentCount`; confirm the library's
  `autoGen` filled them and the item is retrievable by `get`. In `/table`, exercise all three modes: a scan
  over the base table and over GSI1, a `listType` listing, and a literal-key lookup using a `pk`/`sk` copied
  out of a scan row. Then comment `typeIndex` out of the config and confirm scan and literal-key still work
  while the by-type mode disappears.
- **Phase 7** — Copy-as-code snippet for a named index range query must paste into a `.ts` file and compile
  against the real entity.

**Regression gate for every phase:** `cd packages/playground && yarn check-ts`, plus `yarn lint` from the repo
root. There is no test suite in `packages/playground` today; adding one is out of scope for v1, so the
manual matrix above is the gate.

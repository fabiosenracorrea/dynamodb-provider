# DynamoDB Provider Playground — Launch v1

**Status: feature-complete for v1, pending the publish checklist in §7.**

## 1. Context

`dynamodb-provider`'s real value is its Schema layer: entities, partitions, collections and named range
queries. That layer is *declarative access-pattern metadata* — something the AWS DynamoDB console
fundamentally cannot have. The console shows one flat soup of opaque `pk`/`sk` strings; the library knows
that `TASK` lives at `PROJECT#{projectId} / TASK#{id}`, that `ByStatus` is a GSI2 access pattern, and that
`byDueDate` is a `between` query someone deliberately designed.

The playground surfaces that. When this plan started it was a convincing prototype whose every operation
was mocked (`USE_MOCK_DATA = true`), hiding four bugs in code that looked finished. It now runs against
real DynamoDB with a rebuilt, validated backend and a dark-first UI.

## 2. Scope: v1 is an exploration tool

**v1 is for understanding and querying a table you already have.** It is not a data-authoring tool.

| In | Out |
|---|---|
| Table Map — the whole schema at a glance | Create-item form |
| Query by declared access pattern (entity, index, named range query) | Raw table scan browser |
| Cursor pagination, filters, ordering | Transaction builder |
| Partition browsing, colour-coded by entity type | Seed/fixture generation |
| Collections (declared joins) | Multi-table / profile switching |
| Item view, edit and delete | |
| Copy-as-code, query history, shareable links | |

**Why creation is out.** Entities are TypeScript types with no runtime shape, so a create form would have
to guess an item's attributes. Update and delete are different in kind: they act on an item that already
exists, so its shape is known. Creation without a schema-like API to lock the entity type is asking for
malformed items. Revisit if the library grows §6.6.

**Why a scan browser is out.** Scanning is an anti-pattern on a single table, and listing by type is
already available per entity via the `List` tab (backed by `typeIndex`). A general scan browser would
mostly be a footgun.

### Locked decisions

| Question | Decision |
|---|---|
| UI direction | Table Map home + a dark-first, keyboard-driven query workbench. |
| Partitions | Client-side heuristic grouping. No `partitions` field in `PlaygroundConfig`. |
| Library changes | Playground only. Core-library ideas live in §6 as suggestions. |
| Provider access | `PlaygroundConfig` takes `dynamodbProvider` directly, since `SingleTable` omits it from its public `config`. |
| Code structure | One file per backend action, zod on every route, feature-foldered frontend, no filler comments. |

## 3. Architecture

A single Vite dev server process serves the SPA *and* hosts the API as connect middleware, so there is no
separate backend and no credential handling — the user's own `playground.config.ts` supplies a constructed
`SingleTable` and `DynamodbProvider`.

```
src/
├── cli.ts              find config → validate → Vite server → watch/restart
├── config.ts           resolvePlaygroundConfig + ConfigError
├── vite-plugin.ts      /api/* middleware, builds OperationContext once
└── api/
    ├── router.ts       dispatch → zod parse → handler → response envelope
    ├── routes/         metadata · connection · execute · resolveKeys
    ├── operations/     one file per action (entity/ collection/ table/)
    ├── schemas/        shared zod primitives
    ├── metadata/       Proxy-sentinel key + range-query inference
    └── core/           operation ctx, errors, validate, callDescriptor
                        (NOT `lib/` — the root .gitignore swallows any dir named lib)
```

```
src/client/
├── app/            Providers · Shell · App · CommandPalette · ConnectionBadge · Toaster · theme
├── features/       table-map · entity · collection · partition · item · query
├── components/     ui/ (vendored shadcn) · sidebar/ · shared/
└── context/ hooks/ types/ utils/
```

**Standing conventions.** Every action file exports one function with the same shape and receives an
already-validated params object. Cross-cutting concerns (target resolution, mutation gating, timing, the
call descriptor) run once in the router. Components are split by responsibility; comments explain
non-obvious *why* and nothing else.

## 4. What shipped

**Real execution.** The mocked executor is gone. `src/api/` was rebuilt to the layout above with zod
validating every route. Mutations gate in the router off `enableMutations`, so the gate cannot depend on
which UI path called.

**Bugs fixed** (all verified against live DynamoDB, not just by reading):

| # | Bug | Evidence |
|---|---|---|
| 1 | Every operation mocked | deleted |
| 2 | Named range queries never dispatched | unfiltered partition query returns 4 items, `allTasks` correctly narrows to 3 |
| 3 | Index partition queries hit the base table | same GSI2 partition returns 2 items with `index` set, 0 without |
| 4 | `batchGet` was N parallel gets | now one batched call |
| 5 | `list` mapped to `listAll`, dropping params | limit/order/pagination honoured; ASC≠DESC verified |
| 6 | `?.trim() !== ''` passed on `undefined` (4 sites) | Run button now disables on empty input |
| 7 | Controlled→uncontrolled input flip | fixed |
| 8 | Key separator hardcoded `#` in two places; group ids re-split on the delimiter | with `keySeparator: '\|'`, patterns keep their full value where the old split truncated each |
| 9 | Collection metadata spread its whole join tree | explicitly projected |
| 10 | Mutation gate depended on UI path | now enforced server-side |
| 11 | `bg-popover` aliased `--accent` | verified in compiled CSS |
| 12 | `Object.keys` on an entity array logged indices | logs real types |
| 13 | Hidden tabs mounted their content | filtered; default tab guarded |
| 15 | `buildRangeParams` returned `undefined` | returns `{}` |

**Table Map** (`/`) — table config, every entity with key patterns, indexes and declared range queries,
shared partitions, collections, and derived config warnings (no `typeIndex`, index pointing at an
unconfigured GSI, `numeric` index with a constant range key, single-partition entities).

**Query workbench** — access-pattern-driven: entity → main table or one of its *named* indexes → a declared
range query or a custom range. Cursor pagination via real `paginationToken`. Copy-as-code built from the
path the executor actually took. Query history in the sidebar; every run mirrors into `?q=` for sharing.

**Partition browsing** — reads raw items through the provider so `_pk`/`_sk`/`_type` survive
`autoRemoveTableProperties`, which is what makes a mixed-entity partition legible.

**Design system** — complete light/dark token palettes (dark default), entity colour identity on a
golden-angle hue step, shared `ResultTable`/`JsonView`/`KeyPattern`, ⌘K palette, toasts. `UpdateModal`
(1,108 lines) split into 11 files; `FiltersSheet` into 4. Nothing in `src/client` exceeds ~330 lines.

**Docs** — the playground previously had zero presence outside its own README. Now: rewritten README,
`docs/guide/playground.md` in the VitePress sidebar, and a section in the root readme.

## 5. Known gaps

**Lint — 10 errors, 2 warnings.** Config is in place (`.eslintrc.json` needed `root: true`, browser globals
and a `components/ui/**` a11y override). `--fix` cleared 507 of 536. What remains is almost entirely
`jsx-a11y/label-has-associated-control` in `FiltersSheet` / `ParamForm` / `RangeFilter`. A `Field` +
`FieldCaption` pair exists in `components/shared/Field.tsx`; the four non-labelable captions are converted,
the six `<label>`+`<Input>` pairs still need wrapping. Also: two `react/no-unescaped-entities`,
`jsx-a11y/no-autofocus` in the command palette (intentional — wants an inline disable with a reason), an
unused `useState` in `RangeFilter`, and a pre-existing `exhaustive-deps` warning in the sidebar.

**Dead code.** `hooks/urlState.ts` (326 lines) was never adopted — shareable links use a single encoded
`?q=` param instead, because the builder state is nested and a flat mapping needs escaping rules per shape.
Delete it unless it is wanted elsewhere.

**Unexposed server surface.** `entity.create`, `table.scan` and `table.getByKey` exist, are gated and were
verified when the backend was rebuilt, but have no UI and are out of v1 scope. They are inert (create
requires an opt-in flag that v1 no longer documents). Decide before publishing whether to keep them as
latent surface or strip them — see §7.

**No test suite.** Out of scope for v1; the manual matrix in §7 is the gate.

**Not visually reviewed.** Every screen has been verified for data, module transforms, compiled tokens and
types — but no one has looked at the rendered UI in a browser. Do that before publishing.

## 6. Suggestions for the core library

None of these block v1 — the playground works around all of them — but each would simplify it and benefit
every consumer. Worth folding into `notes/suggestions.md`.

1. **Schema introspection API.** `schema.getEntities()` / `getEntityMetadata(type)` returning key shapes,
   indexes and range queries. The playground reconstructs this by probing key getters with Proxy sentinels,
   which has a documented failure mode: a getter that *transforms* a value
   (`({ email }) => [email.toLowerCase()]`) is misread as a CONSTANT (`src/api/metadata/entity/key.ts`).
2. **Re-export `IDynamodbProvider` from the package root.** Exported from `src/provider/index.ts` but
   missing from `src/index.ts`, so consumers must type against the concrete class. One line.
3. **Read the provider back off the table.** A read-only `table.provider` would let `PlaygroundConfig` drop
   its `dynamodbProvider` field entirely.
4. **A dry-run / param-inspection hook.** `logCallParams` already builds the exact DynamoDB command and
   `console.log`s it (`src/provider/utils/dynamoDB/instance.ts:42`) — the information exists with no
   programmatic exit. An `onCallParams?: (action, params) => void` would unlock showing the real DynamoDB
   request, the single most useful thing the playground still can't do.
5. **Entity → partition back-reference.** Entities built via `partition.use()` keep no link back, so the
   playground groups partitions heuristically and cannot name them or show single-entity ones.
6. **Optional runtime attribute schema.** `properties: { name: 'string', age: 'number' }` would unlock
   create/edit forms, validation and doc generation — and is the precondition for creation returning to
   this tool's scope.
7. **`table.scan`.** Flagged in `notes/review.md` §BAD-7. Not needed by the playground, but SingleTable
   users still drop to the provider layer, losing entity parsing, to scan.
8. **Declared range-query operations at rest.** `inferRangeQueries` recovers `operation` by calling `fn({})`
   and falls back to `'unknown'` when that throws.

## 7. Publish checklist

### A. Decisions — settled

- [x] **Unexposed server surface** — `entity.create`, `table.scan` and `table.getByKey` stay as latent
      code. Inert without UI, and useful groundwork.
- [x] **`enableMutations.create` removed** from the config type, along with `isCreateEnabled` from the
      metadata response. The `entity.create` operation now refuses with an explanatory 403 rather than
      reading a flag that can no longer be set.
- [x] **`hooks/urlState.ts` kept.**
- [x] **Demo config stays uncommitted.**

### B. Code

- [x] `yarn lint` — 0 errors (2 `exhaustive-deps` warnings remain, both pre-existing).
- [x] `yarn check-ts` — clean, and now covers `scripts/` and `playground.config.ts` too.
- [ ] Root `yarn lint` still passes (it runs with `--fix`, so it rewrites files — commit first).
- [ ] Consider anchoring the root `.gitignore`'s `lib` to `/lib`; unanchored it swallows any nested `lib/`
      directory, which already cost us once.

### C. Manual QA

Prerequisite: `docker run -p 8000:8000 amazon/dynamodb-local`, then `yarn setup:local`.

- [ ] **Visual pass** — every screen in both themes: Table Map, entity tabs, partition, collection, item
      sheet, update modal, command palette, toasts.
- [ ] **Table Map** shows all 9 entities, 3 GSIs, `typeIndex`, TTL, both partition groups and
      `ProjectWithTasks`; every element navigates.
- [ ] **Access patterns** — for `TASK`: main query, `ByStatus`, `ByOrder` (numeric GSI), `byDueDate`
      between-query, and `allTasks` — each returns a *different* result set.
- [ ] **Pagination** — >2 pages in one partition; page through with the cursor; counts accumulate.
- [ ] **Shareable link** — copy the URL into a fresh tab; the query reconstructs and re-runs.
- [ ] **History** — runs appear with status/count/duration; clear works; survives a reload, not a restart.
- [ ] **Connection loss** — stop dynamodb-local: the header reports not-connected with the underlying
      error, not an empty result. Restart: it recovers.
- [ ] **Validation** — bad operation, missing key param, unknown index each return a useful message.
- [ ] **Mutation gating** — with `enableMutations: {}`, update and delete affordances are absent and the
      API rejects them.
- [ ] **Non-default separator** — set `keySeparator: '|'`; patterns and partition grouping stay correct.
- [ ] **No `typeIndex`** — comment it out; the `List` tab disappears and the Table Map warns.
- [ ] **Copy-as-code** — paste a named index range-query snippet into a `.ts` file; it compiles against the
      real entity.

### D. Package — verified end to end

The tarball was built, installed into a scratch consumer project with its own `playground.config.ts`
(different table, different entities, `dynamodb-provider@3.1.5` from npm) and driven against a live
DynamoDB. All of the following passed on the **packaged** path, not `yarn dev`:

- [x] `files` audited. **Found and fixed a release blocker:** `src/cli.ts` imported `../tailwind.theme.js`
      at module scope, and that file was not in `files` — the published CLI would have crashed on startup.
      The import is now lazy and only runs when serving source; the tailwind configs ship as a fallback.
- [x] `yarn build` → `dist/client`; the CLI detects it and serves the built assets (HTML, JS, CSS all 200,
      dark-theme tokens present in the built CSS).
- [x] `npm pack` → install → `npx dynamodb-playground` boots, finds the config, lists entities and
      collections, and reports `connected` against the consumer's own table.
- [x] Access patterns on the packaged build: partition query (6), `allOrders` range query (5),
      `ByStatus` GSI split 3/2, entity `get`, `ByEmail` GSI, `list` via typeIndex, collection join, and a
      raw partition read.
- [x] Guard rails: create → 403 with the "cannot infer the shape" explanation; unknown entity/index/
      collection → 404 with the known names listed; bad param type → 400 with the zod issue.
- [x] Mutation gate: with `enableMutations: {}` both update and delete refuse with 403 and the metadata
      reports them disabled.
- [ ] Changelog entry for 0.0.1.
- [ ] Confirm `peerDependencies` (`dynamodb-provider >=3.0.0`) — verified working against 3.1.5.
- [ ] Decide whether `dependencies` should shrink. The published package pulls React, Radix, Tailwind and
      friends, but a consumer only needs them if the CLI falls back to serving source. Everything else is
      already compiled into `dist/client`. Trimming would cut install size substantially; it needs a pass
      to confirm nothing in the built path imports them.

### E. Docs

- [ ] README, `docs/guide/playground.md` and the root readme describe only what v1 ships.
- [ ] `yarn docs:build` succeeds with the new page in the sidebar.
- [ ] A screenshot or two of the Table Map and the query workbench would carry the pitch better than prose.

# AGENTS.md

This is a **published npm library** (`react-thermals`) for React state management. The library bundles to `dist/` via esbuild; `react` and `any-date-parser` are peer dependencies (externalized at build time).

## General

- **CRITICAL:** On first read, say "I read AGENTS.md" before proceeding.
- **Secrets:** Never read/write `.env` files. Open `src/integration/mockEnv.ts` to see available secret names.
- **Git:** DO NOT branch or commit without user review.
- **Support:** Consult docs/web for weak knowledge; ask when tasks are ambiguous or you're stuck.
- **Temp files:** Use `./temp/`.

## Tooling

- **Stack:** Bun · Vite · Wrangler · Prisma · React · Wouter · React Bootstrap · Phosphor Icons · Playwright · Biome — respect these choices.
- **Runtime:** Use `bun`, `bunx`, `bunx --bun`. Never `node`/`npm`/`npx` without user approval.
- **Dependencies:** Prefer existing packages. Consult `package.json` before adding new ones.
- **Validation:** After any edit - format, lint, then test using `bunx biome format --write <path>`, `bunx tsc --noEmit` then `bun test`.
- **Test Runner:** Use `bun:test` with `happy-dom` as the DOM environment with setup from `test/setup-happy-dom.ts`.

## Quick Commands

- `bun test` — run all tests.
- `bun test --watch` — run all tests in watch mode.
- `bun test src/classes/Store/Store.spec.tsx` — run a single test file.
- `bun run coverage` — test coverage report.
- `bun run build` - create build files (types + ESM + CJS).
- `bunx biome format --write <path>` — format.
- `bun run typecheck` — typecheck entire project.
- `bun run typecheck-one <filename>` — typecheck with grep to target single file.

### Entry point

`index.ts` — re-exports everything consumers use. Add new public exports here.

### Core layers

**`src/classes/Store/Store.ts`** — the central class. Extends `SimpleEmitter` (a tiny event emitter in `src/classes/SimpleEmitter/`). Stores hold state and a list of component-attached `setState` callbacks (`#setters`). State changes walk through an async middleware queue, then call each setter if the mapped value changed.

**`src/hooks/`** — two hooks:

- `useStoreSelector(store, mapState, equalityFn)` — subscribes to a slice; only re-renders when the mapped value changes (equality checked via `defaultEqualityFn`)
- `useStoreState(store)` — convenience wrapper that passes `undefined` as mapState (returns whole state)

The hooks call `store.attachComponent` on mount and `store.detachComponent` on unmount. `BeforeInitialize`/`AfterInitialize` events fire on the very first `useState` call.

**`src/actions/`** — action creator factories (each in its own subdirectory). They return functions that transform state. Calling `store.connect(path, actionFn)` binds an action to a path, wrapping it in `updatePath` so state changes stay immutable. `composeActions` / `pipeActions` compose multiple actions.

**`src/lib/`** — pure utilities:

- `selectPath` / `replacePath` / `updatePath` — the immutable path-traversal engine; supports dot notation and `[*]`/`.*` wildcards
- `getMapperFunction` — normalizes a string path, array of paths/functions, or a function into a single mapping function
- `defaultEqualityFn` — shallow equality used by `useStoreSelector`
- `shallowCopy`, `shallowOverride` — helpers for immutable merges

**`src/plugins/`** — store plugins (called via `store.plugin(fn)`). Each plugin registers event listeners on the store:

- `consoleLogger` — logs AfterUpdate events
- `observable` — adds a `.subscribe()` RxJS-style method
- `persistState` — reads/writes to localStorage or sessionStorage on BeforeInitialize / AfterUpdate
- `syncUrl` — syncs selected fields to URL search params
- `undo` — wraps state in `{ past, present, future }` and adds `undo`/`redo` methods to the store's `locals`
- `reactSignals` (`src/plugins/signals/`) — in-progress, not yet exported from `index.ts`

### State update flow

1. Caller invokes a setter (`setState`, `setStateAt`, `mergeState`, etc.) or an action.
2. The new value is pushed to `#waitingQueue`.
3. `#processQueue` resolves values (awaiting promises), runs them through middleware (`#runMiddleware`), and finally calls each registered `setState` callback only when the mapped slice has changed.
4. `AfterUpdate` fires after all setters have been called.

### Testing patterns

Specs live co-located with source (`*.spec.ts` / `*.spec.tsx`). Tests that render components use `@testing-library/react`. Stores can be tested headlessly — call actions, then `await store.nextState()` to get the resolved state. Use `store.clone()` in tests to get a fresh copy without event listeners.

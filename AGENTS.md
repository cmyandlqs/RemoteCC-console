# AGENTS.md

## Project

Mobile remote control console for Claude Code on Linux hosts. Early skeleton stage — most business logic is stubbed out.

## Monorepo Structure

npm workspaces: `apps/*` and `packages/*`.

| Workspace | Package name | Role | Dev port |
|---|---|---|---|
| `apps/daemon` | `@agent-console/daemon` | Fastify 5 + @fastify/websocket backend | 8787 |
| `apps/local-admin` | `@agent-console/local-admin` | React 18 + Vite host management page | 4173 |
| `apps/mobile-web` | `@agent-console/mobile-web` | React 18 + Vite + PWA mobile console | 4174 |
| `packages/claude-adapter` | `@agent-console/claude-adapter` | Claude integration adapter (interface only) | — |
| `packages/shared-types` | — | Shared TypeScript types (empty) | — |
| `packages/shared-ui` | — | Shared React components (empty) | — |

## Commands

```bash
# Run all workspaces that expose the script
npm run build          # tsc (daemon, claude-adapter) | tsc + vite build (local-admin, mobile-web)
npm run typecheck      # tsc --noEmit across all workspaces

# Dev servers (run individually — no single "dev all" command)
npm run dev:daemon          # tsx watch apps/daemon/src/index.ts
npm run dev:local-admin     # vite on :4173
npm run dev:mobile-web      # vite on :4174
```

No test, lint, or format scripts exist yet.

## Key Conventions

- **ESM only** — every package has `"type": "module"`. Use `.js` extensions in imports.
- **Strict TS** — `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **Daemon module resolution**: `NodeNext` (server-side). Frontends: `Bundler`.
- **Daemon config** via env vars: `AGENT_CONSOLE_HOST` (default `0.0.0.0`), `AGENT_CONSOLE_PORT` (default `8787`).
- **Daemon entrypoint**: `apps/daemon/src/index.ts` → `buildServer()` in `app.ts` wires routes + services.
- **State management** in frontends: Zustand. Data fetching: TanStack React Query. Routing: react-router-dom v6.

## Architecture Notes

- Daemon uses a service-layer pattern: `modules/{host,projects,sessions}/*-service.ts` injected into route handlers.
- `packages/claude-adapter` currently exports only an interface — no real Claude SDK wiring yet.
- `shared-types` and `shared-ui` are placeholder packages with no source files.

## Docs

All project docs are in `doc/` (Chinese). Key files:
- `doc/prd.md` — product requirements and MVP scope
- `doc/dev-path-a.md` — main technical architecture document
- `doc/frontend-dev.md` — frontend page structure and conventions
- `doc/backend-dev.md` — daemon module design, API, and storage

When adding features, align with the boundaries described in `frontend-dev.md` and `backend-dev.md` before writing code.

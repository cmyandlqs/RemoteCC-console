# Agent Console Mobile

A mobile remote control console for AI Coding power users. Access Claude Code on a Linux host from your phone — monitor sessions, switch projects, resume conversations, and receive approval alerts.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-purple.svg)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[中文](./README.md) · [Documentation](./doc/)

## Features

- **Streaming Conversation** — Real-time token-by-token output via WebSocket, continuous dialogue support
- **Session Management** — Create, resume, stop, and rename Claude Code sessions
- **Tool Call Visualization** — Collapsible tool call cards showing command, input, execution status, and output
- **Message Persistence** — All messages (user + Claude + thinking) stored in SQLite, survives refresh
- **Markdown Rendering** — Bold, lists, code blocks, quotes in Claude responses
- **Real-time Monitoring** — RuntimeBar with state, model, tokens, cost, and context window
- **Approval Awareness** — Risk-leveled approval cards with command preview and emergency stop
- **Approval Center** — Dedicated pending approvals page for centralized management
- **Git Status** — Branch, uncommitted changes visualization per project card
- **Multi-project Support** — Project whitelist with path isolation
- **Mobile PWA** — Installable progressive web app
- **Tailscale Network** — Zero-config remote access over LAN
- **Unified Design System** — CSS variable-driven tokens + 17 shared UI components

## Quick Start

### Requirements

- Node.js 20+
- Claude Code CLI (`~/.local/bin/claude`)
- Linux Host (macOS/Windows with Tailscale proxy also works)
- Tailscale (optional, for remote access)

### Installation

```bash
git clone https://github.com/cmyandlqs/RemoteCC-console.git
cd RemoteCC-console
npm install
npm run build
```

### Start Daemon

```bash
npm run dev:daemon
# Daemon listens on 0.0.0.0:8787
# Data directory: ~/.agent-console/
# Database: ~/.agent-console/data/remotecc.db
```

### Start Frontend

```bash
# Host admin page (localhost:4173)
npm run dev:local-admin

# Mobile web (localhost:4174)
npm run dev:mobile-web
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_CONSOLE_HOST` | `0.0.0.0` | Bind address |
| `AGENT_CONSOLE_PORT` | `8787` | Bind port |
| `VITE_DAEMON_URL` | `http://localhost:8787` | Frontend daemon URL |
| `VITE_DAEMON_WS_URL` | `ws://localhost:8787` | WebSocket URL |

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Local Admin (4173)              Mobile Web / PWA (4174)       │
│  ┌────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Overview · Projects        │  │ Hosts · Projects         │  │
│  │ Sessions · Approvals       │  │ Session · Approvals      │  │
│  │ Pairing                    │  │                          │  │
│  └──────────┬─────────────────┘  └──────────┬───────────────┘  │
│             │  @agent-console/shared-ui       │                  │
│             │  (tokens.css + 17 components)   │                  │
│             │  Tailwind CSS v4                │                  │
└─────────────┼─────────────────────────────────┼──────────────────┘
              │ REST API / WebSocket            │
┌─────────────▼─────────────────────────────────▼──────────────────┐
│  Daemon (8787) — Fastify 5                                      │
│  ┌────────────┬────────────┬────────────┬────────────────┐       │
│  │ Auth       │ Session    │ Approval   │ Git            │       │
│  │ Service    │ Supervisor │ Service    │ Service        │       │
│  └────────────┴────────────┴────────────┴────────────────┘       │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ CliClaudeAdapter — claude -p --permission-mode dontAsk  │     │
│  └─────────────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ SQLite (Drizzle ORM)                                    │     │
│  │ projects · sessions · session_messages                  │     │
│  │ approval_requests · file_changes · device_bindings      │     │
│  └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Fastify 5 + WebSocket |
| Database | SQLite + Drizzle ORM |
| Claude Integration | `@anthropic-ai/claude-code` CLI Adapter |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 + CSS Variable Design Tokens |
| State Management | Zustand (per-session isolation) + TanStack React Query |
| Shared Components | @agent-console/shared-ui (17 components + tokens.css) |
| Markdown | react-markdown + remark-gfm |
| Mobile | PWA (vite-plugin-pwa) |
| Language | TypeScript strict + exactOptionalPropertyTypes |

## Project Structure

```
apps/
├── daemon/              # Fastify 5 backend service
│   ├── infra/           # Database, event bus, path config
│   ├── modules/         # Business modules
│   │   ├── auth/        # Device pairing & auth
│   │   ├── host/        # Host status detection
│   │   ├── projects/    # Project management
│   │   ├── sessions/    # Session Supervisor / Worker
│   │   ├── approvals/   # Approval system
│   │   └── git/         # Git status reading
│   └── routes/          # REST API + WebSocket
│
├── local-admin/         # Host admin page (4173)
│   └── features/        # OverviewPage · ProjectsPage · ProjectSessionsPage
│                        # ApprovalsPage · PairingPage
│
└── mobile-web/          # Mobile Web/PWA (4174)
    ├── features/        # HostsPage · ProjectsPage · SessionPage · ApprovalsPage
    ├── stores/          # Zustand (per-session store + tool call tracking)
    └── lib/             # API client + WebSocket client

packages/
├── claude-adapter/      # Claude CLI adapter interface
├── shared-types/        # Shared TypeScript types
└── shared-ui/           # Shared UI component library
    ├── tokens.css       # Design tokens (50+ CSS vars: color/spacing/radius/shadow/motion)
    ├── reset.css        # CSS reset
    ├── typography.css   # Typography styles
    └── src/components/  # 17 components
        ├── Button · IconButton · Input · Card
        ├── StatusDot · StatusBadge
        ├── EmptyState · LoadingState · ErrorState
        ├── SectionHeader · MetricRow · MetricGrid
        ├── ToolCallCard · ApprovalCard · ShellOutput
        ├── TimelineItem · RuntimeBar
        └── index.ts
```

## Shared UI Components

`@agent-console/shared-ui` provides a unified design language with reusable components:

| Component | Purpose |
|-----------|---------|
| `Button` | 4 variants: primary / secondary / ghost / danger |
| `Card` | Generic card container with hover / keyboard accessibility |
| `Input` | Form input field |
| `IconButton` | Icon-only button (no text) |
| `StatusDot` | Status indicator dot (online / idle / warning / error) |
| `StatusBadge` | Status label badge |
| `TimelineItem` | Session timeline item (user / agent / thinking / tool / system) |
| `ToolCallCard` | Collapsible tool call card (4 execution states with animation) |
| `ApprovalCard` | Approval card (risk level + command preview + emergency stop) |
| `ShellOutput` | Terminal output display (collapsible) |
| `RuntimeBar` | Runtime status bar (state / model / tokens / cost / context) |
| `MetricRow` / `MetricGrid` | Data metric display |
| `SectionHeader` | Section heading |
| `EmptyState` / `LoadingState` / `ErrorState` | Empty / loading / error placeholders |

Design tokens are defined in `packages/shared-ui/tokens.css` with 50+ CSS variables covering colors (warm neutral `#faf8f5` base), spacing, border-radius, shadows, and motion.

## Core Data Flow

### Real-time Streaming

```
Mobile input → POST /api/sessions/:id/message
             → SessionWorker.resume(prompt)
             → spawn claude -p --resume --include-partial-messages
             → stream_event (content_block_delta)
             → EventBus → WS Gateway → Mobile rendering
             → Also persisted to session_messages table
```

### Session Timeline

```
WS event → session-store (Zustand per-session)
         → TimelineItem rendering
           kind=user     → accent background, right-aligned
           kind=agent    → surface container + subtle border, left-aligned
           kind=thinking → italic tertiary text
           kind=tool     → ToolCallCard (collapsible input/output + execution state)
           kind=system   → centered muted text
```

### History Loading

```
Enter session → GET /api/sessions/:id/messages
             → Load from API into Zustand per-session store
             → New WS events append to same store
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/host/info` | GET | Host info (hostname, OS, Claude auth, Tailscale) |
| `/api/host/health` | GET | Health check |
| `/api/projects` | GET/POST | List / create projects |
| `/api/projects/:id` | PATCH/DELETE | Update / delete project |
| `/api/projects/:id/sessions` | GET/POST | List / create sessions |
| `/api/sessions/:id` | GET | Session detail |
| `/api/sessions/:id/messages` | GET | Message history (`?after_seq=N` for incremental) |
| `/api/sessions/:id/message` | POST | Send message (continuous dialogue) |
| `/api/sessions/:id/stop` | POST | Stop session |
| `/api/sessions/:id/rename` | POST | Rename session |
| `/api/approvals/pending` | GET | Pending approvals |
| `/api/approvals/:id/respond` | POST | Reject / dismiss approval |
| `/api/projects/:id/git-status` | GET | Git status |
| `/api/pairing/create` | POST | Generate pairing token (local only) |
| `/ws?token=<token>` | WebSocket | Real-time event stream |

## Security Model

Daemon runs in `claude -p` mode (no stdin interaction) — the mobile client **cannot inject commands**.

Three-layer protection:

1. **`--permission-mode dontAsk`** — Auto-rejects all approval-required commands, whitelist-only
2. **`~/.claude/settings.json`** — Configure allow/deny tool rules
3. **PreToolUse Hook** — Intercept extreme danger commands (e.g. `rm -rf /`) before execution

Mobile approval UX = risk awareness + emergency stop (terminate session) — **no approval capability**.

## Dev Commands

```bash
npm run build          # Build all workspaces
npm run typecheck      # TypeScript type check
npm run dev:daemon     # Start Daemon (8787)
npm run dev:local-admin # Start admin page (4173)
npm run dev:mobile-web  # Start mobile web (4174)
```

## Documentation

- [Product Requirements (Chinese)](./doc/prd.md)
- [Technical Architecture (Chinese)](./doc/dev-path-a.md)
- [Frontend Dev Guide (Chinese)](./doc/frontend-dev.md)
- [Backend Dev Guide (Chinese)](./doc/backend-dev.md)
- [Phase 0 Research Archive (Chinese)](./doc/phase0-research-archive.md)

## License

MIT

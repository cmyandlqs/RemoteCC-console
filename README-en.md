# Agent Console Mobile

A mobile remote control console for AI Coding power users. Access Claude Code on a Linux host from your phone — monitor sessions, switch projects, resume conversations, and receive approval alerts.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-purple.svg)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[中文](./README.md) · [Documentation](./doc/)

## Features

- **Session Management** — Create, resume, stop, and rename Claude Code sessions
- **Real-time Monitoring** — Stream output, tool calls, and token usage via WebSocket
- **Approval Awareness** — Receive risk alerts for dangerous commands with emergency stop (no approval)
- **Git Status** — View branch, uncommitted changes, and file change tracking
- **Multi-project Support** — Project whitelist with path isolation
- **Mobile PWA** — Installable progressive web app
- **Tailscale Network** — Zero-config remote access over LAN

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
# Daemon listens on 127.0.0.1:8787
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
| `AGENT_CONSOLE_HOST` | `127.0.0.1` | Bind address |
| `AGENT_CONSOLE_PORT` | `8787` | Bind port |
| `VITE_DAEMON_URL` | `http://localhost:8787` | Frontend daemon URL |
| `VITE_DAEMON_WS_URL` | `ws://localhost:8787` | WebSocket URL |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Mobile Web / PWA (4174)                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ HostsPage · ProjectsPage · SessionPage          │   │
│  │ Zustand + TanStack React Query + WebSocket     │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬──────────────────────────────────┘
                     │ REST / WebSocket
┌────────────────────▼──────────────────────────────────┐
│  Daemon (8787)                                         │
│  ┌────────────┬────────────┬────────────┬────────────┐  │
│  │ Auth       │ Session    │ Approval   │ Git       │  │
│  │ Service    │ Supervisor │ Service    │ Service   │  │
│  └────────────┴────────────┴────────────┴────────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ CliClaudeAdapter — claude -p --permission-mode  │   │
│  │                 dontAsk                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Fastify 5 + WebSocket |
| Database | SQLite + Drizzle ORM |
| Claude Integration | `@anthropic-ai/claude-code` CLI Adapter |
| Frontend | React 18 + Vite |
| State Management | Zustand + TanStack React Query |
| Mobile | PWA (vite-plugin-pwa) |
| Language | TypeScript strict mode |

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
│   ├── features/        # Page components
│   ├── stores/          # Zustand store
│   └── lib/             # API client
│
└── mobile-web/          # Mobile Web/PWA (4174)
    ├── features/        # Page components
    ├── stores/          # Zustand store
    └── lib/             # API client + WebSocket

packages/
├── claude-adapter/      # Claude CLI adapter interface
└── shared-types/        # Shared TypeScript types
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/host/info` | GET | Host info (hostname, OS, Claude auth, Tailscale) |
| `/api/host/health` | GET | Health check |
| `/api/projects` | GET/POST | List / create projects |
| `/api/projects/:id` | PATCH/DELETE | Update / delete project |
| `/api/projects/:id/sessions` | POST | Create session |
| `/api/sessions/:id/message` | POST | Send message |
| `/api/sessions/:id/stop` | POST | Stop session |
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

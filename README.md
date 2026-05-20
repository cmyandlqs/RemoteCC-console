# Agent Console Mobile

面向 AI Coding 重度用户的移动端远程控制台。通过手机访问 Linux 主机上的 Claude Code，实时查看流式输出、切换项目、连续对话、查看历史记录。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-purple.svg)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](./README-en.md) · [中文文档](./doc/)

## 功能特性

- **流式对话** — 通过 WebSocket 接收 Claude Code 的实时流式输出（逐 token），支持连续对话
- **会话管理** — 创建、恢复、停止、重命名 Claude Code 会话
- **消息持久化** — 所有对话（用户消息 + Claude 回复 + thinking）存入 SQLite，刷新不丢失
- **Markdown 渲染** — Claude 回复支持加粗、列表、代码块、引用等 Markdown 语法
- **实时监控** — Token 消耗、模型信息、上下文窗口实时显示
- **审批感知** — 接收危险命令审批卡片，支持紧急停止
- **多项目支持** — 项目白名单、路径隔离
- **移动端 PWA** — 可安装的渐进式 Web 应用
- **Tailscale 内网** — 零配置内网远程访问

## 快速开始

### 环境要求

- Node.js 20+
- Claude Code CLI (`~/.local/bin/claude`)
- Linux Host（macOS/Windows Tailscale 代理亦可）
- Tailscale（可选，用于远程访问）

### 安装

```bash
git clone https://github.com/cmyandlqs/RemoteCC-console.git
cd RemoteCC-console
npm install
npm run build
```

### 启动

```bash
# 启动 Daemon (8787)
npm run dev:daemon

# 启动主机管理页 (4173)
npm run dev:local-admin

# 启动移动端 Web (4174)
npm run dev:mobile-web
```

### 配置

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `AGENT_CONSOLE_HOST` | `127.0.0.1` | 监听地址 |
| `AGENT_CONSOLE_PORT` | `8787` | 监听端口 |
| `VITE_DAEMON_URL` | `http://localhost:8787` | 前端连接地址 |
| `VITE_DAEMON_WS_URL` | `ws://localhost:8787` | WebSocket 地址 |

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│  Mobile Web / PWA (4174)                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ HostsPage · ProjectsPage · SessionPage          │   │
│  │ Zustand (per-session) + React Query + WebSocket │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬──────────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────▼──────────────────────────────────┐
│  Daemon (8787) — Fastify 5                             │
│  ┌────────────┬────────────┬────────────┬────────────┐ │
│  │ Auth       │ Session    │ Approval   │ Git       │ │
│  │ Service    │ Supervisor │ Service    │ Service   │ │
│  └────────────┴────────────┴────────────┴────────────┘ │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CliClaudeAdapter                                 │  │
│  │ claude -p --output-format stream-json             │  │
│  │ --include-partial-messages --permission-mode      │  │
│  │ dontAsk                                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ SQLite (Drizzle ORM)                             │  │
│  │ projects · sessions · session_messages           │  │
│  │ approval_requests · file_changes · device_bindings│  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Fastify 5 + @fastify/websocket |
| 数据库 | SQLite + Drizzle ORM + better-sqlite3 |
| Claude 集成 | `claude -p --include-partial-messages --output-format stream-json` CLI 适配层 |
| 前端框架 | React 18 + Vite |
| 状态管理 | Zustand (per-session 隔离) + TanStack React Query |
| Markdown | react-markdown + remark-gfm |
| 移动端 | PWA (vite-plugin-pwa) |
| 类型 | TypeScript strict mode |

## 项目结构

```
apps/
├── daemon/              # Fastify 5 后端服务
│   ├── infra/           # 数据库 schema、迁移、事件总线
│   ├── modules/
│   │   ├── auth/        # 设备配对认证
│   │   ├── host/        # Host 状态检测
│   │   ├── projects/    # 项目管理
│   │   ├── sessions/    # Session Supervisor / Worker / 消息持久化
│   │   ├── approvals/   # 审批系统
│   │   └── git/         # Git 状态读取
│   └── routes/          # REST API + WebSocket
│
├── local-admin/         # 主机管理页 (4173)
│   └── features/        # OverviewPage · ProjectsPage · PairingPage
│
└── mobile-web/          # 移动端 Web/PWA (4174)
    ├── features/        # HostsPage · ProjectsPage · SessionPage
    ├── stores/          # Zustand (per-session 隔离 store)
    └── lib/             # API client + WebSocket client

packages/
├── claude-adapter/      # Claude CLI 适配层（stream_event 解析）
└── shared-types/        # 共享 TypeScript 类型 + WS 协议定义
```

## 核心数据流

### 实时流式对话

```
手机输入 → POST /api/sessions/:id/message
        → SessionWorker.resume(prompt)
        → spawn claude -p --resume --include-partial-messages
        → stream_event (content_block_delta)
        → EventBus → WS Gateway → 手机端渲染
        → 同时写入 session_messages 表
```

### 历史消息加载

```
进入会话 → GET /api/sessions/:id/messages
        → SessionPage 从 API 加载历史
        → 写入 Zustand per-session store
        → 新 WS 事件追加到同一 store
```

## API 概览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/host/info` | GET | 主机信息（hostname、OS、Claude auth、Tailscale） |
| `/api/host/health` | GET | 健康检查 |
| `/api/projects` | GET/POST | 项目列表 / 创建 |
| `/api/projects/:id` | PATCH/DELETE | 更新 / 删除项目 |
| `/api/projects/:id/sessions` | GET/POST | 会话列表 / 创建会话 |
| `/api/sessions/:id` | GET | 会话详情 |
| `/api/sessions/:id/messages` | GET | 会话消息历史（支持 `?after_seq=N` 增量） |
| `/api/sessions/:id/message` | POST | 发送消息（连续对话） |
| `/api/sessions/:id/stop` | POST | 停止会话 |
| `/api/sessions/:id/rename` | POST | 重命名会话 |
| `/api/approvals/pending` | GET | 待处理审批 |
| `/api/approvals/:id/respond` | POST | 拒绝 / 忽略审批 |
| `/api/projects/:id/git-status` | GET | Git 状态 |
| `/api/pairing/create` | POST | 生成配对 token（仅本机） |
| `/ws?token=<token>` | WebSocket | 实时事件流 |

## 安全模型

Daemon 以 `claude -p` 模式运行（无 stdin 交互），移动端**无法注入指令**。

三层防护：

1. **`--permission-mode dontAsk`** — 自动处理需审批命令
2. **`~/.claude/settings.json`** — 配置 allow/deny 工具规则（允许 curl/git/npm 等，拒绝 sudo/rm -rf 等）
3. **PreToolUse Hook** — 工具执行前拦截极端危险命令

移动端审批 UX = 风险感知 + 紧急停止（停止 session），**无法批准**。

## 开发命令

```bash
npm run build          # 构建所有 workspace
npm run typecheck      # TypeScript 类型检查
npm run dev:daemon     # 启动 Daemon (8787)
npm run dev:local-admin # 启动管理页 (4173)
npm run dev:mobile-web  # 启动移动端 (4174)
```

## 文档

- [PRD 产品需求](./doc/prd.md)
- [技术架构](./doc/dev-path-a.md)
- [前端开发指南](./doc/frontend-dev.md)
- [后端开发指南](./doc/backend-dev.md)
- [Phase 0 预研归档](./doc/phase0-research-archive.md)

## License

MIT
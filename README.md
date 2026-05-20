# Agent Console Mobile

面向 AI Coding 重度用户的移动端远程控制台。通过手机访问 Linux 主机上的 Claude Code，会话级地查看状态、切换项目、恢复会话、接收审批提示。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-purple.svg)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](./README-en.md) · [中文文档](./doc/)

## 功能特性

- **会话管理** — 创建、恢复、停止、重命名 Claude Code 会话
- **实时监控** — 通过 WebSocket 接收流式输出、工具调用、Token 消耗
- **审批感知** — 接收危险命令审批卡片，支持紧急停止（无法批准）
- **Git 状态** — 查看分支、未提交变更、文件修改追踪
- **多项目支持** — 项目白名单、路径隔离
- **移动端 PWA** — 可安装的渐进式 Web 应用
- **Tailscale 内网** — 零配置内网访问

## 快速开始

### 环境要求

- Node.js 20+
- Claude Code CLI (`~/.local/bin/claude`)
- Linux Host（macOS/Windows Tailscale 代理亦可）
- Tailscale（可选，用于远程访问）

### 安装

```bash
# 克隆仓库
git clone https://github.com/cmyandlqs/RemoteCC-console.git
cd RemoteCC-console

# 安装依赖
npm install

# 构建所有 workspace
npm run build
```

### 启动 Daemon

```bash
npm run dev:daemon
# Daemon 监听 127.0.0.1:8787
# 数据目录: ~/.agent-console/
# 数据库: ~/.agent-console/data/remotecc.db
```

### 启动前端

```bash
# 主机管理页 (localhost:4173)
npm run dev:local-admin

# 移动端 Web (localhost:4174)
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

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Fastify 5 + WebSocket |
| 数据库 | SQLite + Drizzle ORM |
| Claude 集成 | `@anthropic-ai/claude-code` CLI 适配层 |
| 前端框架 | React 18 + Vite |
| 状态管理 | Zustand + TanStack React Query |
| 移动端 | PWA (vite-plugin-pwa) |
| 类型 | TypeScript strict mode |

## 项目结构

```
apps/
├── daemon/              # Fastify 5 后端服务
│   ├── infra/           # 数据库、事件总线、路径配置
│   ├── modules/         # 业务模块
│   │   ├── auth/        # 设备配对认证
│   │   ├── host/        # Host 状态检测
│   │   ├── projects/    # 项目管理
│   │   ├── sessions/    # Session Supervisor / Worker
│   │   ├── approvals/   # 审批系统
│   │   └── git/         # Git 状态读取
│   └── routes/          # REST API + WebSocket
│
├── local-admin/         # 主机管理页 (4173)
│   ├── features/        # 页面组件
│   ├── stores/          # Zustand store
│   └── lib/             # API client
│
└── mobile-web/          # 移动端 Web/PWA (4174)
    ├── features/        # 页面组件
    ├── stores/          # Zustand store
    └── lib/             # API client + WebSocket

packages/
├── claude-adapter/      # Claude CLI 适配层接口
└── shared-types/        # 共享 TypeScript 类型
```

## API 概览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/host/info` | GET | 主机信息（hostname、OS、Claude auth、Tailscale） |
| `/api/host/health` | GET | 健康检查 |
| `/api/projects` | GET/POST | 项目列表 / 创建 |
| `/api/projects/:id` | PATCH/DELETE | 更新 / 删除项目 |
| `/api/projects/:id/sessions` | POST | 创建会话 |
| `/api/sessions/:id/message` | POST | 发送消息 |
| `/api/sessions/:id/stop` | POST | 停止会话 |
| `/api/approvals/pending` | GET | 待处理审批 |
| `/api/approvals/:id/respond` | POST | 拒绝 / 忽略审批 |
| `/api/projects/:id/git-status` | GET | Git 状态 |
| `/api/pairing/create` | POST | 生成配对 token（仅本机） |
| `/ws?token=<token>` | WebSocket | 实时事件流 |

## 安全模型

Daemon 以 `claude -p` 模式运行（无 stdin 交互），移动端**无法注入指令**。

三层防护：

1. **`--permission-mode dontAsk`** — 自动拒绝所有需审批命令，只允许白名单工具
2. **`~/.claude/settings.json`** — 配置 allow/deny 工具规则
3. **PreToolUse Hook** — 工具执行前拦截极端危险命令（如 `rm -rf /`）

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

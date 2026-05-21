# Agent Console Mobile

面向 AI Coding 重度用户的移动端远程控制台。通过手机访问 Linux 主机上的 Claude Code，实时查看流式输出、切换项目、连续对话、查看历史记录。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-purple.svg)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](./README-en.md) · [中文文档](./doc/)

## 功能特性

- **流式对话** — 通过 WebSocket 接收 Claude Code 的实时流式输出（逐 token），支持连续对话
- **会话管理** — 创建、恢复、停止、重命名 Claude Code 会话
- **Tool Call 可视化** — 折叠式工具调用卡片，展示命令、输入参数、执行状态和输出
- **消息持久化** — 所有对话（用户消息 + Claude 回复 + thinking）存入 SQLite，刷新不丢失
- **Markdown 渲染** — Claude 回复支持加粗、列表、代码块、引用等 Markdown 语法
- **实时监控** — RuntimeBar 显示运行状态、模型、Token 消耗、费用、Context Window
- **延迟检测** — 自动测量网络延迟，首页 badge 显示健康状态（<150ms 良好 / 150-400ms 一般 / >400ms 较差）
- **审批感知** — 接收危险命令审批卡片（风险等级 + 命令预览），支持紧急停止
- **审批中心** — 独立的待审批列表页面，集中管理所有审批请求
- **多项目支持** — 项目白名单、路径隔离、Git 分支/未提交变更可视化
- **移动端 PWA** — 可安装的渐进式 Web 应用
- **Cloudflare Tunnel** — 无需公网 IP，手机在任何网络下都可访问主机
- **统一设计系统** — CSS 变量驱动的 token 体系 + 17 个共享 UI 组件

## 快速开始

### 环境要求

- Node.js 20+
- Claude Code CLI (`~/.local/bin/claude`)
- Linux Host
- cloudflared（用于远程访问，见下方安装说明）

### 安装

```bash
git clone https://github.com/cmyandlqs/RemoteCC-console.git
cd RemoteCC-console
npm install
npm run build
```

### 安装 cloudflared

```bash
mkdir -p ~/bin
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ~/bin/cloudflared
chmod +x ~/bin/cloudflared
```

## 日常使用

### 启动步骤（电脑端）

按顺序执行三个命令，每个在独立终端中运行（或使用 `setsid`/`nohup` 后台运行）：

```bash
# 1. 启动 Daemon（后端服务，端口 8787）
npm run dev:daemon

# 2. 启动移动端 Web 开发服务器（端口 4174，自动代理 API 和 WebSocket 到 Daemon）
npm run dev:mobile-web

# 3. 启动 Cloudflare Tunnel（将 4174 端口暴露到公网）
systemctl --user start cloudflared-tunnel
```

启动完成后，查看当前 Tunnel URL：

```bash
cat ~/.agent-console/tunnel-url.txt
```

输出类似：`https://some-words-here.trycloudflare.com`

> 首次使用需要先配置 systemd 服务，见下方"配置 Tunnel 服务"一节。

### 手机端使用

1. 在手机浏览器中打开 Tunnel URL
2. 可以正常浏览项目、创建会话、对话、查看实时输出
3. 建议用浏览器"添加到主屏幕"功能，以 PWA 模式使用体验更佳
4. 首页会显示延迟 badge（<150ms 绿色良好，150-400ms 黄色一般，>400ms 红色较差）

### 主机管理页（可选）

```bash
# 启动主机管理页（端口 4173，仅本机访问）
npm run dev:local-admin
# 浏览器打开 http://localhost:4173
```

### 常用运维命令

```bash
# 查看当前 Tunnel URL（手机访问地址）
cat ~/.agent-console/tunnel-url.txt

# 查看 Tunnel 状态
systemctl --user status cloudflared-tunnel

# 重启 Tunnel（URL 会变，需要重新在手机上打开新 URL）
systemctl --user restart cloudflared-tunnel

# 停止 Tunnel
systemctl --user stop cloudflared-tunnel

# 查看 Tunnel 日志
tail -50 ~/.agent-console/tunnel.log
```

### URL 变了怎么办

Cloudflare Quick Tunnel 的 URL 在以下情况会变：
- 手动重启 Tunnel 服务（`systemctl --user restart cloudflared-tunnel`）
- cloudflared 进程崩溃后自动重启

查看新 URL：

```bash
cat ~/.agent-console/tunnel-url.txt
```

在电脑上打开这个文件，把新 URL 发送到手机即可。正常使用中 Tunnel 不会自己重启，URL 保持不变。

### 配置 Tunnel 服务（首次使用）

如果 `systemctl --user start cloudflared-tunnel` 提示服务不存在，需要手动配置：

```bash
# 确保 systemd 用户目录存在
mkdir -p ~/.config/systemd/user

# 服务文件已包含在项目中，创建软链接
ln -sf /home/sikm/Project/AI-Project/RemoteCC-console/scripts/cloudflared-tunnel.service \
       ~/.config/systemd/user/cloudflared-tunnel.service

# 重新加载并启用
systemctl --user daemon-reload
systemctl --user enable cloudflared-tunnel
```

### 网络架构

```
手机浏览器/PWA
    ↓ HTTPS
Cloudflare Edge (自动分配 *.trycloudflare.com 域名)
    ↓ Tunnel (加密，http2 协议)
Vite Dev Server (4174，proxy API/WS → Daemon)
    ↓
Daemon (8787) — REST API + WebSocket + Claude Code
```

### 配置

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `AGENT_CONSOLE_HOST` | `127.0.0.1` | Daemon 监听地址 |
| `AGENT_CONSOLE_PORT` | `8787` | Daemon 监听端口 |
| `VITE_DAEMON_URL` | 空（同源） | 前端连接地址，留空走 Vite proxy |
| `VITE_DAEMON_WS_URL` | 空（同源） | WebSocket 地址，留空走 Vite proxy |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│  Local Admin (4173)              Mobile Web / PWA (4174)    │
│  ┌────────────────────────────┐  ┌────────────────────────┐ │
│  │ Overview · Projects        │  │ Hosts · Projects       │ │
│  │ Sessions · Approvals       │  │ Session · Approvals    │ │
│  │ Pairing                    │  │                        │ │
│  └──────────┬─────────────────┘  └──────────┬─────────────┘ │
│             │  @agent-console/shared-ui       │               │
│             │  (tokens.css + 17 components)   │               │
│             │  Tailwind CSS v4                │               │
└─────────────┼────────────────────────────────┼───────────────┘
              │ REST API / WebSocket           │
              │ (via Cloudflare Tunnel)         │
┌─────────────▼────────────────────────────────▼───────────────┐
│  Daemon (8787) — Fastify 5                                   │
│  ┌────────────┬────────────┬────────────┬────────────────┐   │
│  │ Auth       │ Session    │ Approval   │ Git            │   │
│  │ Service    │ Supervisor │ Service    │ Service        │   │
│  └────────────┴────────────┴────────────┴────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ CliClaudeAdapter                                       │   │
│  │ claude -p --output-format stream-json                  │   │
│  │ --include-partial-messages --permission-mode dontAsk   │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ SQLite (Drizzle ORM)                                   │   │
│  │ projects · sessions · session_messages                 │   │
│  │ approval_requests · file_changes · device_bindings     │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Fastify 5 + @fastify/websocket |
| 数据库 | SQLite + Drizzle ORM + better-sqlite3 |
| Claude 集成 | `claude -p --include-partial-messages --output-format stream-json` CLI 适配层 |
| 前端框架 | React 18 + Vite |
| 样式 | Tailwind CSS v4 + CSS 变量 Design Tokens |
| 状态管理 | Zustand (per-session 隔离) + TanStack React Query |
| Markdown | react-markdown + remark-gfm |
| 共享组件 | @agent-console/shared-ui (17 个组件 + tokens.css) |
| 移动端 | PWA (vite-plugin-pwa) |
| 类型 | TypeScript strict + exactOptionalPropertyTypes |

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
│   └── features/        # OverviewPage · ProjectsPage · ProjectSessionsPage
│                        # ApprovalsPage · PairingPage
│
└── mobile-web/          # 移动端 Web/PWA (4174)
    ├── features/        # HostsPage · ProjectsPage · SessionPage · ApprovalsPage
    ├── stores/          # Zustand (per-session 隔离 store + tool call 追踪)
    └── lib/             # API client + WebSocket client

packages/
├── claude-adapter/      # Claude CLI 适配层（stream_event 解析）
├── shared-types/        # 共享 TypeScript 类型 + WS 协议定义
└── shared-ui/           # 共享 UI 组件库
    ├── tokens.css       # Design tokens (50+ CSS 变量: 配色/间距/圆角/阴影/动效)
    ├── reset.css        # CSS reset
    ├── typography.css   # 排版样式
    └── src/components/  # 17 个组件
        ├── Button · IconButton · Input · Card
        ├── StatusDot · StatusBadge
        ├── EmptyState · LoadingState · ErrorState
        ├── SectionHeader · MetricRow · MetricGrid
        ├── ToolCallCard · ApprovalCard · ShellOutput
        ├── TimelineItem · RuntimeBar
        └── index.ts
```

## 共享 UI 组件

`@agent-console/shared-ui` 提供统一的设计语言和可复用组件：

| 组件 | 用途 |
|------|------|
| `Button` | 4 种变体: primary / secondary / ghost / danger |
| `Card` | 通用卡片容器，支持 hover / keyboard 可访问 |
| `Input` | 表单输入框 |
| `IconButton` | 纯图标按钮（无文字） |
| `StatusDot` | 状态指示圆点 (online / idle / warning / error) |
| `StatusBadge` | 状态标签徽章 |
| `TimelineItem` | 会话 Timeline 项 (user / agent / thinking / tool / system) |
| `ToolCallCard` | 可折叠工具调用卡片（4 种执行状态动画） |
| `ApprovalCard` | 审批卡片（风险等级 + 命令预览 + 紧急停止） |
| `ShellOutput` | 终端输出展示（可折叠） |
| `RuntimeBar` | 运行时状态栏（状态/模型/Token/费用/Context） |
| `MetricRow` / `MetricGrid` | 数据指标展示 |
| `SectionHeader` | 区域标题 |
| `EmptyState` / `LoadingState` / `ErrorState` | 空状态/加载/错误占位 |

Design tokens 定义在 `packages/shared-ui/tokens.css`，包含配色（中性暖灰白 `#faf8f5` 底色）、间距、圆角、阴影、动效等 50+ CSS 变量。

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

### 会话 Timeline

```
WS 事件 → session-store (Zustand per-session)
       → TimelineItem 渲染
         kind=user     → accent 色背景，右对齐
         kind=agent    → surface 容器 + subtle border，左对齐
         kind=thinking → 斜体 tertiary 文字
         kind=tool     → ToolCallCard (可折叠 input/output + 执行状态)
         kind=system   → 居中 muted 文字
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
| `/api/host/ping` | GET | 延迟测试（返回服务器时间戳） |
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
npm run build:prod     # 生产构建（mobile-web 输出到 daemon/mobile-web-dist，daemon 可直接 serve）
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
- [网络方案与 Tunnel 配置](./doc/network-troubleshooting.md)
- [Phase 0 预研归档](./doc/phase0-research-archive.md)

## License

MIT

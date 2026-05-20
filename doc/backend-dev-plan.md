# 后端开发计划

## 已确认技术决策

| 决策项 | 选择 |
|---|---|
| SQLite | Drizzle ORM + better-sqlite3 |
| Claude 集成 | Agent SDK 优先，CLI 作为 adapter 内部 fallback |
| Worker 模型 | 主进程内异步，SessionWorker class 逻辑隔离 |
| ID 生成 | UUID v7（时间有序 + 全局唯一） |
| 事件广播 | EventEmitter → WS Gateway |

## 当前进度基准

已完成：

- Daemon 骨架：Fastify 启动、config 加载、路由注册
- 项目 CRUD：ProjectService 内存版，create + list，含路径校验/去重/存在性检查
- 会话 CRUD：SessionService 内存版，create + list-by-project
- WebSocket：最小 hello 消息
- 前端骨架：local-admin、mobile-web 各一个空壳

未完成（全部）：

- 持久化、Claude 真实接入、事件管道、审批、Git、认证

---

## Phase 1：基础设施 & 持久化

目标：内存状态 → SQLite 持久化，补齐 daemon 基础中间件。

交付物：

1. 依赖安装：drizzle-orm, better-sqlite3, uuid, drizzle-kit, @types/better-sqlite3, @types/uuid
2. Drizzle schema 定义 6 张表：projects, sessions, session_events, approval_requests, file_changes, device_bindings
3. 数据目录初始化 ~/.agent-console/{data/,config/,logs/,cache/}
4. 替换 ProjectService / SessionService 内存 → SQLite
5. ID 生成改为 UUID v7
6. @fastify/cors 插件
7. 全局错误处理插件
8. 优雅关停
9. API 补齐：DELETE/PATCH /api/projects/:id, GET /api/sessions/:id, POST /api/sessions/:id/rename

验收：

- Daemon 启动后自动创建 DB + 表
- 重启后数据不丢
- 前端 dev server 可跨域访问 API
- Ctrl+C 优雅退出

---

## Phase 2：Host 状态 & 健康检查

目标：硬编码 → 真实系统自省。

交付物：

1. HostService 实重实现（hostname, os, version, claudeAuth, tailscale）
2. GET /api/host/info, GET /api/host/health
3. 启动自检

---

## Phase 3：Claude Adapter 实现

目标：packages/claude-adapter 从接口骨架 → 可调 SDK 的真实适配层。

交付物：

1. ClaudeAdapter 接口定义
2. AdapterEvent 类型系统
3. SDK 实现 (sdk-adapter.ts)

---

## Phase 4：WebSocket 事件管道

目标：Worker → EventBus → WS Gateway → 客户端实时事件流。

交付物：

1. packages/shared-types 定义 WsEnvelope + EventType
2. daemon 内部 EventBus
3. WS Gateway 重写

---

## Phase 5：Session Worker & 会话生命周期

目标：session 从内存占位 → 真实驱动 Claude Adapter 的 Worker。

交付物：

1. SessionWorker class
2. SessionSupervisor
3. Session 状态机
4. API 完善
5. 端到端事件流

---

## Phase 6：审批系统

目标：审批请求捕获 → WS 广播 → 前端拒绝 → 回传 SDK 完整闭环。

交付物：

1. ApprovalService
2. API: GET /api/approvals/pending, POST deny/dismiss
3. deny 闭环
4. 审计日志

---

## Phase 7：Git & 文件变更

目标：项目级 Git 状态 + 会话级文件触达追踪。

交付物：

1. GitService
2. FileChangeService
3. API + WS 事件

---

## Phase 8：认证 & 安全

目标：区分本地管理面和远程控制面，建立基本访问控制。

交付物：

1. Pairing 机制
2. 访问控制中间件
3. 审计补齐

---

## 执行策略

```
Phase 1 + 2    → 先完成，所有后续依赖 Phase 1
Phase 3        → 独立推进，完成后可与前端联调 SDK 事件流
Phase 4 + 5    → 连续推进，MVP 核心闭环
Phase 6 + 7    → 可并行
Phase 8        → 部署到真实 Linux Host 前完成
```

关键依赖链：

```
Phase 1 ─→ Phase 4 ─→ Phase 5 ─→ Phase 6
   │                    │            │
   └── Phase 3 ─────────┘            │
                                      └── Phase 7 (可与 Phase 6 并行)
Phase 2 (独立性最强，几乎随时可做)
Phase 8 (建议 Phase 5 完成后启动)
```

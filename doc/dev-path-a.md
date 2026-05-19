# 路径 A 开发文档

## 1. 文档目标

本文档用于定义 `RemoteCC-console` 的路径 A 实现方案。

路径 A 的含义是：

> 使用 Claude Code 官方可编程接口作为核心集成层，优先采用 Agent SDK，必要时使用 headless / `stream-json` 作为补充，而不是依赖终端纯文本转发或围绕官方 Remote Control 做黑盒桥接。

本文档解决的问题：

1. 第一版系统到底怎么拆。
2. Claude Code 通过什么方式接入。
3. 主机端、移动端、本地管理页分别负责什么。
4. 多项目、多会话怎么管理。
5. 审批、输出流、文件变更、Token/Context 怎么落。
6. 开发阶段先做什么，哪些点要先预研验证。

本文档不解决的问题：

1. UI 视觉稿。
2. 完整产品运营指标。
3. 多用户 / 团队版本。
4. 非 Linux 宿主机支持。

---

## 2. 路径 A 总结

### 2.1 路径 A 的核心判断

当前项目选择路径 A，原因不是“SDK 一定最强”，而是它最符合本项目的实现目标：

1. 我们要做自己的移动端控制台和本地管理页。
2. 我们要拿结构化事件流，而不是只看聊天文本。
3. 我们要自己建模会话、状态、文件变更、审批卡片。
4. 我们需要稳定的程序接口，而不是围绕现成 UI 或半公开能力做脆弱适配。

因此，第一版主路径定义为：

* Claude Code 集成主路径：`Agent SDK`
* 备选补充路径：`headless + stream-json`
* 不采用的主路径：`Remote Control 作为核心集成层`

### 2.2 路径 A 的工程含义

采用路径 A 后，产品本质上不是“远程操控用户现有的 Claude Code UI”，而是：

> 在 Linux 主机上运行一个自定义 Daemon，由 Daemon 调用 Claude Code 官方接口执行会话，再把结构化结果同步给移动端。

这意味着：

1. 宿主端会话状态由我们维护。
2. 前端展示由我们定义。
3. 原生会话概念尽量复用，但不能假设 100% 等同于官方桌面交互 UI。
4. 如果官方接口不给某个字段，就不展示，不编造。
5. 第一版默认采用 SDK 可编程认证路径，需要主机端具备有效的 Claude 认证上下文。

### 2.3 路径 A 的前提假设

路径 A 默认接受以下前提：

1. 主机端需要具备 Claude 可编程调用所需的可用认证上下文。
2. 该认证上下文可能来自 API key，也可能来自本机 Claude 配置注入。
3. 初始化流程中必须显式检查认证上下文是否存在、是否可用。

如果以上任一前提不成立，就不能继续按路径 A 实现，而应回退到其他路径重新评估。

---

## 3. 第一版范围

### 3.1 In Scope

第一版必须覆盖：

1. Linux 主机 Daemon。
2. 主机本地 Web 管理页。
3. 移动端 Web App / PWA。
4. 基于 Tailscale 的远程访问。
5. 项目注册与项目白名单。
6. Claude Code 多会话创建、恢复、切换、重命名。
7. 实时输出流。
8. Claude Code 原生审批请求展示与拒绝回传。
9. 文件触达提示与简化文件变更展示。
10. Git 状态展示。
11. 模型、Token、Cost 展示。
12. Context Window 展示，以及 Context 精确值展示（如果官方接口可获得）。

### 3.2 Out of Scope

第一版明确不做：

1. 云端账户系统。
2. 第三方聊天平台接入。
3. 移动端任意浏览主机文件系统。
4. 自定义风险规则引擎。
5. 任务级回滚。
6. 本轮改动归因的强一致模型。
7. 多用户权限系统。
8. Windows / macOS 主机适配。

### 3.3 基于当前预研的 MVP 口径修正

根据当前 `Phase 0` 预研结果，第一版开发文档需要采用更保守的实现口径。

当前已经有本机证据、可以作为 MVP 依赖的能力：

1. 会话创建、恢复、切换、重命名。
2. SDK / CLI 结构化事件流。
3. 会话历史读取。
4. 模型、usage、cost、context window 读取。
5. 审批请求捕获。
6. 审批 `deny` 回传。
7. 项目级 Git 状态和会话相关文件触达提示。

当前不能作为 MVP 依赖的能力：

1. `AskUserQuestion`
2. 一般用户输入卡片
3. 审批 `allow` 后当前工具调用稳定继续执行

因此，第一版产品口径应明确为：

* `AskUserQuestion` 先不作为 MVP 能力依赖。
* “移动端问题卡片”不进入首发必做范围。
* 审批先按“可展示、可拒绝、可挂起”设计，不把“手机端允许后一定继续执行”写成已成立前提。

---

## 4. 技术选型

## 4.1 总体选型

为了减少语言边界和运行时复杂度，建议第一版统一使用 TypeScript。

推荐技术栈：

* 主机端 Daemon：`Node.js 20+` + `TypeScript`
* Web API：`Fastify`
* WebSocket：`@fastify/websocket`
* Claude 集成：`Claude Code Agent SDK`
* 备选补充：`claude -p --output-format stream-json`
* 本地数据库：`SQLite`
* ORM / query builder：`Drizzle ORM` 或 `Kysely`
* 文件监听：`chokidar`
* Git 读取：原生命令 + 简单封装
* 移动端 / 本地管理页：`React` + `Vite` + `TypeScript`
* PWA：`vite-plugin-pwa`
* 状态管理：`Zustand`
* 数据请求：`TanStack Query`
* UI：`shadcn/ui` 或轻量自建组件

运行前提：

* Linux 主机已安装 Claude Code / Claude SDK 运行环境
* Linux 主机已接入 Tailscale
* Linux 主机已配置可用的 Claude 认证上下文

### 4.2 为什么主机端选择 Node.js / TypeScript

原因：

1. Claude Code 官方 SDK 对 JS/TS 生态最直接。
2. Daemon、本地管理页、移动端可以共享类型定义。
3. WebSocket、文件监听、子进程管理在 Node 侧成熟。
4. 单机本地工具的交付成本更低。

### 4.3 为什么第一版不用 Python / Go 做主机端

不是不能做，而是当前没有必要：

1. Python 方案在 SDK 接入层可能更绕。
2. Go 在长期部署和静态编译上有优势，但第一版产品核心不是性能，而是 Claude 接入和前后端联调效率。
3. 先用 TS 跑通主路径，再评估是否需要后续重构。

---

## 5. 系统架构

## 5.1 架构总览

```text
Mobile Web App / PWA
        ↓
Tailscale HTTPS / WSS
        ↓
Host Daemon (Supervisor)
        ├─ Local Admin Web
        ├─ REST API
        ├─ WebSocket Gateway
        ├─ Project Registry
        ├─ Session Registry
        ├─ Approval Bridge
        ├─ Git / File Change Service
        └─ Session Workers (1 worker per active session)
                 ↓
         Claude Code Agent SDK
                 ↓
         Project Directory / Git / Shell / Filesystem
```

### 5.2 关键设计原则

1. `Supervisor / Worker` 分离  
   Daemon 负责 API、状态汇总和会话调度；每个活跃会话由独立 worker 执行。

2. `项目白名单`  
   只能操作本地管理页登记的项目目录。

3. `会话优先`  
   系统核心实体是 `Session`，不是 `Task`。

4. `官方能力优先`  
   会话恢复、重命名、审批、结构化输出优先复用官方接口。

5. `拿不到就不展示`  
   尤其是 Context，不做“看起来像真值”的伪指标。

---

## 6. 模块拆分

## 6.1 Host Daemon Supervisor

职责：

1. 启动 HTTP / WebSocket 服务。
2. 管理本地 SQLite。
3. 管理项目注册表。
4. 管理会话元数据。
5. 启动 / 停止 / 恢复 Session Worker。
6. 汇总并广播状态事件。
7. 提供本地管理页。
8. 控制远程访问权限。

不直接承担：

1. Claude 会话执行主循环。
2. 长时间阻塞式流式推理。
3. 会话隔离内的具体工具调用处理。

### 6.2 Session Worker

每个活跃会话对应一个 worker 进程。

职责：

1. 初始化 Claude SDK 会话。
2. 发送用户输入。
3. 订阅流式事件。
4. 捕获审批请求。
5. 把结构化事件回传给 Supervisor。
6. 同步模型、Token、Context 等官方可暴露元数据。
7. 在会话结束后回收资源。

当前不默认承担：

1. `AskUserQuestion` 的宿主级答案回传。
2. 任意通用用户输入桥接。

为什么用独立 worker，而不是在主进程直接跑：

1. 单会话异常不拖垮整个 Daemon。
2. 长连接 / 长输出流更容易隔离。
3. 后续便于做单会话日志、单会话超时和资源限制。

### 6.3 Project Registry

职责：

1. 存储主机端登记项目。
2. 校验项目路径合法性。
3. 读取项目 Git 基本状态。
4. 防止移动端访问任意目录。

校验规则：

1. 路径必须存在。
2. 路径必须是目录。
3. 默认建议为 Git 仓库，但第一版不强制。
4. 路径去重，避免同一路径重复注册。

### 6.4 Session Registry

职责：

1. 维护本地可见的会话列表。
2. 记录会话与项目的映射关系。
3. 维护状态机：`idle / running / waiting_approval / error / completed / stopped / disconnected`
4. 缓存最近模型、最近活跃时间、最近错误。

### 6.5 Approval Bridge

职责：

1. 接收 Claude SDK 抛出的审批请求。
2. 转成统一的 UI 卡片事件。
3. 暂停会话继续推进。
4. 接收手机端拒绝或挂起操作。
5. 将用户选择送回 Session Worker。

当前口径：

1. `deny` 路径已有本机证据。
2. `allow` 路径尚未验证稳定闭环。
3. 通用用户输入桥接不归入本模块 MVP 职责。

### 6.6 File Change Service

职责：

1. 基于 Git 读取项目变更概况。
2. 基于 Claude 事件提取“本会话相关改动提示”。
3. 在文件详情页提供简化 diff。

说明：

同一项目下可能有多个历史会话，因此“这个文件绝对属于哪个会话”很难强一致。

第一版采用双轨策略：

1. `Project Git Diff`：项目当前真实变更。
2. `Session Referenced Changes`：从 Claude 流事件中提取本会话触达过的文件。

前端展示时应明确区分这两类信息，避免假装能做严格归因。

### 6.7 Local Admin Web

这是主机上的本地管理页，只允许在主机本机访问。

职责：

1. 首次初始化。
2. 查看 Host 基本状态。
3. 注册 / 删除项目。
4. 查看会话列表。
5. 查看 Tailscale 地址与配对信息。
6. 生成绑定二维码 / 绑定码。
7. 检查 Claude 认证上下文状态。

### 6.8 Mobile Web App

职责：

1. 连接 Host。
2. 选择项目。
3. 管理会话。
4. 查看输出流。
5. 处理审批。
6. 查看文件变更、Git 状态、模型、Token 等状态。

当前 MVP 不依赖：

1. 在移动端回答 `AskUserQuestion`
2. 在移动端处理任意通用问题表单

---

## 7. Claude Code 集成设计

## 7.1 主路径：Agent SDK

第一版默认以 Agent SDK 作为主集成层。

使用方式：

1. Supervisor 接收“创建会话 / 恢复会话 / 发消息”请求。
2. 对应 Session Worker 调用 Agent SDK。
3. SDK 流式返回结构化事件。
4. Worker 将事件转换为内部标准事件，发给 Supervisor。
5. Supervisor 广播给移动端。

### 7.2 备选补充：headless / `stream-json`

如果 SDK 某些场景存在限制，可以补充使用：

* `claude -p`
* `--output-format stream-json`

这条路线只作为补充，不应成为系统主事件总线，原因：

1. CLI 进程控制更脆弱。
2. 宿主集成可观测性不如 SDK。
3. 审批和用户输入桥接通常更难维护。

### 7.3 会话能力映射

要尽量与原生 Claude Code 保持一致，但不是逐像素复刻。

我们在系统里需要映射这些能力：

1. `create session`
2. `resume session`
3. `list sessions`
4. `rename session`
5. `switch session`
6. `stream messages`
7. `session history`
8. `approval required`

### 7.4 多会话并发策略

第一版建议采取保守策略：

1. 同一项目下允许存在多个会话。
2. 同一项目下默认只允许 `1 个运行中的写会话`。
3. 其他会话可以处于 `idle / completed / stopped`，也可以被恢复，但恢复前需要先停止当前写会话。

这样做的原因：

1. 避免多个会话同时修改同一工作目录。
2. 降低文件冲突、Git 状态污染和归因混乱。
3. 不违背“可恢复、可切换”的产品目标。

后续如果要放开同项目并发，可再引入：

* Git worktree 隔离
* copy-on-write 工作副本
* 每会话独立 sandbox 工作目录

### 7.5 模型 / Token / Context 读取策略

字段策略如下：

1. `model`
   - 只在官方事件明确给出时展示。
   - 不通过提示词猜测。

2. `token`
   - 优先读取官方 usage 字段。
   - 如果第一版无法稳定获得，则退化为估算。

3. `context`
   - 仅在官方接口有精确值时展示。
   - 拿不到则前端完全隐藏相关模块。

### 7.6 审批与用户输入

系统不自研风险判定。

当前 MVP 只做：

1. 捕获官方审批请求。
2. 生成卡片。
3. 等待手机端拒绝或挂起操作。
4. 回传拒绝结果。

这意味着审批卡片的动作集合必须是动态的，来自官方事件，而不是前端写死：

```ts
type ApprovalAction = {
  id: string;
  label: string;
  value: string;
}
```

同时需要明确：

1. `AskUserQuestion` 当前没有得到可桥接控制通道的本机证据。
2. 因此“问题卡片”不能沿用审批卡片实现。
3. 如果后续必须支持通用用户输入，需要单开预研，不应塞进当前 MVP 假设。

---

## 8. 运行模型

## 8.1 进程模型

建议的本地进程结构：

```text
remotecc-daemon
├─ http server
├─ ws server
├─ sqlite
├─ session supervisor
└─ child workers
   ├─ session-worker-1
   ├─ session-worker-2
   └─ session-worker-n
```

### 8.2 会话生命周期

```text
created
  -> idle
  -> running
  -> waiting_approval
  -> running
  -> completed

created
  -> idle
  -> running
  -> stopped

created
  -> running
  -> error
```

### 8.3 Daemon 重启后的恢复策略

第一版建议：

1. SQLite 持久化项目、会话元数据、审批日志。
2. Daemon 启动时扫描本地持久化元数据。
3. 运行中的会话一律标记为 `disconnected` 或 `stopped`。
4. 用户手动选择 `resume` 恢复会话。

原因：

* 自动重连运行中会话更复杂，也更容易产生“状态看起来在线但底层已经断了”的错觉。

### 8.4 基于当前验证的会话执行口径

当前可按下面三类情况设计：

1. 普通安全操作  
   直接继续执行并流式回传。

2. 命中审批且用户选择拒绝  
   Worker 回传拒绝结果，Claude 会收到一个错误 `tool_result`，会话继续进入后续文本输出或结束。

3. 命中审批且用户希望继续执行  
   第一版不把“手机端允许后必然继续执行”作为已成立前提。产品上需要保留“挂起并回到主机处理”的降级策略。

---

## 9. 网络与访问设计

## 9.1 Tailscale 访问方案

推荐做法：

1. Daemon API 仅监听 `127.0.0.1:<port>`。
2. 使用 `tailscale serve` 暴露 HTTPS / WSS 到 tailnet。
3. 手机端通过 Tailscale 域名访问。

推荐原因：

1. 不直接把 Daemon 监听在公网或局域网接口。
2. HTTPS 终止可以直接复用 Tailscale。
3. 更符合校园网复杂环境下的可达性要求。

### 9.2 管理页与远程控制面的隔离

第一版建议拆成两个访问面：

1. `Local Admin Surface`
   - 仅 `127.0.0.1`
   - 用于项目注册、初始化、查看本机会话总览

2. `Remote Mobile Surface`
   - 通过 Tailscale 暴露
   - 用于项目选择、会话控制、输出查看、审批处理

项目注册相关接口只允许本机管理面访问。

---

## 10. API 设计

## 10.1 REST API 列表

### Host

* `GET /api/host/info`
* `GET /api/host/health`
* `GET /api/host/tailscale`

### Pairing / Auth

* `POST /api/pairing/create`
* `POST /api/pairing/confirm`
* `POST /api/auth/refresh`
* `POST /api/auth/logout`

### Projects

* `GET /api/projects`
* `POST /api/projects` 仅本机
* `PATCH /api/projects/:id` 仅本机
* `DELETE /api/projects/:id` 仅本机
* `GET /api/projects/:id/status`
* `GET /api/projects/:id/files`

### Sessions

* `GET /api/sessions`
* `POST /api/sessions`
* `GET /api/sessions/:id`
* `POST /api/sessions/:id/resume`
* `POST /api/sessions/:id/rename`
* `POST /api/sessions/:id/message`
* `GET /api/sessions/:id/history`

### Approvals

* `GET /api/approvals/pending`
* `POST /api/approvals/:id/respond`

### File Changes / Git

* `GET /api/sessions/:id/file-changes`
* `GET /api/projects/:id/git-status`
* `GET /api/projects/:id/diff`

## 10.2 WebSocket 事件协议

客户端建立单一 WSS 连接，订阅 Host / Project / Session 事件。

统一信封：

```ts
type WsEnvelope<T> = {
  eventId: string;
  ts: string;
  type: string;
  sessionId?: string;
  projectId?: string;
  payload: T;
};
```

第一版事件类型建议：

```ts
type EventType =
  | 'host.online'
  | 'host.offline'
  | 'project.updated'
  | 'session.created'
  | 'session.updated'
  | 'session.state.changed'
  | 'session.message.delta'
  | 'session.message.completed'
  | 'session.command.started'
  | 'session.command.output'
  | 'session.command.completed'
  | 'session.file_change.updated'
  | 'session.approval.requested'
  | 'session.approval.resolved'
  | 'session.usage.updated'
  | 'session.error'
  | 'session.completed';
```

### 10.3 移动端最小必需事件

如果第一版要快速闭环，最小可用事件只需要这些：

1. `session.state.changed`
2. `session.message.delta`
3. `session.command.started`
4. `session.command.output`
5. `session.approval.requested`
6. `session.file_change.updated`
7. `session.error`

---

## 11. 数据存储设计

## 11.1 SQLite 表建议

### projects

```ts
projects(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  is_git_repo INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

### sessions

```ts
sessions(
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  external_session_id TEXT,
  name TEXT,
  status TEXT NOT NULL,
  model TEXT,
  started_at TEXT,
  last_active_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

### approvals

```ts
approvals(
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  reason TEXT,
  allowed_actions_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT
)
```

### session_events

第一版不必完整存全部 stdout，但建议至少保留结构化事件索引：

```ts
session_events(
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

### file_changes

```ts
file_changes(
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  change_type TEXT NOT NULL,
  additions INTEGER,
  deletions INTEGER,
  diff_excerpt TEXT,
  created_at TEXT NOT NULL
)
```

## 11.2 文件系统目录建议

```text
~/.remotecc/
├─ config/
│  ├─ app-config.json
│  └─ pairing.json
├─ data/
│  └─ remotecc.db
├─ logs/
│  ├─ daemon.log
│  └─ sessions/
├─ cache/
└─ runtime/
```

---

## 12. 本地管理页设计

## 12.1 页面列表

第一版本地管理页建议包括：

1. `初始化页`
2. `主机状态页`
3. `项目管理页`
4. `会话列表页`
5. `绑定与访问页`

### 12.2 初始化页

职责：

1. 检查 Claude Code 是否可用。
2. 检查 Tailscale 是否在线。
3. 检查 Claude 认证上下文是否存在且可调用。
4. 初始化本地数据库。
5. 生成首个设备绑定信息。

### 12.3 项目管理页

操作：

1. 添加项目目录。
2. 删除项目目录。
3. 查看项目 Git 状态。
4. 查看该项目会话列表。

### 12.4 绑定与访问页

展示：

1. 当前 Tailscale 访问地址。
2. QR 绑定码。
3. 已绑定移动设备列表。
4. 吊销设备能力。

---

## 13. 移动端设计

## 13.1 路由建议

```text
/login
/hosts
/hosts/:hostId/projects
/projects/:projectId
/sessions/:sessionId
/approvals
/settings
```

### 13.2 核心页面优先级

第一优先级：

1. Host 连接页
2. 项目列表页
3. 会话详情页
4. 审批中心页

第二优先级：

1. 文件变更页
2. 会话历史页
3. 设置页

### 13.3 会话详情页最小结构

1. 顶栏：项目名 / 会话名 / 状态 / 模型
2. 主流区：消息、命令、错误、审批卡片
3. 底部输入区：输入框 + 发送 + 快捷动作
4. 抽屉面板：文件变更 / Git 状态 / Usage

### 13.4 当前能实现的功能清单

基于当前预研结果，移动端第一版可以稳定承诺的功能建议限定为：

1. 连接 Host 并查看 Host 在线状态。
2. 浏览已注册项目。
3. 查看项目下会话列表。
4. 新建会话、恢复会话、切换会话、重命名会话。
5. 发送普通文本输入。
6. 查看流式输出、工具调用结果、错误信息。
7. 查看模型、Token、Cost、Context Window。
8. 查看 Git 状态和会话触达文件提示。
9. 接收审批卡片。
10. 拒绝审批请求。
11. 看到“需要回到主机继续处理”的挂起提示。

当前不建议写进 MVP 承诺的功能：

1. 在手机端回答 `AskUserQuestion`
2. 在手机端完成所有“允许后继续执行”的审批闭环
3. 任意表单式用户输入桥接

### 13.5 MVP 用户交互流程

#### 流程 1：主机初始化

1. 用户在 Linux Host 打开本地管理页。
2. 系统检查：
   * Claude Code / SDK 是否可用
   * Tailscale 是否在线
   * 本地数据库是否可初始化
   * 认证上下文是否可用
3. 用户添加项目目录。
4. 系统生成移动端绑定信息。

#### 流程 2：移动端首次绑定

1. 用户在手机端打开 Web App / PWA。
2. 输入或扫描 Host 绑定信息。
3. 本地管理页确认绑定。
4. 绑定成功后进入 Host 项目列表。

#### 流程 3：创建或恢复会话

1. 用户在手机端选择项目。
2. 查看该项目已有会话。
3. 选择：
   * `新建会话`
   * `恢复会话`
   * `重命名会话`
4. 进入会话详情页。

#### 流程 4：正常远程使用

1. 用户在底部输入区发送文本。
2. Session Worker 调用 Claude SDK。
3. 移动端实时收到：
   * assistant 文本
   * tool_use / tool_result
   * task started / completed
   * usage / cost / model 信息
4. 用户在抽屉里查看 Git 状态、文件触达、Usage。

#### 流程 5：遇到审批请求

1. Claude 命中原生审批请求。
2. 移动端收到审批卡片，展示：
   * 工具名
   * 描述
   * 目标路径或命令
   * 当前状态
3. 用户当前可稳定执行的动作：
   * `拒绝`
   * `稍后处理`
4. 如果用户拒绝：
   * Worker 回传 deny
   * Claude 收到错误 `tool_result`
   * 会话继续输出后续文本或结束
5. 如果用户希望继续执行：
   * 当前 MVP 显示“回到主机继续处理”的降级提示
   * 不把手机端 allow 闭环当成已承诺能力

#### 流程 6：查看历史会话

1. 用户回到项目会话列表。
2. 选择旧会话。
3. 系统读取历史消息和最近状态。
4. 用户继续发送新输入或仅查看历史。

---

## 14. 安全设计

## 14.1 访问控制

第一版建议的安全模型：

1. 访问链路依赖 Tailscale tailnet。
2. 应用层仍保留自己的配对 token。
3. 移动端首次配对必须通过主机本地管理页确认。
4. 远程 token 只允许访问“移动端控制面”。
5. 项目注册接口只允许本地管理面。

### 14.2 会话权限控制

第一版不做复杂 RBAC，但至少要区分：

1. `local_admin`
2. `mobile_control`

其中：

* `local_admin` 可以增删项目、查看绑定设备、吊销设备。
* `mobile_control` 可以查看项目、控制会话、处理审批。

### 14.3 审计日志

必须记录：

1. 绑定设备。
2. 删除设备。
3. 添加 / 删除项目。
4. 审批请求与响应。
5. 远程停止会话。

---

## 15. 测试策略

## 15.1 单元测试

覆盖：

1. 项目路径校验。
2. 会话状态机。
3. 审批状态流转。
4. Git 状态解析。
5. Token 估算函数。

### 15.2 集成测试

覆盖：

1. Daemon API。
2. WebSocket 事件广播。
3. Session Worker 与 Supervisor 通信。
4. 项目注册权限隔离。
5. 审批请求捕获与拒绝回传闭环。

### 15.3 端到端测试

覆盖：

1. 本地管理页添加项目。
2. 手机端连接 Host。
3. 创建会话并发送消息。
4. 审批卡片出现并拒绝处理。
5. 查看文件变更。
6. 恢复历史会话。

---

## 16. 研发阶段计划

## 16.1 Phase 0：技术预研

目标：验证路径 A 是否成立。

必须完成的验证：

1. 用 Agent SDK 跑通单项目单会话。
2. 验证流式事件是否足够驱动前端。
3. 验证能否稳定拿到：
   - session id
   - model
   - usage / token
   - approval request
   - resume / rename / listSessions
4. 验证 Context 是否有官方精确值。
5. 验证 headless `stream-json` 是否可作为 SDK 备选。

产出：

* 一份 `spike` 脚本目录。
* 一份“SDK 能力核验表”。

### 16.2 Phase 1：宿主端骨架

目标：把 Daemon、本地管理页、数据库和项目注册跑通。

交付：

1. Fastify 服务。
2. SQLite 初始化。
3. 本地管理页。
4. 项目注册接口。
5. Tailscale 访问页。

### 16.3 Phase 2：单会话闭环

目标：一个会话从创建到输出流展示跑通。

交付：

1. Session Worker。
2. 移动端会话页。
3. WebSocket 流事件。
4. 会话历史读取与状态同步。

### 16.4 Phase 3：多会话与审批

目标：支持多会话切换与审批转发。

交付：

1. 会话列表。
2. 会话恢复。
3. 会话重命名。
4. 审批中心。
5. 审批日志。

当前阶段验收口径：

1. 审批请求能够被结构化展示。
2. 用户能够在手机端执行拒绝操作。
3. 会话在拒绝后能稳定回到可观测状态。
4. `AskUserQuestion` 不作为 Phase 3 完成前提。
5. “手机端允许后直接继续执行”不作为当前阶段阻塞项。

### 16.5 Phase 4：可观测性增强

目标：把“控制台感”做出来。

交付：

1. Git 状态展示。
2. 文件变更页。
3. 模型信息展示。
4. Token 展示。
5. Context 展示，前提是官方给精确值。

---

## 17. 建议的仓库结构

```text
RemoteCC-console/
├─ apps/
│  ├─ daemon/
│  ├─ mobile-web/
│  └─ local-admin/
├─ packages/
│  ├─ shared-types/
│  ├─ shared-ui/
│  ├─ shared-config/
│  └─ claude-adapter/
├─ scripts/
│  ├─ spike-sdk/
│  └─ dev/
├─ doc/
│  ├─ prd.md
│  └─ dev-path-a.md
└─ pnpm-workspace.yaml
```

说明：

1. `daemon` 负责宿主端服务。
2. `mobile-web` 负责手机端控制台。
3. `local-admin` 负责主机本地管理页。
4. `claude-adapter` 封装 SDK / headless 集成。
5. `shared-types` 统一 API 和 WS 类型。

---

## 18. 当前仍保留的不确定项

这些问题不阻碍写开发文档，但会影响实现顺序：

1. Agent SDK 是否能稳定提供 `Context` 精确值。
2. Agent SDK 是否能完整覆盖会话重命名 / 列表 / 恢复。
3. 审批 `allow` 后，当前工具调用能否稳定继续执行。
4. `AskUserQuestion` 是否存在另一条可桥接的宿主控制通道。
5. 同项目多会话的官方行为边界是否需要更强本地锁。
6. Token 官方 usage 是否足够稳定，还是第一版应默认估算。

这些问题的处理原则是：

* 不先脑补。
* 先用 `Phase 0` 脚本做能力核验。
* 核验不通过的字段直接降级或隐藏。

---

## 19. 开发起点建议

如果下一步要正式进入实现，建议从这 5 件事开始：

1. 建 monorepo 骨架。
2. 写 `packages/claude-adapter` 的 `spike-sdk` 试验脚本。
3. 写 Daemon 的最小 `health + projects + ws` 框架。
4. 写本地管理页的“添加项目 + 生成绑定码”页面。
5. 按当前口径先落移动端“会话页 + 审批拒绝流程 + 主机回退提示”。

原因很简单：

* 这五步能最快把“真实可交付的 MVP 子集”落出来。
* 一旦 SDK 事件流、会话能力和审批拒绝闭环成立，后面的移动端工作主要是协议消费和 UI 组织。

# 后端开发文档

## 1. 文档目标

本文档定义 `Agent Console Mobile` 当前阶段的后端实现方案。

后端在本项目中指 Linux 主机上的 `Host Daemon`，它同时承担：

1. 本地管理页服务端
2. 移动端 API 网关
3. WebSocket 实时事件网关
4. Claude Code 会话调度器
5. 项目白名单与本地状态存储

## 2. 后端范围

### 2.1 In Scope

第一版必须覆盖：

1. Host 状态管理
2. 项目注册与白名单
3. 会话创建、恢复、切换、重命名
4. 普通文本输入转发
5. 实时输出流转发
6. 模型 / usage / cost / context window 聚合
7. Git 状态读取
8. touched files 聚合
9. 审批请求捕获与拒绝回传
10. 本地管理页所需接口

### 2.2 Out of Scope

第一版不做：

1. 多用户认证系统
2. 云端中继
3. 手机端任意文件系统浏览
4. 任务级回滚
5. 自定义审批规则引擎
6. 通用 `AskUserQuestion` 网关

## 3. 技术栈

后端统一采用：

* `Node.js 20+`
* `TypeScript`
* `Fastify`
* `@fastify/websocket`
* `Claude Code Agent SDK`
* `SQLite`
* `Drizzle ORM` 或 `Kysely`
* `chokidar`

系统前提：

1. 宿主机是 Linux
2. 宿主机已接入 Tailscale
3. 宿主机具备 Claude 可编程调用所需认证上下文

## 4. 后端职责划分

### 4.1 Supervisor

Supervisor 负责：

1. 启动 HTTP 服务
2. 管理 WebSocket 连接
3. 维护项目注册表
4. 维护会话索引
5. 汇总 Host 状态
6. 负责审批桥接的统一对外入口

### 4.2 Session Worker

每个活跃会话对应一个 Worker，负责：

1. 调用 Claude Adapter
2. 接收流式输出
3. 转换为内部事件
4. 更新会话状态
5. 写入消息与审计日志

### 4.3 Claude Adapter

Adapter 负责：

1. 屏蔽 SDK / CLI 细节
2. 提供统一事件流接口
3. 暴露会话管理接口
4. 捕获审批请求
5. 聚合 usage / model / cost / context window

## 5. 核心实体

### 5.1 Host

字段建议：

* `id`
* `name`
* `os`
* `daemonVersion`
* `tailscaleUrl`
* `claudeAuthState`
* `networkState`
* `lastHeartbeatAt`

### 5.2 Project

字段建议：

* `id`
* `name`
* `rootPath`
* `gitRoot`
* `defaultBranch`
* `isEnabled`
* `createdAt`

### 5.3 Session

字段建议：

* `id`
* `projectId`
* `providerSessionId`
* `title`
* `status`
* `model`
* `permissionMode`
* `inputTokens`
* `outputTokens`
* `totalCostUsd`
* `contextWindow`
* `lastEventAt`

### 5.4 ApprovalRequest

字段建议：

* `id`
* `sessionId`
* `toolUseId`
* `toolName`
* `displayName`
* `description`
* `payloadJson`
* `status`
* `createdAt`
* `resolvedAt`

### 5.5 TouchedFile

字段建议：

* `id`
* `sessionId`
* `projectId`
* `path`
* `changeType`
* `source`
* `updatedAt`

## 6. 模块结构

建议拆分：

```text
apps/daemon/src/
  config/
  app/
  routes/
  modules/
    host/
    projects/
    sessions/
    approvals/
    git/
  lib/
  infra/
```

### 6.1 `modules/host`

职责：

* 汇总 Host 健康状态
* 汇总 Tailscale 状态
* 汇总 Claude 认证状态

### 6.2 `modules/projects`

职责：

* 项目注册
* 项目列表
* 白名单校验

### 6.3 `modules/sessions`

职责：

* 会话创建
* 会话恢复
* 会话切换
* 会话重命名
* 输入转发
* 消息历史读取

### 6.4 `modules/approvals`

职责：

* 审批请求入库
* WebSocket 广播审批事件
* 拒绝操作回传
* 审批日志记录

### 6.5 `modules/git`

职责：

* `git status` 摘要
* touched files 归集
* 分支信息读取

## 7. Claude Code 集成设计

### 7.1 主路径

默认使用 `Claude Code Agent SDK`。

适配器最少应提供：

1. `createSession`
2. `resumeSession`
3. `renameSession`
4. `sendUserInput`
5. `streamEvents`
6. `denyApproval`
7. `listSessions`
8. `getSessionInfo`

### 7.2 备选路径

如果个别字段在 SDK 不稳定，可局部使用：

* `claude -p --output-format stream-json`

但它只能作为补充，不作为核心架构基石。

### 7.3 当前已知限制

1. `AskUserQuestion` 不作为当前 MVP 依赖。
2. 审批 `allow` 后继续执行尚未被预研稳定证实。
3. Context 精确值只在官方明确给出时展示。

## 8. API 设计

### 8.1 Host

* `GET /api/host`
* `GET /api/host/events`

### 8.2 Projects

* `GET /api/projects`
* `POST /api/projects`
* `GET /api/projects/:projectId`
* `DELETE /api/projects/:projectId`

### 8.3 Sessions

* `GET /api/projects/:projectId/sessions`
* `POST /api/projects/:projectId/sessions`
* `GET /api/sessions/:sessionId`
* `POST /api/sessions/:sessionId/input`
* `POST /api/sessions/:sessionId/rename`

### 8.4 Approvals

* `GET /api/approvals`
* `POST /api/approvals/:approvalId/deny`

## 9. WebSocket 事件协议

### 9.1 事件列表

第一版统一采用信封结构：

```json
{
  "type": "session.output.delta",
  "sessionId": "sess_123",
  "timestamp": "2026-05-20T10:00:00.000Z",
  "payload": {}
}
```

必须支持的事件：

* `host.status.updated`
* `project.updated`
* `session.snapshot`
* `session.status.changed`
* `session.output.delta`
* `session.message.completed`
* `approval.requested`
* `approval.resolved`
* `git.snapshot.updated`

### 9.2 设计原则

1. 事件类型稳定、语义单一。
2. 不直接把原始终端文本当协议。
3. 一条事件只表达一件事。
4. payload 可以扩展，但旧字段尽量保持兼容。

## 10. 数据存储

### 10.1 SQLite

建议首批表：

* `projects`
* `sessions`
* `session_messages`
* `approval_requests`
* `touched_files`
* `device_bindings`

### 10.2 文件系统

建议目录：

```text
~/.agent-console/
  config/
  db/
  logs/
  cache/
```

## 11. 安全策略

### 11.1 项目白名单

只允许访问主机端登记的项目目录。

### 11.2 网络边界

第一版默认只通过 Tailscale 访问，不暴露公网匿名入口。

### 11.3 审批策略

第一版不替代 Claude 原生审批语义，只做：

1. 捕获
2. 展示
3. 拒绝回传
4. 挂起提示

## 12. 日志与可观测性

首批日志应覆盖：

1. Server 启动
2. Claude 会话创建 / 恢复 / 结束
3. 审批请求进入与回传
4. WebSocket 连接建立 / 关闭
5. Tailscale 与 Claude 认证状态检查

日志级别建议：

* `info`
* `warn`
* `error`

## 13. 开发顺序建议

建议按下面顺序实现：

1. Fastify 启动与健康检查
2. Host 状态模块
3. 项目注册模块
4. 会话列表与创建模块
5. Claude Adapter 基础接口
6. 会话实时输出流
7. 审批拒绝闭环
8. Git 状态模块
9. SQLite 持久化

## 14. 验收标准

### 14.1 必须达成

1. Daemon 可启动
2. 可返回 Host 状态
3. 可注册项目
4. 可创建并查询会话
5. 可通过 WebSocket 推送结构化事件
6. 可接收并拒绝审批请求

### 14.2 允许后续补齐

1. 审批 `allow` 后继续执行
2. 通用 `AskUserQuestion` 桥接
3. 更细粒度 Context 占用统计

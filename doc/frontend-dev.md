# 前端开发文档

## 1. 文档目标

本文档定义 `Agent Console Mobile` 当前阶段的前端实现方案，覆盖两个前端面：

1. 主机端本地管理页 `apps/local-admin`
2. 手机端 Web App / PWA `apps/mobile-web`

本文档解决的问题：

1. 前端需要交付哪些页面。
2. 页面之间如何跳转。
3. 前端状态如何组织。
4. 如何消费后端 REST API 和 WebSocket 事件。
5. MVP 需要做到什么程度，哪些交互先不做。

## 2. 前端范围

### 2.1 In Scope

本阶段前端必须覆盖：

1. 主机端概览页
2. 主机端项目管理页
3. 主机端配对与访问页
4. 手机端 Host / Project 列表页
5. 手机端会话列表页
6. 手机端会话详情页
7. 手机端审批卡片与挂起提示
8. WebSocket 实时事件展示
9. 基础空状态、错误状态、加载状态

### 2.2 Out of Scope

当前前端明确不做：

1. 手机端通用问题卡片
2. 手机端代码编辑器
3. 团队协作、多用户登录
4. 云端账户系统
5. 多语言切换
6. 深色模式

## 3. 技术栈

前端统一采用：

* `React 18`
* `TypeScript`
* `Vite`
* `react-router-dom`
* `Zustand`
* `TanStack Query`
* `vite-plugin-pwa`（仅移动端启用）

设计原则：

1. 风格参考 Claude 的 calm / warm / productivity 方向，但不复制品牌元素。
2. 默认语言为简体中文。
3. 页面密度偏工具型，不做营销站式布局。
4. 所有主状态优先结构化展示，而不是大段聊天文本。

## 4. 两个前端的职责划分

### 4.1 `apps/local-admin`

只运行在主机本地，用来完成：

1. 初始化检查
2. Claude 认证上下文检查
3. Tailscale 状态检查
4. 项目注册
5. Host 访问地址查看
6. 已连接设备与配对信息查看

本地管理页不承担日常远程聊天控制职责。

### 4.2 `apps/mobile-web`

运行在手机浏览器或安装为 PWA，用来完成：

1. 浏览 Host 与项目
2. 浏览和恢复会话
3. 发送普通文本输入
4. 查看实时输出
5. 查看模型、Token、Cost、Context Window
6. 查看 Git 状态和会话触达文件
7. 接收审批卡片
8. 拒绝审批请求
9. 看到“回到主机继续处理”的挂起提示

## 5. 信息架构

### 5.1 主机端页面

建议路由：

* `/`：概览页
* `/projects`：项目管理页
* `/pairing`：配对与访问页

#### 概览页

区块：

1. Host 基本状态卡
2. Claude 认证状态
3. Tailscale 网络状态
4. 已注册项目数
5. 活跃会话数
6. 最近错误 / 最近事件

#### 项目管理页

区块：

1. 项目列表
2. 新增项目表单
3. 项目路径、Git 状态、默认分支
4. 删除或禁用项目操作

#### 配对与访问页

区块：

1. 当前访问地址
2. 设备配对二维码
3. 配对码
4. 已连接设备列表
5. 撤销连接按钮

### 5.2 手机端页面

建议路由：

* `/`：Host / 项目列表
* `/projects/:projectId`：项目详情与会话列表
* `/sessions/:sessionId`：会话详情

#### Host / 项目列表页

区块：

1. Host 在线状态
2. 项目列表
3. 每个项目的会话计数
4. 错误提示条

#### 项目详情页

区块：

1. 项目标题与 Git 摘要
2. 会话列表
3. 新建会话按钮
4. 恢复会话入口

#### 会话详情页

区块：

1. 顶部标题栏
2. 会话状态摘要
3. 输出流列表
4. Token / Cost / Context 信息条
5. Git 与文件触达侧栏或折叠面板
6. 审批卡片区
7. 输入框与快捷动作栏

## 6. 组件分层

建议采用三层结构：

1. `route pages`：页面级容器，负责参数、布局、数据拼装
2. `feature components`：领域组件，如 `SessionTimeline`、`ApprovalCard`
3. `ui components`：按钮、卡片、标签、表格、状态点等基础组件

建议首批组件：

* `AppShell`
* `StatusBadge`
* `MetricRow`
* `ProjectList`
* `SessionList`
* `SessionTimeline`
* `ApprovalCard`
* `GitSnapshotPanel`
* `TouchedFilesPanel`
* `EmptyState`
* `ErrorState`

## 7. 前端状态设计

### 7.1 查询状态

使用 `TanStack Query` 管理：

* Host 概览
* 项目列表
* 项目详情
* 会话详情
* 会话消息历史

缓存策略：

1. 列表数据允许短时缓存
2. 会话详情进入页时强制刷新一次
3. WebSocket 事件到达时局部更新 Query Cache

### 7.2 实时状态

使用 `Zustand` 管理：

* 当前连接状态
* 当前活跃会话
* 实时输出流缓冲
* 审批卡片队列
* 挂起提示

### 7.3 表单状态

使用本地组件状态即可，避免过早引入复杂表单库。

## 8. API 与事件消费

### 8.1 REST API

前端首批依赖接口：

* `GET /api/host`
* `GET /api/projects`
* `POST /api/projects`
* `GET /api/projects/:projectId/sessions`
* `POST /api/projects/:projectId/sessions`
* `POST /api/sessions/:sessionId/input`
* `POST /api/approvals/:approvalId/deny`

### 8.2 WebSocket 事件

前端必须识别的事件类型：

* `session.snapshot`
* `session.output.delta`
* `session.status.changed`
* `approval.requested`
* `approval.resolved`
* `git.snapshot.updated`
* `host.status.updated`

### 8.3 MVP 的事件处理口径

1. `approval.requested` 到达后，前端展示审批卡片。
2. 点击拒绝后，立即进入 loading 状态，等待 `approval.resolved`。
3. 若后端返回“需要回到主机处理”，前端只展示挂起提示，不尝试继续交互。
4. 不把 `AskUserQuestion` 当成前端通用事件类型。

## 9. 视觉与交互约束

### 9.1 基础风格

* 背景：暖白、浅砂、低对比度分层
* 文本：深灰而非纯黑
* 强调色：低饱和琥珀、绿色状态点
* 圆角：8px 或以下
* 边框：细线
* 阴影：浅且少

### 9.2 交互原则

1. 工具型布局优先。
2. 手机上避免多层嵌套抽屉。
3. 状态优先于装饰。
4. 输出区必须可快速扫描。
5. 审批卡片要显眼，但不能像高危营销弹窗。

## 10. 页面状态矩阵

每个核心页面至少实现以下状态：

1. `loading`
2. `empty`
3. `error`
4. `offline`
5. `ready`

会话详情页额外需要：

1. `streaming`
2. `waiting_approval`
3. `suspended`

## 11. 前端目录建议

### 11.1 本地管理页

```text
apps/local-admin/
  src/
    app/
    routes/
    components/
    lib/
    styles/
```

### 11.2 手机端 Web

```text
apps/mobile-web/
  src/
    app/
    routes/
    features/
    components/
    stores/
    lib/
    styles/
```

## 12. 开发顺序建议

建议顺序：

1. 本地管理页概览页
2. 项目管理页
3. 手机端项目列表页
4. 手机端会话列表页
5. 手机端会话详情页静态骨架
6. 接入实时输出流
7. 接入审批卡片与拒绝操作
8. 接入 Git / touched files 面板

## 13. 验收标准

### 13.1 主机端管理页

1. 能看到 Host 基础状态
2. 能新增和查看项目
3. 能看到访问地址与配对信息

### 13.2 手机端 Web

1. 能浏览项目和会话
2. 能进入会话详情页
3. 能发送普通文本输入
4. 能看到流式输出
5. 能看到审批卡片并触发拒绝
6. 能看到挂起提示

### 13.3 不应作为当前验收前提的能力

1. 手机端回答一般用户问题
2. 手机端批准后稳定继续执行工具调用
3. 手机端完整文件编辑体验

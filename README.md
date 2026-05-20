# Agent Console Mobile

Agent Console Mobile 是一个面向 AI Coding 重度用户的移动端远程控制台项目。

当前产品目标是：通过手机访问 Linux 主机上的 Claude Code，会话级地查看状态、切换项目、恢复会话、接收审批提示，并在移动端完成日常远程控制。

当前仓库已经从“纯文档仓库”进入到“文档 + 工程骨架”阶段。当前主要内容包括：

- `doc/`：产品、开发、预研、UI 提示词文档
- `apps/`：主机端 daemon、本地管理页、手机端 Web/PWA 骨架
- `packages/`：Claude 集成适配层骨架
- `UI参考图/`：界面灵感、风格参考、设计草图等图片资产

## 当前项目状态

当前阶段：`需求定义 + 技术路线确认 + 预研归档 + UI 设计准备 + 工程骨架初始化`

当前结论已经基本稳定：

- 产品定位已清晰：这是一个移动端 AI Coding Agent 控制台，不是通用聊天 App，也不是完整手机 IDE。
- 第一版边界已清晰：`Claude Code only`、`Linux Host only`、`Tailscale`、`项目白名单`、`移动端控制台 + 主机端管理页`。
- 技术主路径已清晰：走 `Agent SDK` 路径，辅以 CLI/headless 能力，不依赖 `AskUserQuestion` 作为 MVP 必备能力。
- MVP 功能范围已冻结：只承诺当前已经被文档和预研共同支持的那一组能力。

## 当前进展

目前已经完成的工作：

1. 完成了 PRD，明确了产品定位、MVP 边界、核心功能、页面结构和路线规划。
2. 完成了路径 A 开发文档，明确了技术选型、模块拆分、系统架构、API、数据存储和阶段计划。
3. 完成了 Phase 0 预研归档，沉淀了 Claude Code 集成、会话管理、审批桥接、能力边界等结论。
4. 完成了 UI 设计出图文档，统一了主机端 Web App 与手机端的页面结构、中文文案和绘图提示词。
5. 清理了仓库，收口了前期预研杂项文件。
6. 已经重新建立项目骨架，补齐了 daemon、本地管理页、手机端 Web/PWA、Claude Adapter 的最小入口。

当前还没有完成的部分：

- Claude SDK 真实接入
- SQLite 持久化接入
- REST API 细化与真实数据联通
- WebSocket 事件流真实接入
- 审批拒绝闭环联调
- 真实 Linux 主机部署验证

## 当前 MVP 功能口径

基于现有 PRD、开发文档和预研归档，当前第一版稳定承诺的能力为：

1. 连接 Host 并查看 Host 在线状态
2. 浏览已注册项目
3. 查看项目下会话列表
4. 新建会话、恢复会话、切换会话、重命名会话
5. 发送普通文本输入
6. 查看流式输出、工具调用结果、错误信息
7. 查看模型、Token、Cost、Context Window
8. 查看 Git 状态和会话触达文件提示
9. 接收审批卡片
10. 拒绝审批请求
11. 看到“需要回到主机继续处理”的挂起提示

当前明确不纳入第一版承诺的能力包括：

- 手机端直接批准并稳定继续执行所有审批请求
- 将 `AskUserQuestion` 作为通用移动端交互能力
- 手机端代码编辑器
- 多 Agent 支持
- 云端中继
- 任务级回滚、任务报告、复杂变更归因

## 文档说明

### `doc/prd.md`

项目的产品需求文档。

主要内容包括：

- 产品定位与目标用户
- 背景问题与机会点
- 核心用户故事
- 信息架构
- 核心功能需求
- 页面设计建议
- 系统架构建议
- 数据结构草案
- 安全策略
- MVP 版本规划
- 竞品与差异化
- 风险与取舍

适用场景：

- 对齐产品范围
- 讨论需求是否合理
- 确认哪些功能属于 MVP

### `doc/dev-path-a.md`

项目当前主技术路线的详细开发文档。

主要内容包括：

- 路径 A 的整体判断
- 第一版范围
- 技术选型
- 系统架构与模块拆分
- Claude Code 集成设计
- 运行模型
- 网络与访问设计
- REST API 与 WebSocket 事件协议
- SQLite 存储设计
- 本地管理页设计
- 移动端设计
- 安全设计
- 测试策略
- 研发阶段计划
- 仓库结构建议

适用场景：

- 进入正式开发前做架构对齐
- 拆分 daemon / local-admin / mobile-web 的开发任务
- 作为后续实现时的主技术依据

### `doc/frontend-dev.md`

项目当前前端详细开发文档。

主要内容包括：

- 主机端本地管理页范围
- 手机端 Web / PWA 范围
- 页面与路由结构
- 前端组件分层
- 状态管理方式
- REST / WebSocket 消费方式
- 视觉与交互约束
- 开发顺序与验收标准

适用场景：

- 前端正式开工前统一页面边界
- 拆解 local-admin 与 mobile-web 的开发任务
- 约束 MVP 页面和交互不发散

### `doc/backend-dev.md`

项目当前后端详细开发文档。

主要内容包括：

- Host Daemon 职责边界
- Supervisor / Worker 模型
- Claude Adapter 设计
- 核心实体与模块划分
- REST API
- WebSocket 事件协议
- SQLite 与文件系统设计
- 安全策略
- 开发顺序与验收标准

适用场景：

- 后端正式开工前统一模块拆分
- 搭建 daemon、session worker、adapter 的实现顺序
- 明确哪些能力必须做、哪些后置

### `doc/phase0-research-archive.md`

项目路径 A 的技术预研归档文档。

主要内容包括：

- Phase 0 原始目标
- 预研环境说明
- 实际执行的验证项
- 计划项与实际结果对照
- 已验证能力
- 未通过或仍待验证的能力
- 当前冻结的 MVP 功能口径
- 已排除出 MVP 的能力
- 对产品文档的直接影响
- 当前能力核验结果表
- 正式开发前仍建议继续验证的事项

适用场景：

- 回看为什么产品边界被收成现在这样
- 区分“已验证能力”和“假设能力”
- 作为开发前的证据链归档

### `doc/ui-image-prompts.md`

UI 设计图生成提示词文档。

主要内容包括：

- 先统一主机端与手机端页面结构
- 统一设计原则
- 统一组件清单
- 统一简体中文文案基线
- 面向绘图模型的统一约束
- 多张完整设计图提示词

适用场景：

- 给 image-to-image / text-to-image 绘图模型出界面图
- 给设计师提供结构化界面参考
- 保证主机端与手机端风格和组件语言一致

## 当前代码骨架

当前已经建立的工程结构：

```text
apps/
  daemon/
  local-admin/
  mobile-web/
packages/
  claude-adapter/
doc/
  prd.md
  dev-path-a.md
  frontend-dev.md
  backend-dev.md
  phase0-research-archive.md
  ui-image-prompts.md
```

当前骨架的性质：

1. `apps/daemon`：Fastify + WebSocket 最小可扩展服务骨架
2. `apps/local-admin`：React + Vite 的本地管理页静态骨架
3. `apps/mobile-web`：React + Vite + PWA 的手机端静态骨架
4. `packages/claude-adapter`：Claude 集成适配层接口骨架

这一步的目标是先把模块边界、目录和启动入口定住，而不是一次把所有业务实现写完。

## UI 参考图说明

`UI参考图/` 用于保存：

- Claude 风格参考
- 管理后台布局参考
- 手机聊天式控制台参考
- 审批卡片与状态卡片参考
- 后续设计师产出的界面草图或高保真图

建议做法：

1. 先基于 `doc/ui-image-prompts.md` 生成第一轮设计图
2. 将筛选后的参考图放入 `UI参考图/`
3. 再根据参考图补充最终页面结构和交互细节

## 下一步计划

建议按下面的顺序推进：

1. 先完成 UI 方向确认  
   基于 `doc/ui-image-prompts.md` 生成多轮设计图，筛选出主机端和手机端各自的视觉基线。

2. 将 UI 结构回填到现有前端骨架  
   先完善 `apps/local-admin` 和 `apps/mobile-web` 的页面结构、组件层次和状态占位。

3. 接入 daemon 真实数据  
   先打通 Host 状态、项目注册、会话列表这三条最短链路。

4. 接入 Claude Adapter  
   先实现会话创建、恢复、输出流、审批拒绝。

5. 接入持久化和真实部署验证  
   补齐 SQLite、日志、真实 Linux Host + Tailscale 联调。

## 本地开发建议

当前仓库已经切回“文档与实现同仓库”的模式。

建议后续保持：

1. 先更新对应开发文档，再调整模块边界
2. 新增实现尽量对齐 `doc/frontend-dev.md` 与 `doc/backend-dev.md`
3. 先打通最短闭环，再补真实 Claude 接入与持久化

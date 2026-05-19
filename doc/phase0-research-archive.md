# Phase 0 预研归档

## 1. 文档目的

本文档用于作为 `RemoteCC-console` 路径 A 的唯一 Phase 0 归档入口。

它整合了此前两类过程文档：

1. 预研计划 / checklist
2. 能力核验 / capability report

从现在开始，Phase 0 只保留这一份归档文档。它负责同时回答下面几件事：

1. 为什么要做这轮预研。
2. 预研原本打算验证什么。
3. 实际执行了哪些实验。
4. 已经验证通过哪些能力。
5. 哪些能力当前不能写进 MVP 承诺。
6. 这些结论怎样反映到 PRD 和开发文档。
7. 正式开发前还剩哪些风险点。

---

## 2. 路径 A 与 Phase 0 范围

本项目当前选择路径 A：

* 以 `Claude Code Agent SDK` 作为主集成层
* 必要时以 `headless + stream-json` 作为补充
* 不以 `Remote Control` 作为主实现路径

Phase 0 不追求产品完成度，只回答一个问题：

> 路径 A 是否能稳定支撑当前已经冻结的第一版需求。

Phase 0 只验证这些能力：

1. Claude Code SDK 是否可用。
2. 会话能力是否够用。
3. 流式结构化输出是否足够驱动前端。
4. 审批 / 用户输入桥接是否可做。
5. 模型 / Token / Context 元数据是否能稳定拿到。
6. 多会话管理在工程上是否可控。
7. Tailscale 访问模型是否适合目标 Linux 宿主环境。

Phase 0 明确不做：

1. 正式 UI 开发。
2. 完整移动端交互。
3. 完整数据库设计。
4. 多用户权限系统。
5. 打包和部署自动化。

---

## 3. 原始完成标准

只有同时满足下面条件，才算 Phase 0 达到可交付状态：

1. 已跑通至少一个真实项目目录下的单会话闭环。
2. 已确认会话创建、恢复、重命名、列举中至少 3 项可稳定调用。
3. 已确认流式输出可以转成结构化事件。
4. 已确认审批请求可以被捕获并回传用户动作。
5. 已确认 Token 的官方字段是否可拿；拿不到则确认估算方案。
6. 已确认 Context 是否有精确值；没有则明确隐藏策略。
7. 已输出一份能力核验结果表。

当前结论：

* 上述条件大部分已经完成。
* 唯一仍未完全闭合的核心项，是审批 `allow` 后继续执行，以及真实 Linux Host + Tailscale 接入验证。

---

## 4. 预研环境说明

### 4.1 工作区与执行环境

当前主要预研是在这台 Windows 机器上完成的：

* 工作区：`d:\sikm\Desktop\PythonProject\AI-apps\RemoteCC-console`
* `node` 可用
* `npm` 可用
* `claude` CLI 可用

补充说明：

* 目标产品宿主是 Linux
* 当前本机预研主要用于先验证 SDK / CLI / 会话 / 事件 / 审批桥这些核心链路
* `tailscale` 当前不在这台 Windows 机器的 `PATH` 中，因此真实 Tailscale 链路未在本机完成

### 4.2 Claude 当前宿主状态

已确认：

* `claude auth status` 返回 `loggedIn: true`
* `authMethod: oauth_token`
* `apiProvider: firstParty`

但这不等于真实请求一定走 Anthropic 官方原生 API。

### 4.3 当前 provider 配置

当前本机 `.claude/settings.json` 显示：

* `ANTHROPIC_BASE_URL` 已被覆盖
* provider 指向 `https://api.minimaxi.com/anthropic`
* 默认模型映射为 `MiniMax-M2.7`

这意味着：

1. 当前验证结果成立于 “Claude Code / Agent SDK 在 Anthropic 兼容 provider 下的宿主行为”。
2. 不能把这些结果简单等同于 Anthropic 官方原生环境的全部表现。
3. 但这并不影响“路径 A 主链路是否存在”的结论。

---

## 5. 实际执行项

### 5.1 命令与宿主检查

当前累计实际执行过：

1. `claude --help`
2. `claude --version`
3. `claude auth status`
4. `claude -p --output-format stream-json "Reply with exactly OK"`
5. `claude -p --output-format json "Reply with exactly OK"`
6. `claude -r <session_id> -p --output-format stream-json "Reply with exactly OK"`
7. `claude -p -n spike-name-test --output-format stream-json "Reply with exactly OK"`

### 5.2 SDK 与脚本验证

已安装并验证：

* `@anthropic-ai/claude-agent-sdk`
* `@anthropic-ai/sdk`
* `@modelcontextprotocol/sdk`
* `zod`

已运行脚本：

1. [scripts/spike-sdk/01-health-check.mjs](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/scripts/spike-sdk/01-health-check.mjs>)
2. [scripts/spike-sdk/04-approval-bridge.mjs](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/scripts/spike-sdk/04-approval-bridge.mjs>)
3. [scripts/spike-sdk/05-user-input-bridge.mjs](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/scripts/spike-sdk/05-user-input-bridge.mjs>)

### 5.3 直接调用的 SDK 能力

实际验证过：

1. `listSessions()`
2. `renameSession()`
3. `getSessionInfo()`
4. `getSessionMessages()`

此外还检查过：

* 本机 `.claude` 配置
* 项目会话落盘目录

---

## 6. 计划项与实际结果对照

| 预研主题 | 原始目标 | 当前结果 |
| --- | --- | --- |
| SDK 基础可用性 | 可安装、可运行、可完成最小调用 | 已通过 |
| 会话生命周期 | create / list / resume / rename / history | 已通过 |
| 流式结构化事件 | 形成 UI 可消费事件流 | 已通过 |
| 审批桥接 | 捕获请求并回传用户动作 | 部分通过 |
| Token / metadata | 获取 usage / model / context 相关字段 | 部分通过 |
| 一般用户输入桥接 | 验证 `AskUserQuestion` | 当前未通过 |
| 多会话并发边界 | 验证同项目多写会话行为 | 待继续 |
| Linux Host + Tailscale | 验证目标宿主远程链路 | 待继续 |

---

## 7. 已验证能力

### 7.1 Claude Code 官方可编程链路可用

已验证：

1. CLI 可用。
2. 官方 Agent SDK 包可安装、可运行。
3. CLI 与 SDK 都能完成真实请求闭环。

结论：

* 路径 A 不是纸面方案，已经具备可开发基础。

### 7.2 SDK 不要求当前 shell 显式设置 `ANTHROPIC_API_KEY`

已验证：

1. 本机 `ANTHROPIC_API_KEY` 环境变量未设置。
2. 最小 SDK 脚本仍然能够成功启动并完成请求。
3. `init` 事件显示 `apiKeySource: "none"`。

结论：

* 路径 A 依赖的是“可用认证上下文”，而不是狭义的“必须手工配置 API key”。

这条结论已经反映到开发文档中：

* [doc/dev-path-a.md](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/doc/dev-path-a.md>)

### 7.3 CLI 与 SDK 都已完成真实请求闭环

已验证：

1. `claude -p --output-format stream-json` 可成功完成请求。
2. `claude -p --output-format json` 可成功完成请求。
3. 本地 SDK `query()` 脚本可成功完成请求。
4. 返回结果中真实出现：
   * `assistant` thinking
   * `assistant` text
   * `result success`

结论：

* 第一轮里“`init` 后卡 429”的问题，已经不再是当前主结论。

### 7.4 结构化事件流真实存在，足够支撑前端基础建模

已验证事件 / 结果中可读到：

* `session_id`
* `cwd`
* `model`
* `permissionMode`
* `tools`
* `mcp_servers`
* `usage`
* `modelUsage`
* `total_cost_usd`

结论：

* 输出流、消息流、工具调用结果和错误信息都可以走结构化事件链路。
* 第一版移动端状态面板已经有明确数据来源。

### 7.5 模型 / Token / Cost / Context Window 可读

已验证：

1. 模型字段可读。
2. `result.usage` 中存在输入、输出、缓存相关 token 字段。
3. `result.total_cost_usd` 存在。
4. `result.modelUsage["MiniMax-M2.7"].contextWindow` 存在。
5. `result.modelUsage["MiniMax-M2.7"].maxOutputTokens` 存在。

当前未确认：

1. 当前会话“已使用 context 百分比”是否有官方直接字段。
2. 除 `contextWindow` 外，是否还能拿到更细的上下文占用信息。

结论：

* 移动端第一版可以稳定承诺展示 `模型、Token、Cost、Context Window`。
* 更细 Context 指标仍需“拿到再展示”。

### 7.6 会话创建、恢复、列表、重命名、历史读取均已被证实

已验证：

1. 非交互式调用会生成真实 `session_id`。
2. 本地 `~/.claude/projects/...` 目录会落盘对应 `.jsonl`。
3. `claude -r <session_id>` 可以恢复原会话 id。
4. `listSessions()` 能返回真实会话列表。
5. `renameSession()` 可实际修改会话标题。
6. `getSessionInfo()` 可读会话元信息。
7. `getSessionMessages()` 可读历史消息。

结论：

* “一个项目下多个会话，可恢复、切换、重命名”这条主产品叙事已经成立。

### 7.7 当前本机 hooks 存在兼容性噪音

已观察到：

* `SessionStart:startup`
* `/usr/bin/bash: ... run-hook.cmd: No such file or directory`

结论：

* 这类事件不会阻塞请求完成，但会污染事件流。
* 后续事件归一化时，需要把它们归为宿主环境噪音，不能误判为业务错误。

### 7.8 审批桥接已部分打通，`deny` 路径可用

使用 [scripts/spike-sdk/04-approval-bridge.mjs](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/scripts/spike-sdk/04-approval-bridge.mjs>) 做了三类实验：

1. 安全 Bash：`pwd`
2. 工作区外读取
3. 工作区内写入

已确认：

1. 安全命令不会自动触发审批。
2. 权限请求可以被结构化捕获。
3. 请求 payload 足够驱动移动端审批卡片。
4. `deny` 可以回传。
5. `deny` 后工作区写入不会真正落盘。

结论：

* 移动端第一版可以承诺“接收审批卡片 + 拒绝审批请求”。

---

## 8. 当前未通过或仍待验证的能力

### 8.1 `AskUserQuestion`

使用 [scripts/spike-sdk/05-user-input-bridge.mjs](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/scripts/spike-sdk/05-user-input-bridge.mjs>) 得到的结论是：

1. Claude 确实会调用 `AskUserQuestion`。
2. 但当前 SDK 宿主下，没有拿到可桥接的控制通道。
3. 它不能直接复用审批桥的实现方式。

产品含义：

* 第一版不承诺“移动端问题卡片”。

### 8.2 审批 `allow` 后继续执行

当前结论：

1. 审批请求本身可捕获。
2. `deny` 路径已证实。
3. `allow` 后当前工具调用是否稳定继续执行，尚未拿到可靠闭环证据。

产品含义：

* 第一版不承诺“手机端允许后一定继续执行”。
* 用户需要看到“回到主机继续处理”的降级提示。

### 8.3 同项目多会话并发边界

当前结论：

* 尚未完成“多个写会话同时运行”时的行为验证。

产品含义：

* 开发文档当前采用保守策略：同一项目默认只允许 `1 个运行中的写会话`。

### 8.4 真实 Linux Host + Tailscale 链路

当前结论：

1. 目标产品宿主是 Linux。
2. 当前主要 spike 在 Windows 环境完成。
3. 真正的 `Linux Host + Tailscale HTTPS/WSS` 仍需单独验证。

产品含义：

* 文档已经按 Linux 主机设计。
* 但部署链路仍属于正式开发前的宿主验证项。

---

## 9. 当前冻结的 MVP 功能口径

基于已有预研结果，当前冻结的移动端第一版功能清单如下：

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

这份清单已经作为当前文档基线写入：

1. [doc/prd.md](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/doc/prd.md>)
2. [doc/dev-path-a.md](</d:/sikm/Desktop/PythonProject/AI-apps/RemoteCC-console/doc/dev-path-a.md>)

---

## 10. 已明确排除出当前 MVP 承诺的能力

当前不应写进第一版承诺：

1. 在手机端回答 `AskUserQuestion`。
2. 在手机端完成所有审批 `allow` 后继续执行的闭环。
3. 任意表单式用户输入桥接。
4. 移动端任意浏览主机文件系统。
5. Windows / macOS 主机支持。
6. 云端账户体系和中继服务。
7. Task 层、本轮改动归因、任务完成报告。

---

## 11. 对产品文档的直接影响

本轮预研已经把产品口径从“愿景清单”收敛为“当前真实可承诺的能力边界”。

当前文档层面的关键变化是：

1. PRD 已明确主机平台为 Linux。
2. PRD 已按 11 条能力冻结第一版用户承诺。
3. 开发文档已明确 `AskUserQuestion` 不作为 MVP 依赖。
4. 开发文档已把审批模型改成“展示、拒绝、挂起提示”。
5. 开发文档已把认证描述改成“Claude 认证上下文”，而不是单一 API key 假设。

---

## 12. 当前能力核验结果表

| 能力项 | 是否为 MVP 必需 | 当前结论 |
| --- | --- | --- |
| SDK 基础可用性 | 必须 | 已验证 |
| CLI / SDK 真实请求闭环 | 必须 | 已验证 |
| 结构化事件流 | 必须 | 已验证 |
| 会话创建 / 恢复 / 列表 / 重命名 / 历史 | 必须 | 已验证 |
| 模型字段 | 必须 | 已验证 |
| Token / usage 字段 | 必须 | 已验证 |
| Cost 字段 | 重要 | 已验证 |
| Context Window | 重要 | 已验证 |
| 更细 Context 占用指标 | 可选 | 未验证 |
| 审批请求捕获 | 必须 | 已验证 |
| 审批 `deny` 回传 | 必须 | 已验证 |
| 审批 `allow` 后继续执行 | 非当前 MVP 承诺 | 未验证稳定闭环 |
| 一般用户输入 `AskUserQuestion` 桥接 | 非当前 MVP 承诺 | 当前未通过 |
| 同项目多写会话并发 | 重要 | 待继续 |
| Linux Host + Tailscale 接入 | 必须 | 待真实宿主验证 |

---

## 13. 正式开发前仍需继续验证的事项

正式进入开发后，仍需持续验证以下事项：

1. 真实 Linux 主机上的 Claude 运行环境准备方式。
2. Linux 主机上的 Tailscale HTTPS / WSS 接入链路。
3. 审批 `allow` 路径是否能补出稳定闭环。
4. 同项目多会话并发边界是否需要更强限制。
5. 更细粒度 Context 指标是否还能拿到官方精确值。

---

## 14. 当前归档结论

当前可以直接下结论：

1. 路径 A 可以继续，不需要回退重选架构。
2. 第一版产品必须按更保守的能力边界开发。
3. 当前最稳的开发顺序是先实现 Host 管理、项目/会话控制、输出流、状态面板、审批拒绝闭环。
4. `AskUserQuestion` 和审批 `allow` 继续执行，不应阻塞当前 MVP 开发。

这份归档文档的作用，是把“已经知道的事情”固定下来，避免后续开发再次回到未收敛状态。

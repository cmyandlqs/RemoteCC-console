# RemoteCC UI 设计图提示词

## 1. 先统一产品界面结构

在出设计图之前，先把产品界面结构统一下来。否则主机端和手机端会像两个不同产品，后面的提示词再精致也会发散。

本文件按下面顺序组织：

1. 统一设计原则
2. 主机端 Web App 页面结构
3. 手机端页面结构
4. 统一组件与中文文案
5. 基于统一结构生成的完整绘图提示词

默认语言要求：

* 所有设计图默认使用 `简体中文`
* 后续可以国际化，但当前设计稿统一按中文界面生成
* 若绘图模型不擅长精确中文，可在 prompt 中要求 `界面文案为简体中文，允许使用清晰可读的伪中文排版`

---

## 2. 统一设计原则

### 2.1 产品定位

这不是普通聊天软件，也不是营销页，而是：

> 一个运行在 Linux 主机侧、由手机远程连接的 AI Coding 控制台

它的气质应该更接近：

* Claude 的 App / Web 那种安静、克制、温暖、高级感
* 高级生产力工具
* 工程控制台
* 结构化信息面板

而不是：

* 社交聊天软件
* 紫色 AI SaaS 首页
* 赛博朋克终端
* 炫技概念稿

### 2.2 统一视觉方向

统一视觉关键词：

* 安静
* 克制
* 温暖中性
* 高级
* 真实产品感
* 信息密度高但不乱
* 轻卡片、薄边框、柔和阴影
* 面向工程师的专业感

### 2.3 统一色彩建议

建议整套图统一采用：

* 背景：米白、暖白、浅石灰
* 面板：浅沙色、浅灰米色
* 文字：深石墨灰
* 状态色：
  * 正常：低饱和绿色
  * 警告：低饱和琥珀色
  * 拒绝 / 错误：克制的深红色
* 少量冷色只用于连接、选中、信息强调

### 2.4 统一组件气质

统一组件要求：

* 8px 左右圆角
* 细边框
* 很少用重卡片
* 强调分区，而不是花哨装饰
* 信息区优先用列表、行、抽屉、标签、状态 pill
* 命令输出、工具调用、审批请求都要有结构化卡片
* 不要出现大面积渐变背景

---

## 3. 主机端 Web App 页面结构

主机端是“本地管理页”，只在 Linux 主机本机访问。它不是聊天窗口，而是配置、登记、会话总览和绑定入口。

### 3.1 主机端页面清单

建议统一为 5 个页面：

1. 初始化页
2. 主机状态总览页
3. 项目管理页
4. 会话列表页
5. 绑定与访问页

### 3.2 初始化页

页面目标：

* 第一次启动时完成基础环境检查和引导

核心功能组件：

1. 环境检查步骤列表
2. Claude Code 可用性检查卡片
3. 认证上下文检查卡片
4. Tailscale 在线状态卡片
5. 本地数据库初始化状态
6. 首个项目添加入口
7. 首个移动端绑定码 / 二维码生成区

建议中文文案：

* 页面标题：`初始化 RemoteCC`
* 小标题：`完成主机检查并生成移动端连接信息`
* 步骤：
  * `检查 Claude Code`
  * `检查认证上下文`
  * `检查 Tailscale`
  * `初始化本地数据库`
  * `添加首个项目`
  * `生成绑定信息`

### 3.3 主机状态总览页

页面目标：

* 一眼看清主机当前状态和整体运行情况

核心功能组件：

1. 主机信息卡
2. Claude 运行状态卡
3. Tailscale 连接状态卡
4. 认证上下文状态卡
5. 已注册项目数量卡
6. 活跃会话数量卡
7. 最近会话列表
8. 最近审批请求摘要

建议中文文案：

* 页面标题：`主机状态`
* 信息字段：
  * `主机名称`
  * `系统`
  * `在线状态`
  * `Tailscale`
  * `认证状态`
  * `已注册项目`
  * `运行中会话`
  * `最近活跃`

### 3.4 项目管理页

页面目标：

* 安全地登记项目目录，并查看每个项目的 Git 和会话概况

核心功能组件：

1. 搜索框
2. 项目列表
3. `添加项目` 按钮
4. 项目详情抽屉
5. Git 状态摘要
6. 最近活跃会话列表
7. 删除项目操作

每个项目项至少展示：

* 项目名称
* 本地路径
* Git 分支
* 未提交变更数
* 最近会话

建议中文文案：

* 页面标题：`项目管理`
* 操作按钮：
  * `添加项目`
  * `查看状态`
  * `查看会话`
  * `移除项目`
* 字段：
  * `项目路径`
  * `Git 分支`
  * `未提交变更`
  * `最近活跃会话`

### 3.5 会话列表页

页面目标：

* 查看当前主机上的 Claude Code 会话，以及每个会话状态

核心功能组件：

1. 会话搜索 / 过滤
2. 会话列表表格或紧凑列表
3. 会话状态标签
4. 所属项目字段
5. 模型字段
6. 最近活跃时间
7. 会话名
8. 快速跳转到项目

建议中文文案：

* 页面标题：`会话列表`
* 字段：
  * `会话名称`
  * `所属项目`
  * `状态`
  * `模型`
  * `最近活跃`
  * `创建时间`

### 3.6 绑定与访问页

页面目标：

* 负责移动端绑定、连接地址展示和设备管理

核心功能组件：

1. Tailscale 访问地址卡
2. 二维码卡片
3. 绑定码卡片
4. 已绑定设备列表
5. 吊销设备操作
6. 主机信任状态提示

建议中文文案：

* 页面标题：`绑定与访问`
* 字段：
  * `访问地址`
  * `绑定码`
  * `已绑定设备`
  * `最近连接`
* 操作：
  * `复制地址`
  * `刷新二维码`
  * `吊销设备`

---

## 4. 手机端页面结构

手机端不是普通 IM，而是“远程会话控制台”。

### 4.1 手机端页面清单

建议统一为 6 个页面：

1. Host 列表页
2. 项目列表页
3. 会话列表页
4. 会话详情页
5. 审批中心页
6. 设置页

### 4.2 Host 列表页

页面目标：

* 先选主机，再进入项目

核心功能组件：

1. Host 卡片列表
2. 在线状态
3. 连接质量状态
4. Linux 主机标识
5. 最近活跃信息

建议中文文案：

* 页面标题：`主机`
* 字段：
  * `在线`
  * `离线`
  * `最近活跃`
  * `运行中会话`
  * `连接正常`

### 4.3 项目列表页

页面目标：

* 查看当前主机下已登记项目

核心功能组件：

1. 项目列表
2. Git 分支字段
3. 未提交变更数
4. 最近会话预览
5. 进入项目按钮

建议中文文案：

* 页面标题：`项目`
* 字段：
  * `分支`
  * `未提交变更`
  * `最近会话`
* 操作：
  * `进入项目`
  * `新建会话`

### 4.4 会话列表页

页面目标：

* 在一个项目内选择会话

核心功能组件：

1. 会话列表
2. 会话状态标签
3. 模型字段
4. 最近活跃时间
5. 新建会话按钮
6. 恢复会话按钮
7. 重命名入口

建议中文文案：

* 页面标题：`会话`
* 操作：
  * `新建会话`
  * `恢复会话`
  * `重命名`
* 字段：
  * `状态`
  * `模型`
  * `最近活跃`

### 4.5 会话详情页

这是手机端最核心页面。

页面目标：

* 远程查看 Claude Code 输出并继续输入

固定页面结构：

1. 顶栏
2. 主消息流
3. 底部输入区
4. 底部抽屉 / 侧滑面板

顶栏展示：

* 项目名
* 会话名
* 当前状态
* 模型名

主消息流展示：

* 用户消息
* 助手消息
* 命令执行卡片
* 工具结果卡片
* 文件触达卡片
* 错误卡片
* 审批卡片
* 系统状态条

底部输入区：

* 输入框
* 发送按钮
* 快捷动作按钮

抽屉展示：

* Git 状态
* 文件触达列表
* Token
* Cost
* Context Window

建议中文文案：

* 顶部状态：
  * `运行中`
  * `等待审批`
  * `已完成`
  * `异常`
* 抽屉标签：
  * `Git 状态`
  * `文件触达`
  * `用量`
* 快捷动作：
  * `查看改动`
  * `查看 Git`
  * `查看用量`

### 4.6 审批中心页

页面目标：

* 集中处理等待中的审批请求

核心功能组件：

1. 审批请求列表
2. 风险说明
3. 所属项目与会话
4. 目标路径或命令
5. 操作按钮：`拒绝`、`稍后处理`
6. 降级提示：`回到主机继续处理`

建议中文文案：

* 页面标题：`审批`
* 卡片字段：
  * `工具`
  * `原因`
  * `目标`
  * `所属项目`
  * `所属会话`
* 操作：
  * `拒绝`
  * `稍后处理`
* 提示：
  * `部分操作需回到主机继续处理`

### 4.7 设置页

页面目标：

* 账号与连接信息、主题与基础设置

核心功能组件：

1. 当前连接主机
2. 当前设备信息
3. 主题切换
4. 通知设置
5. 关于页入口

---

## 5. 统一组件清单

为了让所有设计图看起来属于同一套系统，下面这些组件应该反复复用。

### 5.1 状态卡

适用：

* Host 在线状态
* Claude 运行状态
* Tailscale 状态
* 认证状态

视觉特征：

* 窄高卡片
* 左侧标题
* 右侧状态 pill
* 辅助说明一行

### 5.2 列表项卡片

适用：

* 项目列表
* 会话列表
* 设备列表
* 审批列表

视觉特征：

* 标题 + 副标题
* 右侧元信息
* 底部操作行
* 轻边框而非重卡片

### 5.3 命令卡片

适用：

* shell 命令
* 工具执行

视觉特征：

* 类终端区块
* 命令名 / 工具名
* 输出摘要
* 时间或状态

### 5.4 文件触达卡片

适用：

* 文件变更提示

展示：

* 文件路径
* 类型：新增 / 修改 / 删除
* 增删行数

### 5.5 审批卡片

展示：

* 工具名
* 原因
* 目标路径 / 命令
* 所属项目
* 所属会话
* 操作按钮

### 5.6 底部抽屉

适用：

* Git 状态
* 文件触达
* 用量信息

标签建议：

* `Git 状态`
* `文件触达`
* `用量`

---

## 6. 统一中文文案基线

为了保证所有出图内容一致，建议优先复用这批文案。

### 6.1 通用状态

* `在线`
* `离线`
* `运行中`
* `等待审批`
* `已完成`
* `异常`
* `已停止`

### 6.2 主机端

* `主机状态`
* `项目管理`
* `会话列表`
* `绑定与访问`
* `初始化 RemoteCC`
* `添加项目`
* `复制地址`
* `刷新二维码`
* `吊销设备`

### 6.3 手机端

* `主机`
* `项目`
* `会话`
* `审批`
* `设置`
* `新建会话`
* `恢复会话`
* `重命名`
* `查看改动`
* `查看 Git`
* `查看用量`

### 6.4 审批相关

* `拒绝`
* `稍后处理`
* `部分操作需回到主机继续处理`
* `请求访问工作区外路径`
* `请求执行命令`

### 6.5 用量相关

* `Token`
* `成本`
* `上下文窗口`
* `最近活跃`
* `未提交变更`

---

## 7. 绘图模型统一约束

下面这些要求，应该体现在每一张图里：

### 7.1 正向约束

* 高保真真实产品 UI
* 简体中文界面
* warm neutral palette
* Claude 风格启发，但完全原创
* 高级生产力软件感
* 中等偏高信息密度
* 工程控制台而非社交软件
* 可落地的产品布局

### 7.2 负面约束

所有图统一避免：

* purple AI gradients
* cyberpunk
* neon glow
* hacker black theme
* social chat app style
* Discord / Telegram / WhatsApp clone
* startup landing page
* hero banner
* oversized illustration
* cartoon UI
* glassmorphism overload
* fake 3D icons
* copied Claude logo
* noisy decorative patterns
* empty concept art

---

## 8. 完整提示词

下面每一条都是“可直接单独投喂”的完整 prompt。

## 8.1 图 1：主机端 Web 管理页总览

```text
请生成一张高保真的桌面端 Web App 设计图，产品是 RemoteCC-console，一个运行在 Linux 主机上的 Claude Code 远程控制台的本地管理页。这个页面不是营销页，而是真实的主机侧管理界面。界面语言默认使用简体中文。页面采用左侧导航栏 + 右侧主内容区布局，主内容区需要同时展示：主机在线状态、Claude Code 运行状态、认证上下文状态、Tailscale 连接状态、已注册项目数量、运行中会话数量、最近会话列表、最近审批摘要，以及一个带二维码的移动端绑定区域和已绑定设备列表。整体风格参考 Claude 的 App / Web 气质，但不要复制品牌元素，要原创。画面要安静、克制、温暖中性、高级、真实、专业，像一个高质量生产力软件。使用米白、暖灰、浅沙色、石墨灰、低饱和绿色和琥珀色，细边框，柔和阴影，8px 左右圆角，排版精致，信息密度较高但不拥挤，强调结构化信息层次。界面中使用简体中文文案，例如“主机状态”“项目管理”“会话列表”“绑定与访问”“在线”“运行中”“最近活跃”“已绑定设备”。

Negative prompt: purple AI gradients, cyberpunk, neon glow, hacker terminal poster, generic startup landing page, hero banner, oversized illustration, cartoon UI, glassmorphism overload, social media dashboard, fake 3D icons, gaming interface, noisy background, copied Claude logo, excessive colorfulness, empty whitespace-heavy concept art, messy typography, fantasy controls, English-only UI.
```

## 8.2 图 2：主机端初始化页

```text
请生成一张高保真的桌面端初始化页面设计图，产品是 RemoteCC-console 的 Linux 主机本地管理页。界面语言默认使用简体中文。这个页面用于第一次启动时完成环境检查与绑定引导。画面采用两栏式布局，左侧是步骤列表，右侧是当前步骤详情。步骤区需要依次展示：“检查 Claude Code”“检查认证上下文”“检查 Tailscale”“初始化本地数据库”“添加首个项目”“生成绑定信息”。右侧详情区展示检查结果卡片、状态说明、成功和警告状态、首个项目目录输入区，以及生成移动端二维码和绑定码的区域。整体风格要像高质量的桌面生产力软件，安静、克制、温暖中性、高级，参考 Claude 的 Web 气质但完全原创。使用简体中文界面，米白和浅沙色底色，石墨灰文字，低饱和绿色和琥珀色状态提示，细边框，柔和阴影，优雅排版，真实可落地的产品感。

Negative prompt: installation wizard from Windows 7, cartoon setup flow, enterprise blue template, purple gradient SaaS, generic cloud dashboard, consumer onboarding illustration, neon status lights, hacker black terminal scene, cluttered admin page, gamified badges, fake code rain, logo imitation, dramatic perspective mockup, English-only UI.
```

## 8.3 图 3：主机端项目管理页

```text
请生成一张高保真的桌面端项目管理页面设计图，产品是 RemoteCC-console，一个 Linux 主机上的 Claude Code 远程控制台。界面语言默认使用简体中文。页面用于管理主机端手动登记的项目目录。页面需要包含：顶部搜索框、添加项目按钮、项目列表、项目详情抽屉。每个项目项至少展示：项目名称、项目路径、Git 分支、未提交变更数、最近活跃会话。详情抽屉中展示该项目的会话列表和 Git 状态摘要。界面要体现“只允许访问已登记项目”的安全边界感，但不能做成沉重的安全产品。整体风格参考 Claude 的安静高级感，原创、不复制品牌。采用温暖中性色、浅米白背景、浅灰米色面板、深石墨灰文字、克制的状态色、轻卡片、细边框、紧凑但舒适的信息布局。简体中文文案示例：“项目管理”“添加项目”“项目路径”“Git 分支”“未提交变更”“最近活跃会话”“查看状态”“移除项目”。

Negative prompt: generic table-only enterprise admin, giant empty dashboard, purple startup app, bright blue Atlassian-style page, developer meme aesthetic, hacker green-on-black, stock illustration side panel, unrealistic 3D mockup, rounded bubble toy UI, noisy charts, decorative gradients, copied Claude branding, visual clutter, English-only UI.
```

## 8.4 图 4：主机端绑定与访问页

```text
请生成一张高保真的桌面端“绑定与访问”页面设计图，产品是 RemoteCC-console 的 Linux 主机本地管理页。界面语言默认使用简体中文。页面需要突出展示移动端连接信息和设备管理能力，包括：当前 Tailscale 访问地址卡片、二维码区域、绑定码区域、主机信任状态、已绑定移动设备列表、吊销设备按钮。页面应该让人感觉“可信、安全、安静、高级”，但不是安全营销海报，而是真实产品设置页。整体视觉风格参考 Claude 的 calm app / web 气质，原创，不复制 logo。采用暖白、浅沙色、石墨灰、低饱和琥珀色和绿色，细边框、柔和阴影、紧凑设置行、轻卡片、优雅排版。简体中文文案示例：“绑定与访问”“访问地址”“绑定码”“已绑定设备”“复制地址”“刷新二维码”“吊销设备”“最近连接”。

Negative prompt: fintech banking dashboard, cyber security poster, black hacker scene, giant shield icon, neon security graphics, generic QR-code promo page, glossy 3D icons, cartoon lock illustrations, purple gradient SaaS, social app invite screen, noisy decorative patterns, copied Claude logo, English-only UI.
```

## 8.5 图 5：手机端 Host / Project 列表页

```text
请生成一张高保真的手机端界面设计图，产品是 RemoteCC-console，一个通过 Tailscale 远程连接 Linux 主机并控制 Claude Code 的移动端控制台。界面语言默认使用简体中文。这个页面用于浏览主机与项目，不是普通聊天界面。画面采用 iPhone 风格竖屏构图，需要展示：在线主机卡片、连接质量状态、Linux 主机信息、已登记项目列表。每个项目项需要展示项目名称、Git 分支、未提交变更数、最近会话预览，并提供进入项目或新建会话的入口。整体风格要像一个高级、安静、克制的移动生产力工具，参考 Claude 的移动端和网页气质，但完全原创。使用暖白背景、石灰米色卡片、深石墨灰文字、低饱和状态标签、细分隔线、信息密度较高但清晰。简体中文文案示例：“主机”“项目”“在线”“最近活跃”“分支”“未提交变更”“最近会话”“进入项目”“新建会话”。

Negative prompt: WhatsApp, Telegram, Discord, consumer messenger, playful finance app, colorful mobile banking dashboard, giant icons, cartoon illustrations, neon gradients, glassmorphism overload, influencer app aesthetics, generic app store marketing shot, copied Claude logo, oversaturated colors, English-only UI.
```

## 8.6 图 6：手机端会话详情主界面

```text
请生成一张高保真的手机端会话详情页设计图，产品是 RemoteCC-console，一个用于远程控制 Linux 主机上 Claude Code 的 AI Coding 控制台。界面语言默认使用简体中文。这个页面是产品核心，不是普通聊天软件。采用 iPhone 风格竖屏界面，顶部栏展示项目名、会话名、状态、模型名；中间主消息流展示用户消息、助手消息、命令执行卡片、工具结果卡片、文件触达卡片、错误卡片、审批卡片；底部是输入框和发送按钮；底部抽屉半展开，展示 Git 状态、文件触达、Token、成本、上下文窗口。页面里还要有一个温和的系统提示条，表达“部分操作需回到主机继续处理”。整体视觉必须安静、克制、温暖中性、高级、真实，参考 Claude 的 App / Web 视觉气质但完全原创。要有精致排版、细边框、柔和阴影、结构化卡片、工程控制台感，而不是社交气泡聊天。简体中文文案示例：“运行中”“等待审批”“查看改动”“查看 Git”“查看用量”“Git 状态”“文件触达”“Token”“成本”“上下文窗口”“部分操作需回到主机继续处理”。

Negative prompt: social chat app, Telegram clone, Discord clone, WhatsApp clone, giant speech bubbles, anime UI, cyberpunk terminal, hacker black theme, neon glow, overly playful app, purple AI gradient cards, giant mascot illustrations, empty concept art, copied Claude branding, excessive blur, glossy consumer app style, English-only UI.
```

## 8.7 图 7：手机端审批请求界面

```text
请生成一张高保真的手机端审批状态界面设计图，产品是 RemoteCC-console，场景是 Linux 主机上的 Claude Code 触发了原生权限请求，移动端正在展示审批卡片。界面语言默认使用简体中文。采用 iPhone 风格竖屏界面，仍然保留会话上下文：顶部展示项目名、会话名、当前状态；中间消息流中突出一张审批卡片；审批卡片必须显示工具名、原因、目标路径或命令、所属项目、所属会话，并提供两个符合当前 MVP 的操作按钮：“拒绝”“稍后处理”。同时要有一条克制的系统提示：“部分操作需回到主机继续处理”。整体视觉应安静、可信、克制、高级，参考 Claude 的优雅产品气质，但完全原创。采用暖白底色、石灰米色卡片、石墨灰文字、低饱和琥珀色警示、克制的深红色拒绝按钮、细边框、精致排版、真实产品感。

Negative prompt: alarming red emergency UI, fintech fraud alert style, cartoon warning popup, giant exclamation icons, cyber security poster, neon alert glow, gaming modal, dramatic danger interface, social messenger UI, purple SaaS gradient, copied Claude logo, cluttered admin dashboard, fake sci-fi holograms, English-only UI.
```

## 8.8 图 8：双端联动展示图

```text
请生成一张双端联动的高保真产品设计展示图，产品是 RemoteCC-console。左侧是 Linux 主机本地 Web 管理页，右侧是手机端远程会话界面。两侧界面必须明显属于同一套设计系统，界面语言默认使用简体中文。左侧桌面端需要展示：主机状态、Tailscale 状态、已注册项目、会话列表、二维码、已绑定设备；右侧手机端需要展示：会话详情、结构化消息流、命令卡片、审批卡片、底部用量抽屉。整体要像真实产品设计展示，不是营销海报，不是空概念图。视觉风格参考 Claude 的 App / Web 气质，但完全原创。统一使用温暖中性色、高级排版、精致分隔、柔和阴影、细边框、结构化信息布局，让两端看起来像同一个高质量 AI Coding 控制台产品。

Negative prompt: startup marketing landing page, mockup floating in dramatic 3D space, glossy keynote slide, giant slogan text, cyberpunk split-screen, overdecorated presentation board, neon gradients, stock illustrations, copied Claude branding, cartoon graphics, fake device renders with no usable UI detail, dark hacker style, English-only UI.
```

---

## 9. 推荐出图顺序

为了先把整体设计系统定住，建议按这个顺序生成：

1. 图 6：手机端会话详情主界面
2. 图 1：主机端 Web 管理页总览
3. 图 7：手机端审批请求界面
4. 图 8：双端联动展示图
5. 图 3：主机端项目管理页
6. 图 4：主机端绑定与访问页
7. 图 5：手机端 Host / Project 列表页
8. 图 2：主机端初始化页

---

## 10. 如果第一轮效果不理想，怎么补词

### 10.1 太像普通聊天软件

在原 prompt 末尾补：

```text
这不是社交聊天软件，而是结构化 AI Coding 控制台，包含命令卡片、Git 状态、文件触达、用量信息和审批状态。
```

### 10.2 太像营销概念稿

在原 prompt 末尾补：

```text
请做成真实可用的软件界面，而不是营销海报，要有可信的操作结构和工程工具气质。
```

### 10.3 太黑太冷

在原 prompt 末尾补：

```text
使用温暖、柔和、克制的中性色，不要做成黑客终端风格。
```

### 10.4 中文显示不稳定

在原 prompt 末尾补：

```text
界面文案默认使用简体中文，允许使用清晰可读、接近真实产品的伪中文排版。
```

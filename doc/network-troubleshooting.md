# 网络访问问题排查与方案讨论

## 问题描述

手机端无法访问主机上的 Agent Console 服务。目标：手机在任意网络下（校园 WiFi、4G/5G、家庭 WiFi）都能访问主机上运行的 Daemon（8787）和前端 dev server（4173/4174）。

## 当前环境

| 项目 | 值 |
|------|-----|
| 主机系统 | Ubuntu Linux, 校园网 |
| 主机局域网 IP | `10.96.211.107/16`（校园网 DHCP） |
| 公网 IP | `58.216.176.206`（校园网 NAT 出口，不稳定） |
| 代理软件 | Clash Verge (Mihomo)，TUN 模式，fake-ip |
| 代理虚拟网卡 | `Meta` 接口 `198.18.0.1` |
| Tailscale IP | `100.112.95.15` |
| 手机 | Xiaomi MI-11, Android |

## 方案一：Tailscale — 当前不可用

### 现象

- `tailscale status` 显示手机 `active; relay "sin"`（新加坡中继）
- `tailscale ping 100.106.77.15` 全部超时，**0 字节往返**
- 即使 relay 已建立，实际数据传输也失败

### 根因分析

1. **对称 NAT（Symmetric NAT）**
   - `MappingVariesByDestIP: true` 确认了这一点
   - 校园网 NAT 对每个目标 IP/端口分配不同的公网端口，P2P 打洞不可能
   - 这意味着 Tailscale **只能依赖 DERP 中继**，无法直连

2. **无国内 DERP 节点**
   - 最近节点：Tokyo 237ms, Hong Kong 236ms, Singapore 269ms
   - 其余都在欧美，延迟 180-400ms
   - 官方不提供中国大陆 DERP 服务器

3. **Clash TUN 模式干扰**
   - Mihomo 以 TUN 模式运行（`Meta` 虚拟网卡 `198.18.0.1`）
   - fake-ip 模式会将 DNS 解析重定向到 fake-ip 段
   - Tailscale 的 `tailscale0` 接口流量可能被 Clash 规则劫持或丢弃
   - `no_proxy` 只包含 `127.0.0.1,localhost,::1`，不包含 `100.x.x.x`（Tailscale CGNAT 段）

4. **校园网深度包检测（DPI）**
   - 部分校园网会检测并限制 VPN/隧道类流量
   - Tailscale 使用 WireGuard 协议（UDP），可能被 QoS 限速或丢弃
   - DERP relay 使用 HTTPS WebSocket，理论上有公网 IP 就该通，但实际 ping 超时说明连接已被中断

### 可能的修复尝试

- [ ] **Clash 规则排除 Tailscale**：在 Mihomo 配置中添加 `100.64.0.0/10` → DIRECT
- [ ] **自建 DERP 服务器**：在国内云服务器（阿里云/腾讯云）部署 DERP，解决无国内节点问题
- [ ] **更换为 Headscale + 自建 DERP**：完全自控，但维护成本高

### 可行性评估

即使修复 Clash 规则排除 Tailscale 流量，仍面临：
- 对称 NAT → 只能走中继
- 中继在国外 → 延迟高 + 校园网可能丢包
- 自建 DERP → 需要一台有公网 IP 的国内服务器（额外成本）

**结论：Tailscale 在当前校园网环境下不是可靠方案。**

---

## 方案二：校园网局域网直连 — 不适合

### 方案

手机和电脑连同一校园网 WiFi，通过局域网 IP `10.96.211.107:4174` 访问。

### 问题

- 校园网可能有 **AP 隔离（Client Isolation）**，设备间无法互访
- 手机不可能始终连校园网（外出时需要 4G/5G）
- 校园网 DHCP IP 可能变化

**结论：只能作为开发调试时的临时方案。**

---

## 方案三：内网穿透（推荐）

### 方案 A：Cloudflare Tunnel（免费，推荐）

| 优点 | 缺点 |
|------|------|
| 免费，无需公网 IP | 依赖 Cloudflare 服务可用性 |
| 自动 HTTPS | WebSocket 支持需要额外配置 |
| 不暴露主机 IP | 国内访问速度可能较慢 |
| 零配置防火墙穿透 | 域名绑定 Cloudflare |
| 稳定，生产级 | 需要域名（免费域名也行） |

**步骤概要：**
1. 注册 Cloudflare 账号，添加域名（或用免费的 `*.trycloudflare.com`）
2. 安装 `cloudflared`
3. 创建 Tunnel，映射到 `localhost:8787`
4. 手机通过 `https://xxx.your-domain.com` 访问

**WebSocket 注意：** Cloudflare Tunnel 默认支持 WebSocket，但需要确认配置。

### 方案 B：frp（frpc/frps）

| 优点 | 缺点 |
|------|------|
| 国内开源，文档丰富 | 需要一台有公网 IP 的服务器 |
| 完全自主控制 | 服务器成本（最低 ~30元/月） |
| TCP/UDP/HTTP/HTTPS 全支持 | 需要自行维护 |
| 延迟可控（选国内服务器） | 安全性需自行保障 |
| WebSocket 原生支持 | |

**步骤概要：**
1. 租一台国内 VPS（阿里云轻量/腾讯云轻量，公网 IP）
2. VPS 上运行 `frps`（服务端）
3. 主机上运行 `frpc`（客户端），配置：
   ```ini
   [common]
   server_addr = your-vps-ip
   server_port = 7000

   [daemon-api]
   type = tcp
   local_ip = 127.0.0.1
   local_port = 8787
   remote_port = 8787

   [mobile-web]
   type = tcp
   local_ip = 127.0.0.1
   local_port = 4174
   remote_port = 4174
   ```
4. 手机通过 `http://your-vps-ip:4174` 访问

### 方案 C：ngrok（快速验证）

| 优点 | 缺点 |
|------|------|
| 一行命令启动 | 免费版域名随机、每次重启变化 |
| 无需任何配置 | 免费版限速、限连接数 |
| 适合临时测试 | 国内访问可能较慢 |
| 支持 WebSocket | 不适合长期使用 |

```bash
ngrok http 4174
```

---

## 方案四：Cloudflare Tunnel + PWA（最佳长期方案）

结合方案三 A，长期推荐：

1. **Cloudflare Tunnel** 暴露 daemon（8787）
2. **前端 build 后由 daemon 提供静态文件服务**（或 Cloudflare Pages）
3. 手机 PWA 安装后通过 `https://your-domain.com` 访问
4. HTTPS + PWA = 完整的移动端体验

这样架构变为：

```
手机浏览器/PWA
    ↓ HTTPS
Cloudflare Edge
    ↓ Tunnel (加密)
主机 Daemon (8787)
    ├── REST API
    ├── WebSocket（通过 Cloudflare Tunnel 透传）
    └── 静态文件（build 后的前端）
```

### 需要的改动

- [ ] Daemon 添加静态文件服务（serve 前端 build 产物）
- [ ] 配置 Cloudflare Tunnel
- [ ] 前端 build 时注入正确的 `VITE_DAEMON_URL`（相对路径，同源）

---

## 方案对比

| 方案 | 成本 | 延迟 | 稳定性 | 配置难度 | 适用场景 |
|------|------|------|--------|----------|----------|
| Tailscale | 免费 | 高/不可用 | 差 | 低 | 家庭网络 |
| 校园网直连 | 免费 | 低 | 差 | 无 | 临时调试 |
| Cloudflare Tunnel | 免费 | 中 | 高 | 中 | **长期方案** |
| frp | ~30元/月 | 低 | 高 | 中 | 有 VPS |
| ngrok | 免费/付费 | 中 | 中 | 极低 | 临时测试 |

## 建议下一步

1. **立即**：用 ngrok 快速验证手机能否正常使用完整功能
2. **短期**：配置 Cloudflare Tunnel（免费、稳定、长期可用）
3. **长期**：Cloudflare Tunnel + 前端静态文件集成到 Daemon

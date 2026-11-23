# 更新日志

## 1.0.5 — 2026-11-23

### 新增

- 默认清单加入 **`dsh-context`（上下文面板）**，归入「功能」组、默认开启。

### 变更

- 所有 npm 条目的锁定版本刷新到当前最新：
  `dsh-boot-suite` 2.16.5 → **2.16.13**、`deep-whale-manager` 0.1.8 → **0.1.11**、
  `maid-atelier` 0.1.9 → **0.1.12**、`dsh-mnemon` 0.5.39 → **0.5.53**、
  `dsh-mcp-panel` 0.6.29 → **0.6.35**，新增 `dsh-context` **0.87.1**。
  （`dafy-whale-theme` 2.1.0、`dsh-whale-widget` 0.4.2、`dsh-media-serve` 0.2.4 已是最新。）
- 清单由 9 项增至 10 项，README 表格同步。

## 1.0.4 — 2026-11-05

### 新增

- **清单支持 GitHub 来源**：`catalog.js` 新增 `kind: 'github'`，「一键下载缺失」会把
  `github:owner/repo` 原样交给宿主安装。
- **新增「开屏动画」**：`dsh-splash-animation`（`github:KDDKBD/DeepSeek-splash-animation`），
  归入外观组、**默认关闭**，与「开机动画套件」的开场动画二选一。
- 设置页对 GitHub 来源的插件显示 `GitHub` 徽章。

### 变更

- `dsh-boot-suite` 的锁定版本 **2.16.2 → 2.16.5**，避免「一键下载缺失」把已升级的用户装回旧版。
- README 清单表由 8 项更新为 9 项，补充 GitHub 来源的安装与二选一说明。

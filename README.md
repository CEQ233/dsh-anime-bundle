# dsh-anime-bundle · 二次元大肥鱼模式

> **第三方插件，非 DeepSeek / DSH 官方出品。**
> 与「大肥鱼」人设、`dafy-whale-theme`、`dsh-boot-suite` 的作者（LeeRolling / 沈宏宏）**没有隶属、授权或合作关系**。
> 本插件只是把你**自己**装的这套二次元外观插件编排成一个开关；默认清单里每个插件的版权归各自作者所有，
> 本包**不打包**它们的任何代码、素材或字体。

一个设置页，把「这一套二次元外观」当成一个整体来管：总开关、人格开关、插件清单、一键装回缺失、检查更新。

- **模式总开关**：一键关掉 / 恢复整套二次元外观。关闭时记住当前组合，再开启按这份组合恢复；想换基准点「记住当前组合」。
- **肥鱼娘人格**：打开后把人格段落注入系统提示词，关闭立刻回到正常模式；下一条消息生效，不用重启。设置页有自检，会读一遍组装后的提示词确认段落进去了。
- **插件清单**：默认 8 个，可单独开关；显示版本、未安装、本地链接、可更新。
- **添加 / 移除插件**：「添加插件」列出**已安装但不在清单里**的第三方插件，可加入外观或功能组；每行的 `×` 只把条目从清单移除，**不卸载、不改开关**；「恢复默认清单」一键还原。
- **一键下载缺失**：按清单里的锁定版本把缺的插件装回来，并把原本开着的重新打开。
- **检查更新 / 更新全部**：走 npm 仓库比对最新版；更新时按 DSH 官方路径「先卸载、再安装」（宿主 `installBundle` 只用于新增，已在 profile 里的包会被拒绝），安装失败自动把旧版本装回去。
- **自检**：提示词、状态文件、插件清单各查一遍，结果直接显示在页面上。

## 安装

```bash
# 普通 DSH
dsh plugin --profile <profile> add dsh-anime-bundle
```

桌面端：**设置 → 插件 → 添加插件**，输入 `dsh-anime-bundle`。

本地开发（指向克隆目录）：

```bash
dsh plugin --profile desktop add "link:<克隆下来的目录>"
```

装完刷新页面；Host 侧改代码要在「设置 → 插件」里把这个插件关一次再开（或重启 DSH），Client 侧改代码刷新页面即可。

## 入口

设置 → **大肥鱼模式**（与「启动动画」「聊天背景」同一列）。

## 默认清单

| 插件 | 分组 | 锁定版本 |
|---|---|---|
| `dafy-whale-theme` 蓝色大肥鱼主题 | 外观 | 2.1.0 |
| `dsh-whale-widget` 鲸鱼挂件 | 外观 | 0.4.2 |
| `dsh-boot-suite` 开机动画套件 | 外观 | 2.16.2 |
| `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager` 皮肤管理器 | 外观 | 0.1.8 |
| `@smalltailqwq/dsh-client-ui-skin-maid-atelier` 深海女仆工坊 | 外观 | 0.1.9 |
| `dsh-mnemon` 记忆 | 功能 | 0.5.39 |
| `dsh-media-serve` 媒体服务 | 功能 | 0.2.4 |
| `dsh-mcp-panel` MCP 面板 | 功能 | 0.6.29 |

这些**都不随本插件打包**，是安装时从 npm 单独拉取的第三方包。

## 增删规则

- 只列 `installed: true` 的第三方 bundle；`@deepseek-ai/*` 和官方插件不在这里管，请去「设置 → 插件」。
- 加入时把当前版本记成 `pin`（npm）或本地路径（link），「一键下载缺失」按这个版本装回来。
- 移除只是从清单里拿掉，**不卸载、不改开关**；想彻底卸载请用「设置 → 插件」。
- 移除默认条目后再加回来，会恢复它原本的分组（外观 / 功能）。

## 状态

`` `~/.dsh/dafy-mode.json` `` —— 人格开关、模式开关、记住的组合、更新检查结果、运行期增删的 `added` / `removed`。

> 文件名的 `dafy-mode` 是历史遗留标识（与内部路由 `/dafy-mode/*` 一起保留），为了从早期版本升级时不丢设置。
> 包名、设置页显示名与它的含义无关。

## 它做了什么（安全说明）

- 所有开关都走 DSH 官方的插件管理路径（`pluginManager.setBundleEnabled`），和「设置 → 插件」按钮等价。
- 「一键下载缺失 / 更新全部」会让宿主用 pnpm 从 `registry.npmjs.org`（或你配置的镜像）安装清单里的包，
  安装内容完全由清单决定；不会执行清单以外的下载。
- Host 侧只读写 `~/.dsh/dafy-mode.json`，不访问网络、不收集任何数据。

## 开发

| 想改什么 | 改哪里 |
|---|---|
| 人格口癖、称呼、开场白 | `persona.js` 的 `PERSONA_TEXT` |
| 默认清单、锁定版本、默认开关 | `catalog.js` 的 `MANAGED` |
| 运行期加 / 减插件 | 设置页「添加插件」/ 每行的 `×` / 「恢复默认清单」 |
| 页面文案（中 / 英） | `client.js` 顶部的 `zh` / `en` |
| 设置页名称、图标、描述 | `locale/zh.json`、`locale/en.json`、`icon.svg` |

## 许可与致谢

MIT（只覆盖本插件自己的代码与文案）。

默认清单里的插件由其各自作者发布并按各自许可分发；「大肥鱼 / 肥鱼娘」相关设定与素材的所有权归原作者。
本插件不包含、也不再分发这些素材。

---

## English

A settings page that treats your anime skin stack as one switch: toggle the whole look, flip a
persona prompt on/off, see every managed plugin's version, reinstall what's missing, and check for
updates — all through DSH's own plugin-manager APIs.

**Unofficial.** Not affiliated with or endorsed by DeepSeek, DSH, or the authors of the plugins in
the default list (`dafy-whale-theme`, `dsh-boot-suite`, the whale skins). Those packages keep their
own licenses and are installed separately from npm — none of their code or assets are bundled here.

```bash
dsh plugin --profile <profile> add dsh-anime-bundle
```

Then open **Settings → 大肥鱼模式**.

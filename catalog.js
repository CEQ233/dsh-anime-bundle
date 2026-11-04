/**
 * 「大肥鱼模式」的默认插件清单（发布时的默认组合）。
 * 设置页可以运行期增删：增删记录存在 ~/.dsh/dafy-mode.json 的 added / removed，
 * 这里只负责开箱默认值，不用为了增删改代码。
 *
 * kind:
 *   - npm   ：走 npm 仓库安装，pin 是装回来时锁定的版本（保证"一键下载"复刻现在的组合）
 *   - link  ：本机目录 link 安装，装不回来时给出明确提示
 *   - github：走 GitHub 仓库安装，spec 是 pnpm 的 git 形式（本机需要可用的 git）
 * group:
 *   - mode ：二次元外观，归"大肥鱼模式"总开关管
 *   - util ：功能插件，只做单独开关，不随总开关走
 */
export const MANAGED = [
  {
    name: 'dafy-whale-theme',
    title: '蓝色大肥鱼主题',
    note: '整站海洋蓝配色、鱼群、气泡和每日鱼语',
    group: 'mode',
    kind: 'npm',
    pin: '2.1.0',
    defaultEnabled: false,
  },
  {
    name: 'dsh-whale-widget',
    title: '鲸鱼挂件',
    note: '桌面鲸鱼浮窗与状态挂件',
    group: 'mode',
    kind: 'npm',
    pin: '0.4.2',
    defaultEnabled: true,
  },
  {
    name: 'dsh-boot-suite',
    title: '开机动画套件',
    note: '六幕开机动画、模板与聊天壁纸',
    group: 'mode',
    kind: 'npm',
    pin: '2.16.5',
    defaultEnabled: true,
  },
  {
    name: 'dsh-splash-animation',
    title: '开屏动画',
    note: '启动时播放视频再渐隐；和「开机动画套件」的开场二选一，默认关闭',
    group: 'mode',
    kind: 'github',
    spec: 'github:KDDKBD/DeepSeek-splash-animation',
    defaultEnabled: false,
  },
  {
    name: '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager',
    title: '皮肤管理器',
    note: '切换已装皮肤、调每套皮肤自己的选项',
    group: 'mode',
    kind: 'npm',
    pin: '0.1.8',
    defaultEnabled: true,
  },
  {
    name: '@smalltailqwq/dsh-client-ui-skin-maid-atelier',
    title: '深海女仆工坊',
    note: '双女仆皮肤',
    group: 'mode',
    kind: 'npm',
    pin: '0.1.9',
    defaultEnabled: true,
  },
  {
    name: 'dsh-mnemon',
    title: 'Mnemon 记忆',
    note: '长期记忆、文档检索与热记忆注入',
    group: 'util',
    kind: 'npm',
    pin: '0.5.39',
    defaultEnabled: true,
  },
  {
    name: 'dsh-media-serve',
    title: '媒体服务',
    note: '本地图片 / 视频素材的同源静态服务',
    group: 'util',
    kind: 'npm',
    pin: '0.2.4',
    defaultEnabled: true,
  },
  {
    name: 'dsh-mcp-panel',
    title: 'MCP 面板',
    note: 'MCP 服务器的安装、探活与工具调用',
    group: 'util',
    kind: 'npm',
    pin: '0.6.29',
    defaultEnabled: true,
  },
]

/** 总开关只负责外观这一组。 */
export const MODE_PLUGINS = MANAGED.filter((entry) => entry.group === 'mode')

export const MANAGED_NAMES = new Set(MANAGED.map((entry) => entry.name))

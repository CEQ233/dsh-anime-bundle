/**
 * 二次元大肥鱼模式 · Client 半侧
 *
 * 一个「设置 → 大肥鱼模式」页面：
 *  - 模式总开关（二次元外观整套开 / 关，关的时候记住组合）
 *  - 大肥鱼人格开关（Host 侧注入系统提示词，无需重启）
 *  - 插件清单：单独开关、检查更新、一键下载缺失、更新全部
 */
window.__ModuleLoader__.load({
  id: 'dsh-anime-bundle',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useRef, useState } = React

    const NS = 'dafy-mode'
    const API = '/dafy-mode'
    const STYLE_ID = 'dsh-anime-bundle/styles'

    const zh = {
      section: '大肥鱼模式',
      title: '二次元大肥鱼模式',
      subtitle: '一键开关整套二次元插件，顺手把本鱼的人格请上来。',
      modeTitle: '模式总开关',
      modeOn: '已开启',
      modeOff: '普通模式',
      modeMixed: '部分开启',
      modeDescOn: '外观插件都在位。关闭会全部收起来，再开启时按上次记住的组合恢复。',
      modeDescOff: '当前是干净的普通界面。开启会恢复上次记住的那套组合。',
      modeDescMixed: '现在的插件状态和记住的组合不一致，点总开关可以重新对齐。',
      modeCount: '{on}/{total} 个外观插件在跑',
      remember: '记住当前组合',
      remembered: '已把当前组合记为「开启状态」。',
      realign: '重新对齐',
      personaTitle: '二次元大肥鱼人格',
      personaDesc: '开启后本鱼接管说话方式；关闭立即恢复正常。',
      personaOn: '人格已导入',
      personaOff: '正常模式',
      personaHint: '下一条消息生效，不用重启。',
      personaPreview: '看看本鱼怎么说话',
      personaChars: '约 {n} 字',
      pluginsTitle: '二次元外观',
      pluginsDesc: '归总开关管，也可以在这里单独开关。',
      utilsTitle: '功能插件',
      utilsDesc: '不随总开关走，只在这里单独开关。',
      check: '检查更新',
      install: '一键下载缺失',
      updateAll: '更新全部',
      enableAll: '全部启用',
      disableAll: '全部停用',
      refresh: '刷新',
      selfCheck: '自检',
      selfCheckPass: '自检通过 {pass}/{total}：{detail}',
      selfCheckFail: '自检 {pass}/{total}，发现问题：{detail}',
      pluginCount: '共 {n} 个',
      customBadge: '自定义',
      addPlugin: '添加插件',
      addTitle: '已安装、还没进清单',
      addDesc: '只改清单，不会安装或卸载任何东西。',
      addEmpty: '所有已安装的第三方插件都已经在清单里了。',
      addMode: '加入外观',
      addUtil: '加入功能',
      addBack: '加回清单',
      catalogBadge: '默认清单',
      addHint: '@deepseek-ai 的内置插件不在这里管，请去「设置 → 插件」。',
      resetList: '恢复默认清单',
      closePanel: '收起',
      remove: '移除',
      confirmRemove: '把「{title}」从清单移除？插件不会被卸载，当前的开关状态也不变。',
      removed: '已从清单移除「{title}」。插件还在，没有卸载。',
      added: '已把「{title}」加入「{group}」。',
      addedBack: '已把「{title}」加回默认清单。',
      addedGroupMode: '二次元外观',
      addedGroupUtil: '功能插件',
      resetDone: '已恢复默认清单。',
      selfTitle: '插件本体',
      selfDesc: '检查 dsh-anime-bundle 在 npm 上有没有新版本。',
      selfCheck: '检查本体更新',
      selfUpToDate: '已是最新',
      selfNewer: '可更新 {v}',
      selfCurrent: '当前 v{v}',
      selfLatest: '最新 v{v}',
      selfNever: '还没检查过本体更新',
      selfLast: '上次检查：{time}',
      selfNoCheck: '未检查',
      selfFound: '发现本体新版本 v{v}（当前 v{c}）。',
      selfLatestMsg: '本体已是最新 v{v}。',
      selfHint: '更新方法：设置 → 插件 → 卸载 dsh-anime-bundle 后重装；或命令行 dsh plugin remove dsh-anime-bundle 再 dsh plugin add dsh-anime-bundle@latest。',
      githubLink: 'GitHub 仓库',
      npmLink: 'npm 页面',
      confirmDisableAll: '这会停用清单里的所有插件（包括记忆、MCP 面板）。确定吗？',
      jobModeOn: '正在开启大肥鱼模式',
      jobModeOff: '正在关闭大肥鱼模式',
      jobAllOn: '正在启用全部插件',
      jobAllOff: '正在停用全部插件',
      jobInstall: '正在下载缺失插件',
      jobCheck: '正在检查更新',
      jobUpdate: '正在更新插件',
      jobDefault: '正在处理',
      jobDone: '完成',
      jobFailed: '失败',
      jobCancelled: '未开始',
      nothingToInstall: '清单里的插件都已经装好了。',
      nothingToUpdate: '没有可更新的插件。',
      upToDate: '已是最新',
      updateTo: '可更新 {v}',
      notInstalled: '未安装',
      incompatible: '版本不兼容',
      linkBadge: '本地链接',
      holdBadge: '慎升',
      enabled: '已启用',
      disabled: '已停用',
      restart: '需重启',
      verified: '已复核 {n} 次，状态一致。',
      verifyFail: '复核 {n} 次仍不一致：{list}',
      lastCheckNever: '还没检查过更新',
      lastCheckAt: '上次检查：{time}',
      checkedWith: '仓库：{registry}',
      loading: '正在读取插件状态…',
      loadFailed: '读取失败：{msg}',
      retry: '重试',
      errorTitle: '出错了',
      noticeTitle: '完成',
      dismiss: '知道了',
      progress: '{done}/{total}',
      footer: 'dsh-anime-bundle v{v} · 所有开关即时保存，改完不用重启',
      autoNote: '人格来自插件内置文案，可在 persona.js 里换成你自己的。',
      busy: '有任务在跑，先等它结束。',
      phaseEnable: '启用',
      phaseDisable: '停用',
      phaseInstall: '下载',
      phaseCheck: '检查',
      phaseUpdate: '更新',
    }

    const en = {
      section: 'Big Fish Mode',
      title: 'Anime Big Fish Mode',
      subtitle: 'One switch for the whole anime plugin set, plus the Big Fish persona.',
      modeTitle: 'Master switch',
      modeOn: 'On',
      modeOff: 'Normal mode',
      modeMixed: 'Partially on',
      modeDescOn: 'Visual plugins are in place. Turning it off stows them and remembers the combo.',
      modeDescOff: 'Clean, plain interface. Turning it on restores the combo you last remembered.',
      modeDescMixed: 'Plugin state differs from the remembered combo. Click the switch to realign.',
      modeCount: '{on}/{total} visual plugins running',
      remember: 'Remember this combo',
      remembered: 'Saved the current combo as the "on" state.',
      realign: 'Realign',
      personaTitle: 'Anime Big Fish persona',
      personaDesc: 'Turns the fish into your assistant; off goes straight back to normal.',
      personaOn: 'Persona imported',
      personaOff: 'Normal mode',
      personaHint: 'Takes effect on the next message, no restart.',
      personaPreview: 'Hear how the fish talks',
      personaChars: 'about {n} chars',
      pluginsTitle: 'Anime visuals',
      pluginsDesc: 'Controlled by the master switch, and individually toggleable here.',
      utilsTitle: 'Utility plugins',
      utilsDesc: 'Not part of the master switch; toggle them individually.',
      check: 'Check updates',
      install: 'Install missing',
      updateAll: 'Update all',
      enableAll: 'Enable all',
      disableAll: 'Disable all',
      refresh: 'Refresh',
      selfCheck: 'Self-check',
      selfCheckPass: 'Self-check passed {pass}/{total}: {detail}',
      selfCheckFail: 'Self-check {pass}/{total}, problems: {detail}',
      pluginCount: '{n} total',
      customBadge: 'Custom',
      addPlugin: 'Add plugin',
      addTitle: 'Installed, not in the list',
      addDesc: 'Only edits the list — nothing gets installed or uninstalled.',
      addEmpty: 'Every installed third-party plugin is already in the list.',
      addMode: 'Add to visuals',
      addUtil: 'Add to utilities',
      addBack: 'Restore',
      catalogBadge: 'Default',
      addHint: '@deepseek-ai built-ins are managed in Settings → Plugins, not here.',
      resetList: 'Reset list',
      closePanel: 'Close',
      remove: 'Remove',
      confirmRemove: 'Remove "{title}" from the list? It stays installed, and its on/off state is unchanged.',
      removed: 'Removed "{title}" from the list. The plugin is still installed.',
      added: 'Added "{title}" to {group}.',
      addedBack: 'Restored "{title}" to the default list.',
      addedGroupMode: 'visuals',
      addedGroupUtil: 'utilities',
      resetDone: 'Default list restored.',
      selfTitle: 'This plugin',
      selfDesc: 'Check npm for a newer version of dsh-anime-bundle.',
      selfCheck: 'Check plugin update',
      selfUpToDate: 'Up to date',
      selfNewer: 'Update {v}',
      selfCurrent: 'Current v{v}',
      selfLatest: 'Latest v{v}',
      selfNever: 'Never checked this plugin for updates',
      selfLast: 'Last check: {time}',
      selfNoCheck: 'Not checked',
      selfFound: 'A newer version v{v} is available (current v{c}).',
      selfLatestMsg: 'This plugin is up to date at v{v}.',
      selfHint: 'To update: Settings → Plugins → remove dsh-anime-bundle, then reinstall; or run dsh plugin remove dsh-anime-bundle followed by dsh plugin add dsh-anime-bundle@latest.',
      githubLink: 'GitHub repo',
      npmLink: 'npm page',
      confirmDisableAll: 'This disables every plugin in the list, including memory and the MCP panel. Continue?',
      jobModeOn: 'Turning Big Fish Mode on',
      jobModeOff: 'Turning Big Fish Mode off',
      jobAllOn: 'Enabling all plugins',
      jobAllOff: 'Disabling all plugins',
      jobInstall: 'Installing missing plugins',
      jobCheck: 'Checking for updates',
      jobUpdate: 'Updating plugins',
      jobDefault: 'Working',
      jobDone: 'Done',
      jobFailed: 'Failed',
      jobCancelled: 'Not started',
      nothingToInstall: 'Everything in the list is already installed.',
      nothingToUpdate: 'No updates available.',
      upToDate: 'Up to date',
      updateTo: 'Update {v}',
      notInstalled: 'Not installed',
      incompatible: 'Incompatible',
      linkBadge: 'Local link',
      holdBadge: 'Hold',
      enabled: 'Enabled',
      disabled: 'Disabled',
      restart: 'Restart needed',
      verified: 'Verified {n} time(s), state matches.',
      verifyFail: 'Still mismatched after {n} checks: {list}',
      lastCheckNever: 'Never checked for updates',
      lastCheckAt: 'Last check: {time}',
      checkedWith: 'Registry: {registry}',
      loading: 'Reading plugin status…',
      loadFailed: 'Failed to load: {msg}',
      retry: 'Retry',
      errorTitle: 'Something went wrong',
      noticeTitle: 'Done',
      dismiss: 'Got it',
      progress: '{done}/{total}',
      footer: 'dsh-anime-bundle v{v} · every switch saves immediately, no restart needed',
      autoNote: 'The persona ships in persona.js — edit it to make the fish sound like yours.',
      busy: 'A task is running. Wait for it to finish.',
      phaseEnable: 'Enable',
      phaseDisable: 'Disable',
      phaseInstall: 'Install',
      phaseCheck: 'Check',
      phaseUpdate: 'Update',
    }

    const CSS = `
.dfm-panel { max-width: 820px; margin: 0 auto; padding: 2px 0 52px; color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 1.55; }
.dfm-panel *, .dfm-panel *::before, .dfm-panel *::after { box-sizing: border-box; }
.dfm-hero { display: flex; align-items: center; gap: 14px; padding: 18px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px; background: var(--dsw-alias-bg-layer-1); background: radial-gradient(130% 150% at 0% 0%, color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent), transparent 58%), var(--dsw-alias-bg-layer-1); }
.dfm-hero-icon { width: 44px; height: 44px; flex: 0 0 44px; display: grid; place-items: center; border-radius: 13px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); }
.dfm-hero-text { min-width: 0; flex: 1; }
.dfm-title { margin: 0; font-size: 18px; line-height: 1.3; font-weight: 650; letter-spacing: .01em; }
.dfm-sub { margin: 3px 0 0; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.dfm-tag { flex: 0 0 auto; font-size: 11.5px; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); }
.dfm-tag--on { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent); }
.dfm-card { margin-top: 12px; padding: 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); }
.dfm-mode-head { display: flex; align-items: flex-start; gap: 16px; }
.dfm-mode-text { flex: 1; min-width: 0; }
.dfm-card-title { font-size: 14px; font-weight: 600; }
.dfm-muted { color: var(--dsw-alias-label-secondary); font-size: 12.5px; margin-top: 2px; }
.dfm-mode-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.dfm-count { font-size: 12px; color: var(--dsw-alias-label-secondary); margin-left: auto; }
.dfm-switch { position: relative; flex: 0 0 auto; width: 40px; height: 24px; padding: 0; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); cursor: pointer; transition: background .15s ease, border-color .15s ease; }
.dfm-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.22); transition: transform .15s ease; }
.dfm-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); border-color: transparent; }
.dfm-switch[aria-checked="true"]::after { transform: translateX(16px); }
.dfm-switch:disabled { opacity: .45; cursor: not-allowed; }
.dfm-switch:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.dfm-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.dfm-actions--split { align-items: center; }
.dfm-btn { height: 30px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-primary); font-size: 12.5px; font-family: inherit; cursor: pointer; }
.dfm-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dfm-btn:disabled { opacity: .45; cursor: not-allowed; }
.dfm-btn--primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; }
.dfm-btn--primary:hover:not(:disabled) { background: var(--dsw-alias-brand-primary); filter: brightness(1.06); }
.dfm-btn--ghost { border-color: transparent; color: var(--dsw-alias-label-secondary); padding: 0 8px; }
.dfm-btn--ghost:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
.dfm-section { margin-top: 22px; }
.dfm-section-head h3 { margin: 0; font-size: 13px; font-weight: 600; }
.dfm-section-head p { margin: 2px 0 8px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dfm-section-head--row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.dfm-section-head--row p { margin-bottom: 0; }
.dfm-section-tools { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.dfm-row-remove { flex: 0 0 auto; width: 24px; height: 24px; padding: 0; border-radius: 7px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 16px; line-height: 1; cursor: pointer; }
.dfm-row-remove:hover:not(:disabled) { color: var(--dsw-alias-state-error-primary); background: var(--dsw-alias-bg-layer-2); }
.dfm-row-remove:disabled { opacity: .4; cursor: not-allowed; }
.dfm-add { margin: 2px 0 10px; }
.dfm-add-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.dfm-add-list { margin-top: 10px; display: flex; flex-direction: column; max-height: 320px; overflow: auto; border-top: 1px solid var(--dsw-alias-border-l1); }
.dfm-add-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dfm-add-row:last-child { border-bottom: 0; }
.dfm-add-actions { display: flex; gap: 6px; flex: 0 0 auto; }
.dfm-add-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; }
.dfm-empty { margin-top: 10px; padding: 14px; text-align: center; font-size: 12px; color: var(--dsw-alias-label-secondary); border: 1px dashed var(--dsw-alias-border-l1); border-radius: 10px; }
.dfm-list { border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); padding: 0 16px; }
.dfm-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--dsw-alias-border-l1); }
.dfm-row:first-child { border-top: 0; }
.dfm-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 7px; background: var(--dsw-alias-state-idle-primary); }
.dfm-dot--on { background: var(--dsw-alias-state-success-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 18%, transparent); }
.dfm-row-main { flex: 1; min-width: 0; }
.dfm-row-title { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; font-size: 13px; font-weight: 550; }
.dfm-note { margin-top: 1px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.dfm-pkg { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; color: var(--dsw-alias-label-secondary); opacity: .8; }
.dfm-badges { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.dfm-badge { font-size: 10.5px; line-height: 1; padding: 3px 6px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.dfm-badge--update { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); }
.dfm-badge--warn { color: var(--dsw-alias-state-warn-primary); }
.dfm-badge--on { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent); }
.dfm-badge--off { color: var(--dsw-alias-label-secondary); }
.dfm-job { margin-top: 12px; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); }
.dfm-job-head { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 550; }
.dfm-job-head .dfm-count { margin-left: auto; }
.dfm-bar { height: 4px; margin-top: 10px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.dfm-bar > i { display: block; height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary); transition: width .25s ease; }
.dfm-job-current { margin-top: 8px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dfm-results { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; max-height: 148px; overflow: auto; }
.dfm-results li { display: flex; gap: 6px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.dfm-results li b { font-weight: 550; color: var(--dsw-alias-label-primary); }
.dfm-results li em { font-style: normal; color: var(--dsw-alias-state-success-primary); }
.dfm-results li.is-bad em { color: var(--dsw-alias-state-error-primary); }
.dfm-banner { display: flex; gap: 8px; align-items: flex-start; margin-top: 12px; padding: 10px 12px; border-radius: 10px; font-size: 12.5px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); }
.dfm-banner--error { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, var(--dsw-alias-bg-layer-1)); }
.dfm-banner--ok { border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent); color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, var(--dsw-alias-bg-layer-1)); }
.dfm-banner-text { flex: 1; min-width: 0; color: var(--dsw-alias-label-primary); }
.dfm-details { margin-top: 10px; }
.dfm-details summary { cursor: pointer; font-size: 12px; color: var(--dsw-alias-label-secondary); user-select: none; }
.dfm-details summary:hover { color: var(--dsw-alias-label-primary); }
.dfm-persona-text { margin: 8px 0 0; padding: 10px 12px; border-radius: 10px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; max-height: 220px; overflow: auto; }
.dfm-self { margin-top: 14px; }
.dfm-self-version { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dfm-self-links { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 8px; font-size: 11.5px; }
.dfm-self-links a { color: var(--dsw-alias-brand-primary); text-decoration: none; }
.dfm-self-links a:hover { text-decoration: underline; }
.dfm-foot { margin-top: 18px; font-size: 11px; color: var(--dsw-alias-label-secondary); text-align: center; }
.dfm-loading { padding: 40px 0; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12.5px; }
@media (max-width: 560px) { .dfm-hero { align-items: flex-start; } .dfm-tag { display: none; } .dfm-section-head--row { flex-direction: column; align-items: stretch; } .dfm-section-tools { justify-content: flex-end; } }
`

    function installStyles() {
      const existing = document.getElementById(STYLE_ID)
      if (existing) return () => {}
      const el = document.createElement('style')
      el.id = STYLE_ID
      el.textContent = CSS
      document.head.appendChild(el)
      return () => {
        try {
          el.remove()
        } catch {
          /* 页面卸载时忽略 */
        }
      }
    }

    function fmt(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (whole, key) =>
        values && Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole,
      )
    }

    function timeText(timestamp) {
      if (!timestamp) return ''
      try {
        const date = new Date(timestamp)
        const pad = (n) => String(n).padStart(2, '0')
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
      } catch {
        return ''
      }
    }

    async function request(path, options) {
      let lastError = null
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(`${API}${path}`, {
            cache: 'no-store',
            ...options,
            headers: {
              accept: 'application/json',
              ...(options && options.body ? { 'content-type': 'application/json' } : {}),
            },
          })
          const payload = await response.json().catch(() => null)
          if (!payload) throw new Error(`HTTP ${response.status}`)
          if (!payload.ok) throw new Error(payload.error || `HTTP ${response.status}`)
          return payload
        } catch (error) {
          lastError = error
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)))
        }
      }
      throw lastError || new Error('请求失败')
    }

    function FishIcon({ size = 28 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': true },
        h('path', {
          d: 'M13 31c-4-5-7-9-7-9s6-1 10 1c3 2 4 6 4 6s-1 4-4 6c-4 2-10 1-10 1s3-4 7-5z',
          fill: '#3E63E8',
        }),
        h('path', {
          d: 'M16 30c0-9 8-16 20-16 13 0 21 7 21 17 0 11-9 18-21 18-12 0-20-8-20-19z',
          fill: '#4C74F5',
        }),
        h('path', {
          d: 'M22 38c3 6 8 9 15 9 8 0 14-4 17-10-3 8-9 12-17 12-8 0-13-4-15-11z',
          fill: '#DCE6FF',
          opacity: 0.92,
        }),
        h('circle', { cx: 46, cy: 28, r: 4.6, fill: '#fff' }),
        h('circle', { cx: 46.8, cy: 28.4, r: 2.5, fill: '#12224F' }),
        h('circle', { cx: 47.7, cy: 27.2, r: 1, fill: '#fff' }),
        h('ellipse', { cx: 41, cy: 35, rx: 3.4, ry: 2.2, fill: '#FF9BB5', opacity: 0.75 }),
      )
    }

    function Toggle({ checked, disabled, onChange, label }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        className: 'dfm-switch',
        'aria-checked': checked ? 'true' : 'false',
        'aria-label': label,
        disabled,
        onClick: disabled ? undefined : onChange,
      })
    }

    function Badge({ children, tone }) {
      return h('span', { className: `dfm-badge${tone ? ` dfm-badge--${tone}` : ''}` }, children)
    }

    function PluginRow({ row, t, busy, onToggle, onRemove }) {
      const parts = []
      if (row.installed && row.version) parts.push(h(Badge, { key: 'v' }, `v${row.version}`))
      if (!row.installed) parts.push(h(Badge, { key: 'missing', tone: 'warn' }, t('notInstalled')))
      if (row.incompatible) parts.push(h(Badge, { key: 'bad', tone: 'warn' }, t('incompatible')))
      if (row.custom) parts.push(h(Badge, { key: 'custom' }, t('customBadge')))
      if (row.kind === 'link') parts.push(h(Badge, { key: 'link' }, t('linkBadge')))
      if (row.update && row.update.newer) {
        parts.push(h(Badge, { key: 'upd', tone: 'update' }, fmt(t('updateTo'), { v: row.update.latest })))
      }
      if (row.hold) parts.push(h(Badge, { key: 'hold', tone: 'warn' }, t('holdBadge')))

      return h(
        'div',
        { className: 'dfm-row' },
        h('span', { className: `dfm-dot${row.enabled ? ' dfm-dot--on' : ''}` }),
        h(
          'div',
          { className: 'dfm-row-main' },
          h(
            'div',
            { className: 'dfm-row-title' },
            h('span', null, row.title),
            h('span', { className: 'dfm-pkg' }, row.name),
          ),
          h('div', { className: 'dfm-note' }, row.note || ''),
        ),
        h('div', { className: 'dfm-badges' }, parts),
        h(Toggle, {
          checked: row.enabled,
          disabled: busy || !row.installed,
          label: `${row.title} ${row.enabled ? t('enabled') : t('disabled')}`,
          onChange: () => onToggle(row),
        }),
        h(
          'button',
          {
            type: 'button',
            className: 'dfm-row-remove',
            title: t('remove'),
            'aria-label': `${t('remove')} ${row.title}`,
            disabled: busy,
            onClick: () => onRemove(row),
          },
          '×',
        ),
      )
    }

    function AddPanel({ t, items, busy, onAdd, onReset, onClose }) {
      return h(
        'section',
        { className: 'dfm-card dfm-add' },
        h(
          'div',
          { className: 'dfm-add-head' },
          h(
            'div',
            null,
            h('div', { className: 'dfm-card-title' }, t('addTitle')),
            h('div', { className: 'dfm-muted' }, t('addDesc')),
          ),
          h('button', { type: 'button', className: 'dfm-btn dfm-btn--ghost', onClick: onClose }, t('closePanel')),
        ),
        items.length === 0
          ? h('div', { className: 'dfm-empty' }, t('addEmpty'))
          : h(
              'div',
              { className: 'dfm-add-list' },
              items.map((item) =>
                h(
                  'div',
                  { key: item.name, className: 'dfm-add-row' },
                  h(
                    'div',
                    { className: 'dfm-row-main' },
                    h(
                      'div',
                      { className: 'dfm-row-title' },
                      h('span', null, item.title),
                      h('span', { className: 'dfm-pkg' }, item.name),
                    ),
                    h('div', { className: 'dfm-note' }, item.note || ''),
                    h(
                      'div',
                      { className: 'dfm-badges' },
                      item.version ? h(Badge, { key: 'v' }, `v${item.version}`) : null,
                      item.enabled ? h(Badge, { key: 'on', tone: 'on' }, t('enabled')) : null,
                      item.inCatalog ? h(Badge, { key: 'cat' }, t('catalogBadge')) : null,
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dfm-add-actions' },
                    item.inCatalog
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'dfm-btn',
                            disabled: busy,
                            onClick: () => onAdd(item.name, 'util'),
                          },
                          t('addBack'),
                        )
                      : [
                          h(
                            'button',
                            {
                              key: 'mode',
                              type: 'button',
                              className: 'dfm-btn',
                              disabled: busy,
                              onClick: () => onAdd(item.name, 'mode'),
                            },
                            t('addMode'),
                          ),
                          h(
                            'button',
                            {
                              key: 'util',
                              type: 'button',
                              className: 'dfm-btn',
                              disabled: busy,
                              onClick: () => onAdd(item.name, 'util'),
                            },
                            t('addUtil'),
                          ),
                        ],
                  ),
                ),
              ),
            ),
        h(
          'div',
          { className: 'dfm-add-foot' },
          h('span', { className: 'dfm-note' }, t('addHint')),
          h('button', { type: 'button', className: 'dfm-btn dfm-btn--ghost', disabled: busy, onClick: onReset }, t('resetList')),
        ),
      )
    }

    function JobCard({ job, t, onDismiss }) {
      const running = job.status === 'running'
      const labelKey =
        job.kind === 'mode-on'
          ? 'jobModeOn'
          : job.kind === 'mode-off'
            ? 'jobModeOff'
            : job.kind === 'all-on'
              ? 'jobAllOn'
              : job.kind === 'all-off'
                ? 'jobAllOff'
                : job.kind === 'install'
                  ? 'jobInstall'
                  : job.kind === 'check'
                    ? 'jobCheck'
                    : job.kind === 'update'
                      ? 'jobUpdate'
                      : 'jobDefault'
      const percent = job.total > 0 ? Math.min(100, Math.round((job.done / job.total) * 100)) : 0
      const statusText = running ? t('progress') : job.status === 'done' ? t('jobDone') : t('jobFailed')
      const results = (job.results || []).slice(-8).reverse()

      return h(
        'section',
        { className: 'dfm-job' },
        h(
          'div',
          { className: 'dfm-job-head' },
          h('span', null, running ? t(labelKey) : job.status === 'done' ? t('jobDone') : t('jobFailed')),
          h('span', { className: 'dfm-count' }, fmt(statusText, { done: job.done, total: job.total })),
          !running
            ? h('button', { type: 'button', className: 'dfm-btn dfm-btn--ghost', onClick: onDismiss }, t('dismiss'))
            : null,
        ),
        h('div', { className: 'dfm-bar' }, h('i', { style: { width: `${percent}%` } })),
        job.message ? h('div', { className: 'dfm-job-current' }, job.message) : null,
        job.current ? h('div', { className: 'dfm-job-current' }, `${job.phase ? t(`phase${job.phase.charAt(0).toUpperCase()}${job.phase.slice(1)}`) : ''} ${job.current}`.trim()) : null,
        job.verify
          ? h(
              'div',
              { className: 'dfm-job-current' },
              job.verify.consistent
                ? t('verified').replace('{n}', String(job.verify.attempts))
                : fmt(t('verifyFail'), {
                    n: job.verify.attempts,
                    list: (job.verify.mismatches || []).map((item) => item.name).join(', ') || '?',
                  }),
            )
          : null,
        results.length
          ? h(
              'ul',
              { className: 'dfm-results' },
              results.map((item, index) =>
                h(
                  'li',
                  { key: `${item.name}-${index}`, className: item.ok ? '' : 'is-bad' },
                  h('em', null, item.ok ? '✓' : '×'),
                  h('b', null, item.name),
                  h('span', null, item.message || ''),
                ),
              ),
            )
          : null,
      )
    }

    function Panel({ t }) {
      const [data, setData] = useState(null)
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const [pending, setPending] = useState(false)
      const [hiddenJob, setHiddenJob] = useState('')
      const [addOpen, setAddOpen] = useState(false)
      const noticeTimer = useRef(0)

      const load = useCallback(async (quiet) => {
        try {
          const payload = await request('/state')
          setData(payload)
          if (!quiet) setError('')
          return payload
        } catch (err) {
          if (!quiet) setError(String((err && err.message) || err))
          return null
        }
      }, [])

      useEffect(() => {
        load(false)
      }, [load])

      const job = data && data.job && data.job.id !== hiddenJob ? data.job : null
      const jobRunning = Boolean(job && job.status === 'running')

      useEffect(() => {
        if (!jobRunning) return undefined
        const timer = setInterval(() => {
          load(true)
        }, 900)
        return () => clearInterval(timer)
      }, [jobRunning, load])

      const showNotice = useCallback((text) => {
        setNotice(text)
        if (noticeTimer.current) clearTimeout(noticeTimer.current)
        noticeTimer.current = setTimeout(() => setNotice(''), 6000)
      }, [])

      useEffect(() => () => {
        if (noticeTimer.current) clearTimeout(noticeTimer.current)
      }, [])

      const busy = pending || jobRunning

      const post = useCallback(
        async (path, body) => {
          setPending(true)
          setError('')
          try {
            const payload = await fetch(`${API}${path}`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body || {}),
            }).then(async (response) => {
              const json = await response.json().catch(() => null)
              if (!json) throw new Error(`HTTP ${response.status}`)
              if (!json.ok) throw new Error(json.error || `HTTP ${response.status}`)
              return json
            })
            if (payload.state) setData(payload.state)
            else await load(true)
            return payload
          } catch (err) {
            setError(String((err && err.message) || err))
            return null
          } finally {
            setPending(false)
          }
        },
        [load],
      )

      const toggleMode = useCallback(async () => {
        if (!data) return
        await post('/action', { action: 'set-mode', enabled: !data.mode.on })
      }, [data, post])

      const togglePersona = useCallback(async () => {
        if (!data) return
        const payload = await post('/persona', { enabled: !data.persona.enabled })
        if (payload) showNotice(payload.state && payload.state.persona.enabled ? t('personaOn') : t('personaOff'))
      }, [data, post, showNotice, t])

      const togglePlugin = useCallback(
        async (row) => {
          await post('/action', { action: 'set-plugin', name: row.name, enabled: !row.enabled })
        },
        [post],
      )

      const addPlugin = useCallback(
        async (name, group) => {
          const payload = await post('/action', { action: 'add-plugin', name, group })
          if (!payload || !payload.result) return
          const result = payload.result
          const rows = (payload.state && payload.state.plugins) || []
          const row = rows.find((item) => item.name === name)
          if (result.restored) {
            showNotice(fmt(t('addedBack'), { title: row ? row.title : name }))
          } else if (result.entry) {
            showNotice(
              fmt(t('added'), {
                title: result.entry.title,
                group: result.entry.group === 'mode' ? t('addedGroupMode') : t('addedGroupUtil'),
              }),
            )
          }
        },
        [post, showNotice, t],
      )

      const removePlugin = useCallback(
        async (row) => {
          if (!window.confirm(fmt(t('confirmRemove'), { title: row.title }))) return
          const payload = await post('/action', { action: 'remove-plugin', name: row.name })
          if (payload) showNotice(fmt(t('removed'), { title: row.title }))
        },
        [post, showNotice, t],
      )

      const resetList = useCallback(async () => {
        const payload = await post('/action', { action: 'reset-list' })
        if (payload) showNotice(t('resetDone'))
      }, [post, showNotice, t])

      const setAll = useCallback(
        async (enabled) => {
          if (!enabled && !window.confirm(t('confirmDisableAll'))) return
          await post('/action', { action: 'set-all', enabled })
        },
        [post, t],
      )

      const remember = useCallback(async () => {
        const payload = await post('/action', { action: 'remember' })
        if (payload) showNotice(t('remembered'))
      }, [post, showNotice, t])

      const selfCheck = useCallback(async () => {
        const payload = await post('/action', { action: 'self-check' })
        if (!payload || !payload.result) return
        const result = payload.result
        const detail = (result.checks || [])
          .map((check) => `${check.ok ? '✓' : '×'} ${check.message}`)
          .join('；')
        showNotice(
          fmt(t(result.ok ? 'selfCheckPass' : 'selfCheckFail'), {
            pass: result.passed,
            total: result.total,
            detail,
          }),
        )
      }, [post, showNotice, t])

      const realign = useCallback(async () => {
        await post('/action', { action: 'set-mode', enabled: true })
      }, [post])

      const checkSelf = useCallback(async () => {
        const payload = await post('/action', { action: 'check-self-update' })
        if (!payload || !payload.result) return
        const result = payload.result
        showNotice(
          result.newer
            ? fmt(t('selfFound'), { v: result.latest, c: result.current })
            : fmt(t('selfLatestMsg'), { v: result.latest }),
        )
      }, [post, showNotice, t])

      if (!data) {
        return h(
          'div',
          { className: 'dfm-panel' },
          error
            ? h(
                'div',
                { className: 'dfm-banner dfm-banner--error' },
                h('div', { className: 'dfm-banner-text' }, fmt(t('loadFailed'), { msg: error })),
                h('button', { type: 'button', className: 'dfm-btn', onClick: () => load(false) }, t('retry')),
              )
            : h('div', { className: 'dfm-loading' }, t('loading')),
        )
      }

      const modeTag = data.mode.on ? (data.mode.aligned ? t('modeOn') : t('modeMixed')) : t('modeOff')
      const modeDesc = data.mode.on
        ? data.mode.aligned
          ? t('modeDescOn')
          : t('modeDescMixed')
        : t('modeDescOff')
      const modeRows = data.plugins.filter((row) => row.group === 'mode')
      const utilRows = data.plugins.filter((row) => row.group === 'util')
      const selfInfo = data.self || {
        name: 'dsh-anime-bundle',
        version: '?',
        latest: null,
        checkedAt: 0,
        newer: false,
        repoUrl: null,
        npmUrl: 'https://www.npmjs.com/package/dsh-anime-bundle',
      }
      const lastCheck = data.updates.checkedAt
        ? fmt(t('lastCheckAt'), { time: timeText(data.updates.checkedAt) })
        : t('lastCheckNever')

      return h(
        'div',
        { className: 'dfm-panel' },
        h(
          'header',
          { className: 'dfm-hero' },
          h('div', { className: 'dfm-hero-icon' }, h(FishIcon, { size: 28 })),
          h(
            'div',
            { className: 'dfm-hero-text' },
            h('h2', { className: 'dfm-title' }, t('title')),
            h('p', { className: 'dfm-sub' }, t('subtitle')),
          ),
          h('span', { className: `dfm-tag${data.mode.on ? ' dfm-tag--on' : ''}` }, modeTag),
        ),

        error
          ? h(
              'div',
              { className: 'dfm-banner dfm-banner--error' },
              h('div', { className: 'dfm-banner-text' }, error),
              h('button', { type: 'button', className: 'dfm-btn', onClick: () => load(false) }, t('retry')),
            )
          : null,
        notice
          ? h(
              'div',
              { className: 'dfm-banner dfm-banner--ok' },
              h('div', { className: 'dfm-banner-text' }, notice),
            )
          : null,

        h(
          'section',
          { className: 'dfm-card' },
          h(
            'div',
            { className: 'dfm-mode-head' },
            h(
              'div',
              { className: 'dfm-mode-text' },
              h('div', { className: 'dfm-card-title' }, t('modeTitle')),
              h('div', { className: 'dfm-muted' }, modeDesc),
            ),
            h(Toggle, {
              checked: data.mode.on,
              disabled: busy,
              label: t('modeTitle'),
              onChange: toggleMode,
            }),
          ),
          h(
            'div',
            { className: 'dfm-mode-meta' },
            data.mode.on && !data.mode.aligned
              ? h('button', { type: 'button', className: 'dfm-btn', disabled: busy, onClick: realign }, t('realign'))
              : null,
            data.mode.on
              ? h('button', { type: 'button', className: 'dfm-btn', disabled: busy, onClick: remember }, t('remember'))
              : null,
            h('span', { className: 'dfm-count' }, fmt(t('modeCount'), {
              on: data.mode.enabledCount,
              total: data.mode.totalCount,
            })),
          ),
        ),

        h(
          'section',
          { className: 'dfm-card' },
          h(
            'div',
            { className: 'dfm-mode-head' },
            h(
              'div',
              { className: 'dfm-mode-text' },
              h('div', { className: 'dfm-card-title' }, t('personaTitle')),
              h('div', { className: 'dfm-muted' }, t('personaDesc')),
            ),
            h(Toggle, {
              checked: data.persona.enabled,
              disabled: pending,
              label: t('personaTitle'),
              onChange: togglePersona,
            }),
          ),
          h(
            'div',
            { className: 'dfm-mode-meta' },
            h(Badge, { tone: data.persona.enabled ? 'on' : 'off' }, data.persona.enabled ? t('personaOn') : t('personaOff')),
            h('span', { className: 'dfm-count' }, data.persona.enabled ? t('personaHint') : ''),
          ),
          h(
            'details',
            { className: 'dfm-details' },
            h('summary', null, `${t('personaPreview')} · ${fmt(t('personaChars'), { n: data.persona.chars })}`),
            h('div', { className: 'dfm-persona-text' }, data.persona.preview),
            h('div', { className: 'dfm-note', style: { marginTop: '6px' } }, t('autoNote')),
          ),
        ),

        h(
          'div',
          { className: 'dfm-actions dfm-actions--split' },
          h('button', { type: 'button', className: 'dfm-btn dfm-btn--primary', disabled: busy, onClick: () => post('/action', { action: 'check-updates' }) }, t('check')),
          h('button', { type: 'button', className: 'dfm-btn', disabled: busy, onClick: () => post('/action', { action: 'install-missing' }) }, t('install')),
          h('button', { type: 'button', className: 'dfm-btn', disabled: busy, onClick: () => post('/action', { action: 'update-all' }) }, t('updateAll')),
          h('span', { style: { flex: 1 } }),
          h('button', { type: 'button', className: 'dfm-btn', disabled: busy, onClick: () => setAll(true) }, t('enableAll')),
          h('button', { type: 'button', className: 'dfm-btn', disabled: busy, onClick: () => setAll(false) }, t('disableAll')),
          h('button', { type: 'button', className: 'dfm-btn dfm-btn--ghost', disabled: pending, onClick: selfCheck }, t('selfCheck')),
          h('button', { type: 'button', className: 'dfm-btn dfm-btn--ghost', disabled: busy, onClick: () => load(true) }, t('refresh')),
        ),
        h('div', { className: 'dfm-note', style: { marginTop: '6px' } }, lastCheck),

        job ? h(JobCard, { job, t, onDismiss: () => setHiddenJob(job.id) }) : null,

        h(
          'section',
          { className: 'dfm-section' },
          h(
            'div',
            { className: 'dfm-section-head dfm-section-head--row' },
            h(
              'div',
              null,
              h('h3', null, t('pluginsTitle')),
              h('p', null, t('pluginsDesc')),
            ),
            h(
              'div',
              { className: 'dfm-section-tools' },
              h('span', { className: 'dfm-count' }, fmt(t('pluginCount'), { n: data.plugins.length })),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dfm-btn dfm-btn--primary',
                  disabled: busy,
                  onClick: () => setAddOpen((open) => !open),
                },
                t('addPlugin'),
              ),
            ),
          ),
          addOpen
            ? h(AddPanel, {
                t,
                items: data.available || [],
                busy,
                onAdd: addPlugin,
                onReset: resetList,
                onClose: () => setAddOpen(false),
              })
            : null,
          h('div', { className: 'dfm-list' }, modeRows.map((row) => h(PluginRow, {
            key: row.name,
            row,
            t,
            busy,
            onToggle: togglePlugin,
            onRemove: removePlugin,
          }))),
        ),

        h(
          'section',
          { className: 'dfm-section' },
          h('div', { className: 'dfm-section-head' }, h('h3', null, t('utilsTitle')), h('p', null, t('utilsDesc'))),
          h('div', { className: 'dfm-list' }, utilRows.map((row) => h(PluginRow, {
            key: row.name,
            row,
            t,
            busy,
            onToggle: togglePlugin,
            onRemove: removePlugin,
          }))),
        ),

        h(
          'section',
          { className: 'dfm-card dfm-self' },
          h(
            'div',
            { className: 'dfm-mode-head' },
            h(
              'div',
              { className: 'dfm-mode-text' },
              h(
                'div',
                { className: 'dfm-card-title' },
                t('selfTitle'),
                ' ',
                h('span', { className: 'dfm-pkg' }, selfInfo.name),
              ),
              h('div', { className: 'dfm-muted' }, t('selfDesc')),
            ),
            h(
              'button',
              { type: 'button', className: 'dfm-btn', disabled: busy, onClick: checkSelf },
              t('selfCheck'),
            ),
          ),
          h(
            'div',
            { className: 'dfm-mode-meta' },
            h(
              Badge,
              { tone: selfInfo.newer ? 'update' : selfInfo.latest ? 'on' : undefined },
              selfInfo.newer
                ? fmt(t('selfNewer'), { v: selfInfo.latest })
                : selfInfo.latest
                  ? t('selfUpToDate')
                  : t('selfNoCheck'),
            ),
            h('span', { className: 'dfm-self-version' }, fmt(t('selfCurrent'), { v: selfInfo.version })),
            selfInfo.latest
              ? h('span', { className: 'dfm-self-version' }, fmt(t('selfLatest'), { v: selfInfo.latest }))
              : null,
            h(
              'span',
              { className: 'dfm-count' },
              selfInfo.checkedAt
                ? fmt(t('selfLast'), { time: timeText(selfInfo.checkedAt) })
                : t('selfNever'),
            ),
          ),
          selfInfo.newer ? h('div', { className: 'dfm-note', style: { marginTop: '8px' } }, t('selfHint')) : null,
          h(
            'div',
            { className: 'dfm-self-links' },
            selfInfo.repoUrl
              ? h(
                  'a',
                  { href: selfInfo.repoUrl, target: '_blank', rel: 'noreferrer' },
                  `${t('githubLink')} ↗`,
                )
              : null,
            h(
              'a',
              { href: selfInfo.npmUrl, target: '_blank', rel: 'noreferrer' },
              `${t('npmLink')} ↗`,
            ),
          ),
        ),

        h('div', { className: 'dfm-foot' }, fmt(t('footer'), { v: selfInfo.version })),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-anime-bundle: locale')
        ctx.effect(() => installStyles(), 'dsh-anime-bundle: styles')
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'dafy-mode',
              order: 27,
              label: () => t('section'),
              locale: NS,
            },
            () => h(Panel, { t }),
          ),
        )
      },
    }
  },
})

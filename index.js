/**
 * 二次元大肥鱼模式 · Host 半侧
 *
 * 三件事：
 *  1. 提供 /dafy-mode/* 同源路由，给设置页读取插件状态、执行开关 / 下载 / 更新；
 *  2. 用 ctx.pluginManager 真正去改 profile（和「设置 → 插件」走同一条官方路径）；
 *  3. 用 ctx.systemPrompt.section 注入「大肥鱼人格」，开 / 关都不需要重启。
 */
import { randomUUID } from 'node:crypto'
import { promises as fsp } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { MANAGED } from './catalog.js'
import { PERSONA_PREVIEW, PERSONA_TEXT } from './persona.js'

export const name = 'dsh-anime-bundle'
/** webServer 提供路由；pluginManager 改 profile；systemPrompt 注入人格。 */
export const inject = ['webServer', 'pluginManager', 'systemPrompt']

const ROUTE = '/dafy-mode'
const SELF_NAME = 'dsh-anime-bundle'
const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const STATE_FILE = join(DSH_HOME, 'dafy-mode.json')
const VERIFY_ROUNDS = 3
const CATALOG_NAMES = new Set(MANAGED.map((entry) => entry.name))

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function defaultState() {
  return {
    version: 2,
    personaEnabled: false,
    modeOn: false,
    snapshot: null,
    updates: {},
    checkedAt: 0,
    registry: null,
    added: [],
    removed: [],
  }
}

function pickLocalized(value, fallback) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object') {
    for (const key of ['zh', 'zh-CN', 'zh-Hans', 'en']) {
      const text = value[key]
      if (typeof text === 'string' && text.trim()) return text.trim()
    }
    for (const text of Object.values(value)) {
      if (typeof text === 'string' && text.trim()) return text.trim()
    }
  }
  return fallback
}

function bundleTitle(bundle) {
  return pickLocalized(bundle && bundle.meta && bundle.meta.title, (bundle && bundle.name) || '未命名插件')
}

function bundleNote(bundle) {
  const text = pickLocalized(
    bundle && bundle.meta && bundle.meta.description,
    (bundle && bundle.description) || '',
  )
  return text.length > 120 ? `${text.slice(0, 120)}…` : text
}

function parseLinkSource(source) {
  if (typeof source !== 'string') return null
  const text = source.trim()
  if (!text.toLowerCase().startsWith('link:')) return null
  return text.slice(5).replace(/\\/g, '/')
}

/** 用户手动加进来的条目：只接受合法的形状，坏数据直接丢掉。 */
function normalizeAdded(value) {
  if (!Array.isArray(value)) return []
  const list = []
  const seen = new Set()
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const entryName = typeof item.name === 'string' ? item.name : ''
    if (!entryName || seen.has(entryName) || CATALOG_NAMES.has(entryName) || entryName === SELF_NAME) continue
    seen.add(entryName)
    const kind = item.kind === 'link' && typeof item.linkPath === 'string' ? 'link' : 'npm'
    const entry = {
      name: entryName,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : entryName,
      note: typeof item.note === 'string' ? item.note : '',
      group: item.group === 'mode' ? 'mode' : 'util',
      kind,
      defaultEnabled: item.defaultEnabled === true,
    }
    if (kind === 'link') entry.linkPath = String(item.linkPath).replace(/\\/g, '/')
    else if (typeof item.pin === 'string' && item.pin) entry.pin = item.pin
    list.push(entry)
  }
  return list
}

/** 默认清单 - 用户移除的 + 用户添加的。 */
function effectiveEntries(state) {
  const removed = new Set(state.removed)
  const entries = MANAGED.filter((entry) => !removed.has(entry.name)).map((entry) => ({ ...entry, source: 'catalog' }))
  const names = new Set(entries.map((entry) => entry.name))
  for (const entry of state.added) {
    if (names.has(entry.name)) continue
    names.add(entry.name)
    entries.push({ ...entry, source: 'added' })
  }
  return entries
}

async function loadState() {
  const base = defaultState()
  try {
    const raw = await fsp.readFile(STATE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return base
    const added = normalizeAdded(parsed.added)
    const removed = Array.isArray(parsed.removed)
      ? [...new Set(parsed.removed.filter((entryName) => typeof entryName === 'string' && CATALOG_NAMES.has(entryName)))]
      : []
    const knownNames = new Set([...CATALOG_NAMES, ...added.map((entry) => entry.name)])
    const snapshot = {}
    if (parsed.snapshot && typeof parsed.snapshot === 'object') {
      for (const entryName of knownNames) {
        if (typeof parsed.snapshot[entryName] === 'boolean') snapshot[entryName] = parsed.snapshot[entryName]
      }
    }
    const updates = {}
    if (parsed.updates && typeof parsed.updates === 'object') {
      for (const entryName of knownNames) {
        const entry = parsed.updates[entryName]
        if (entry && typeof entry === 'object') updates[entryName] = entry
      }
    }
    return {
      ...base,
      personaEnabled: parsed.personaEnabled === true,
      modeOn: parsed.modeOn === true,
      snapshot: Object.keys(snapshot).length > 0 ? snapshot : null,
      updates,
      checkedAt: Number(parsed.checkedAt) || 0,
      registry: typeof parsed.registry === 'string' ? parsed.registry : null,
      added,
      removed,
    }
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      console.warn('[dsh-anime-bundle] 读取状态失败，使用默认值：', error.message)
    }
    return base
  }
}

/* ------------------------------------------------------------------ */
/* 版本比较：够用就行，支持 1.2.3 / v1.2.3 / 1.2.3-beta.1               */
/* ------------------------------------------------------------------ */

function parseVersion(value) {
  const text = String(value || '').trim().replace(/^v/i, '')
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(text)
  if (!match) return null
  return {
    parts: [Number(match[1]), Number(match[2]), Number(match[3])],
    pre: match[4] || '',
  }
}

export function isNewer(candidate, current) {
  const a = parseVersion(candidate)
  const b = parseVersion(current)
  if (!a || !b) return false
  for (let i = 0; i < 3; i += 1) {
    if (a.parts[i] !== b.parts[i]) return a.parts[i] > b.parts[i]
  }
  if (a.pre === b.pre) return false
  if (a.pre && !b.pre) return false
  if (!a.pre && b.pre) return true
  return a.pre > b.pre
}

/* ------------------------------------------------------------------ */
/* HTTP 小工具                                                          */
/* ------------------------------------------------------------------ */

function sendJson(res, status, payload) {
  let body
  try {
    body = JSON.stringify(payload)
  } catch {
    body = '{"ok":false,"error":"response is not serializable"}'
  }
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readJsonBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('请求体太大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim()
      if (!text) return resolve({})
      try {
        resolve(JSON.parse(text))
      } catch {
        reject(new Error('请求体不是合法 JSON'))
      }
    })
    req.on('error', reject)
  })
}

/** 只接受同源页面发起的写操作。 */
function sameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true
  try {
    return new URL(origin).host === req.headers.host
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/* 插件状态                                                              */
/* ------------------------------------------------------------------ */

function describeChange(result) {
  if (!result) return '没有返回结果'
  if (result.error) {
    const code = result.error.code || 'unknown'
    const detail = result.error.diagnostic ? `：${result.error.diagnostic}` : ''
    return `${code}${detail}`
  }
  if (result.application === 'restart-required') return '已保存，需重启 DSH 生效'
  if (result.application === 'overridden') return '被更高优先级的配置层覆盖'
  if (result.application === 'failed') return '应用失败'
  return '已生效'
}

function createApi(ctx, state) {
  let saveTimer = null

  async function persist() {
    try {
      await fsp.mkdir(DSH_HOME, { recursive: true })
      const text = JSON.stringify(
        {
          version: 2,
          personaEnabled: state.personaEnabled,
          modeOn: state.modeOn,
          snapshot: state.snapshot,
          updates: state.updates,
          checkedAt: state.checkedAt,
          registry: state.registry,
          added: state.added,
          removed: state.removed,
        },
        null,
        2,
      )
      const tmp = `${STATE_FILE}.${process.pid}.tmp`
      await fsp.writeFile(tmp, text, 'utf8')
      await fsp.rename(tmp, STATE_FILE)
    } catch (error) {
      console.warn('[dsh-anime-bundle] 保存状态失败：', error.message)
    }
  }

  function schedulePersist() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      persist()
    }, 150)
  }

  async function listBundleMap() {
    const list = await ctx.pluginManager.listBundles()
    const map = new Map()
    for (const bundle of list || []) {
      if (bundle && typeof bundle.name === 'string') map.set(bundle.name, bundle)
    }
    return map
  }

  function pluginRows(map, entries) {
    return entries.map((entry) => {
      const bundle = map.get(entry.name)
      const version = bundle && typeof bundle.version === 'string' ? bundle.version : null
      const update = state.updates[entry.name]
      return {
        name: entry.name,
        title: entry.title,
        note: entry.note || '',
        group: entry.group,
        kind: entry.kind,
        custom: entry.source === 'added',
        hold: entry.hold || '',
        defaultEnabled: entry.defaultEnabled === true,
        installed: Boolean(bundle && bundle.installed),
        enabled: Boolean(bundle && bundle.enabled),
        removable: Boolean(bundle && bundle.removable),
        availability: (bundle && bundle.availability) || 'missing',
        incompatible: Boolean(bundle && bundle.error && bundle.error.code === 'incompatible-version'),
        problem: bundle && bundle.error
          ? String(bundle.error.diagnostic || bundle.error.code || '')
          : null,
        version,
        update: update && update.latest
          ? {
              latest: update.latest,
              checkedAt: update.checkedAt || 0,
              newer: isNewer(update.latest, version),
            }
          : null,
      }
    })
  }

  function expectedEnableMap(rows) {
    const expected = {}
    for (const row of rows) {
      if (row.group !== 'mode' || !row.installed) continue
      if (state.snapshot && typeof state.snapshot[row.name] === 'boolean') {
        expected[row.name] = state.snapshot[row.name]
      } else {
        expected[row.name] = row.defaultEnabled
      }
    }
    return expected
  }

  async function buildState() {
    let map = new Map()
    let problem = null
    try {
      map = await listBundleMap()
    } catch (error) {
      problem = String((error && error.message) || error)
    }
    const entries = effectiveEntries(state)
    const plugins = pluginRows(map, entries)
    const installedMode = plugins.filter((row) => row.group === 'mode' && row.installed)
    const expected = expectedEnableMap(plugins)
    let aligned = true
    for (const row of installedMode) {
      if (row.enabled !== expected[row.name]) aligned = false
    }
    const enabledCount = installedMode.filter((row) => row.enabled).length
    const managedNames = new Set(entries.map((entry) => entry.name))
    const available = []
    for (const bundle of map.values()) {
      if (!bundle || !bundle.installed) continue
      if (bundle.name === SELF_NAME || managedNames.has(bundle.name)) continue
      if (bundle.official || bundle.name.startsWith('@deepseek-ai/')) continue
      const isCatalog = CATALOG_NAMES.has(bundle.name)
      // 没有 bundle 补丁的普通依赖开关不了，除非它是默认清单里被移除的条目。
      if (!isCatalog && !(Array.isArray(bundle.rows) && bundle.rows.length > 0)) continue
      available.push({
        name: bundle.name,
        title: bundleTitle(bundle),
        note: bundleNote(bundle),
        version: typeof bundle.version === 'string' ? bundle.version : null,
        enabled: Boolean(bundle.enabled),
        kind: parseLinkSource(bundle.source) ? 'link' : 'npm',
        inCatalog: CATALOG_NAMES.has(bundle.name),
      })
    }
    available.sort((a, b) => a.name.localeCompare(b.name))
    return {
      ok: true,
      now: Date.now(),
      stateUnreadable: problem,
      mode: {
        on: state.modeOn,
        aligned: installedMode.length ? aligned : false,
        enabledCount,
        totalCount: installedMode.length,
        snapshot: state.snapshot,
        expected,
      },
      persona: {
        enabled: state.personaEnabled,
        title: '二次元大肥鱼人格',
        preview: PERSONA_PREVIEW,
        text: PERSONA_TEXT,
        chars: PERSONA_TEXT.length,
      },
      plugins,
      available,
      list: {
        total: entries.length,
        custom: state.added.length,
        removed: state.removed.length,
      },
      updates: {
        checkedAt: state.checkedAt,
        registry: state.registry,
      },
      job: state.job || null,
    }
  }

  /* ---------------- 插件开关 ---------------- */

  async function applyBundle(target, enabled) {
    try {
      const result = await ctx.pluginManager.setBundleEnabled(target, enabled)
      if (!result) return { ok: false, message: '没有返回结果' }
      const ok = result.application !== 'failed' && !result.error
      return { ok, message: describeChange(result), application: result.application }
    } catch (error) {
      return { ok: false, message: String((error && error.message) || error) }
    }
  }

  async function verifyEnable(expected) {
    const list = Object.entries(expected).map(([entryName, enabled]) => ({ name: entryName, enabled }))
    let mismatches = []
    let attempts = 0
    for (let round = 0; round < VERIFY_ROUNDS; round += 1) {
      attempts = round + 1
      if (round > 0) await sleep(300)
      let map
      try {
        map = await listBundleMap()
      } catch {
        continue
      }
      mismatches = []
      for (const item of list) {
        const actual = Boolean(map.get(item.name) && map.get(item.name).enabled)
        if (actual !== item.enabled) {
          mismatches.push({ name: item.name, expected: item.enabled, actual })
        }
      }
      if (mismatches.length === 0) break
    }
    return { attempts, consistent: mismatches.length === 0, mismatches }
  }

  /* ---------------- 后台任务 ---------------- */

  function startJob(kind, total, runner) {
    if (state.job && state.job.status === 'running') {
      return { ok: false, error: `已有任务在跑：${state.job.kind}`, job: state.job }
    }
    const job = {
      id: randomUUID(),
      kind,
      status: 'running',
      total,
      done: 0,
      current: null,
      phase: '',
      results: [],
      verify: null,
      error: null,
      startedAt: Date.now(),
      finishedAt: 0,
    }
    state.job = job
    Promise.resolve()
      .then(() => runner(job))
      .then(() => {
        job.status = 'done'
      })
      .catch((error) => {
        job.status = 'error'
        job.error = String((error && error.message) || error)
      })
      .finally(() => {
        job.finishedAt = Date.now()
        job.current = null
        job.phase = ''
      })
    return { ok: true, job }
  }

  function pushResult(job, item) {
    job.results.push(item)
    if (job.results.length > 80) job.results.splice(0, job.results.length - 80)
    job.done += 1
  }

  /* ---------------- 更新检查 ---------------- */

  async function resolveRegistry() {
    try {
      const registries = await ctx.pluginManager.registries()
      const candidates = [registries && registries.registry, registries && registries.resolved]
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
      }
    } catch {
      /* 用默认仓库 */
    }
    return 'https://registry.npmjs.org'
  }

  async function fetchLatest(registry, packageName) {
    const base = String(registry || 'https://registry.npmjs.org').replace(/\/+$/, '')
    const url = `${base}/${encodeURIComponent(packageName)}/latest`
    let lastError = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(9000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json()
        if (!payload || typeof payload.version !== 'string') throw new Error('仓库返回不完整')
        return payload.version
      } catch (error) {
        lastError = error
        if (attempt < 2) await sleep(400 * (attempt + 1))
      }
    }
    throw lastError || new Error('查询失败')
  }

  /* ---------------- 单个动作 ---------------- */

  async function actionSetPlugin(body) {
    const target = String(body.name || '')
    if (state.job && state.job.status === 'running') return { ok: false, error: '有任务在跑，稍等一下' }
    const entry = effectiveEntries(state).find((item) => item.name === target)
    if (!entry) return { ok: false, error: `清单里没有：${target}` }
    const map = await listBundleMap()
    const bundle = map.get(target)
    if (!bundle || !bundle.installed) return { ok: false, error: '这个插件还没安装' }
    const result = await applyBundle(target, body.enabled === true)
    const verify = await verifyEnable({ [target]: body.enabled === true })
    return { ok: result.ok, result, verify }
  }

  async function actionRemember() {
    const map = await listBundleMap()
    const snapshot = {}
    for (const entry of effectiveEntries(state).filter((item) => item.group === 'mode')) {
      const bundle = map.get(entry.name)
      if (bundle && bundle.installed) snapshot[entry.name] = Boolean(bundle.enabled)
    }
    state.snapshot = snapshot
    await persist()
    return { ok: true, snapshot }
  }

  /** 把一个已安装的 bundle 变成清单条目；link 安装保留本地路径，npm 安装锁当前版本。 */
  function entryFromBundle(bundle, group) {
    const linkPath = parseLinkSource(bundle.source)
    const entry = {
      name: bundle.name,
      title: bundleTitle(bundle),
      note: bundleNote(bundle),
      group: group === 'mode' ? 'mode' : 'util',
      kind: linkPath ? 'link' : 'npm',
      defaultEnabled: Boolean(bundle.enabled),
    }
    if (linkPath) entry.linkPath = linkPath
    else if (typeof bundle.version === 'string' && bundle.version) entry.pin = bundle.version
    return entry
  }

  async function actionAddPlugin(body) {
    if (state.job && state.job.status === 'running') return { ok: false, error: '有任务在跑，稍等一下' }
    const target = String(body.name || '')
    if (!target || target === SELF_NAME) return { ok: false, error: '这个插件不能加进清单' }
    if (target.startsWith('@deepseek-ai/')) return { ok: false, error: '内置插件不归这里管' }
    const entries = effectiveEntries(state)
    if (entries.some((entry) => entry.name === target)) return { ok: false, error: '已经在清单里了' }
    const map = await listBundleMap()
    const bundle = map.get(target)
    if (!bundle || !bundle.installed) return { ok: false, error: '这个插件还没安装' }
    if (bundle.official) return { ok: false, error: '官方插件不归这里管' }
    if (!CATALOG_NAMES.has(target) && !(Array.isArray(bundle.rows) && bundle.rows.length > 0)) {
      return { ok: false, error: '这个依赖没有 bundle 补丁，不能单独开关' }
    }
    if (CATALOG_NAMES.has(target)) {
      // 之前从默认清单里移除的：恢复默认条目（分组也按默认）。
      state.removed = state.removed.filter((entryName) => entryName !== target)
      await persist()
      return { ok: true, restored: true, name: target }
    }
    const entry = entryFromBundle(bundle, body.group)
    state.added.push(entry)
    await persist()
    return { ok: true, entry }
  }

  async function actionRemovePlugin(body) {
    if (state.job && state.job.status === 'running') return { ok: false, error: '有任务在跑，稍等一下' }
    const target = String(body.name || '')
    const entry = effectiveEntries(state).find((item) => item.name === target)
    if (!entry) return { ok: false, error: `清单里没有：${target}` }
    if (CATALOG_NAMES.has(target)) {
      if (!state.removed.includes(target)) state.removed.push(target)
      state.added = state.added.filter((item) => item.name !== target)
    } else {
      state.added = state.added.filter((item) => item.name !== target)
    }
    if (state.snapshot && Object.prototype.hasOwnProperty.call(state.snapshot, target)) delete state.snapshot[target]
    if (state.updates && Object.prototype.hasOwnProperty.call(state.updates, target)) delete state.updates[target]
    await persist()
    return { ok: true, name: target }
  }

  async function actionResetList() {
    if (state.job && state.job.status === 'running') return { ok: false, error: '有任务在跑，稍等一下' }
    state.added = []
    state.removed = []
    await persist()
    return { ok: true }
  }

  /** 自检：提示词、状态落盘、插件清单都过一遍，出错时给可读的理由。 */
  async function actionSelfCheck() {
    const checks = []

    try {
      const assembly = await ctx.systemPrompt.assemble({})
      const section = (assembly.sections || []).find((item) => item.name === 'dafy-mode:persona')
      const text = section ? String(section.text || '') : ''
      if (state.personaEnabled) {
        checks.push({
          id: 'persona',
          ok: text.includes('二次元大肥鱼模式'),
          message: text.includes('二次元大肥鱼模式') ? '人格段落已进入系统提示词' : '人格开着，但提示词里没找到段落',
        })
      } else {
        checks.push({
          id: 'persona',
          ok: text === '',
          message: text === '' ? '人格已关闭，提示词是干净的' : '人格已关闭，但提示词里仍有残留',
        })
      }
    } catch (error) {
      checks.push({ id: 'persona', ok: false, message: `提示词自检失败：${String((error && error.message) || error)}` })
    }

    try {
      const raw = await fsp.readFile(STATE_FILE, 'utf8')
      const saved = JSON.parse(raw)
      checks.push({
        id: 'state-file',
        ok: saved.personaEnabled === state.personaEnabled && saved.modeOn === state.modeOn,
        message: '状态文件与内存一致',
      })
    } catch (error) {
      checks.push({
        id: 'state-file',
        ok: Boolean(error && error.code === 'ENOENT'),
        message: error && error.code === 'ENOENT' ? '状态文件尚未创建（默认值）' : `状态文件读取失败：${String((error && error.message) || error)}`,
      })
    }

    try {
      const map = await listBundleMap()
      const missing = effectiveEntries(state).filter((entry) => !(map.get(entry.name) && map.get(entry.name).installed))
      checks.push({
        id: 'plugins',
        ok: missing.length === 0,
        message: missing.length === 0 ? '清单里的插件都在' : `还没装：${missing.map((entry) => entry.name).join(', ')}`,
      })
    } catch (error) {
      checks.push({ id: 'plugins', ok: false, message: `插件清单读取失败：${String((error && error.message) || error)}` })
    }

    const passed = checks.filter((check) => check.ok).length
    return { ok: passed === checks.length, checks, passed, total: checks.length }
  }

  /* ---------------- 任务入口 ---------------- */

  function startSetMode(body) {
    const wantEnabled = body.enabled === true
    const modeEntries = effectiveEntries(state).filter((entry) => entry.group === 'mode')
    return startJob(wantEnabled ? 'mode-on' : 'mode-off', modeEntries.length, async (job) => {
      if (!wantEnabled) {
        // 先记下现在的组合，再全部关掉；下次开启按这份快照恢复。
        const map = await listBundleMap()
        const snapshot = {}
        for (const entry of modeEntries) {
          const bundle = map.get(entry.name)
          if (bundle && bundle.installed) snapshot[entry.name] = Boolean(bundle.enabled)
        }
        state.snapshot = snapshot
        await persist()
      }
      const map = await listBundleMap()
      const targets = []
      for (const entry of modeEntries) {
        const bundle = map.get(entry.name)
        if (!bundle || !bundle.installed) continue
        let enabled = false
        if (wantEnabled) {
          enabled = state.snapshot && typeof state.snapshot[entry.name] === 'boolean'
            ? state.snapshot[entry.name]
            : entry.defaultEnabled === true
        }
        targets.push({ name: entry.name, enabled })
      }
      job.total = targets.length
      for (const target of targets) {
        job.current = target.name
        job.phase = target.enabled ? 'enable' : 'disable'
        const result = await applyBundle(target.name, target.enabled)
        pushResult(job, { name: target.name, ok: result.ok, message: result.message })
      }
      job.verify = await verifyEnable(Object.fromEntries(targets.map((t) => [t.name, t.enabled])))
      state.modeOn = wantEnabled
      await persist()
    })
  }

  function startSetAll(body) {
    const enabled = body.enabled === true
    const entries = effectiveEntries(state)
    return startJob(enabled ? 'all-on' : 'all-off', entries.length, async (job) => {
      const map = await listBundleMap()
      const targets = entries.filter((entry) => {
        const bundle = map.get(entry.name)
        return bundle && bundle.installed
      })
      job.total = targets.length
      for (const entry of targets) {
        job.current = entry.name
        job.phase = enabled ? 'enable' : 'disable'
        const result = await applyBundle(entry.name, enabled)
        pushResult(job, { name: entry.name, ok: result.ok, message: result.message })
      }
      job.verify = await verifyEnable(Object.fromEntries(targets.map((t) => [t.name, enabled])))
    })
  }

  function startInstallMissing() {
    const entries = effectiveEntries(state)
    return startJob('install', entries.length, async (job) => {
      const before = await listBundleMap()
      const missing = entries.filter((entry) => {
        const bundle = before.get(entry.name)
        return !(bundle && bundle.installed)
      })
      job.total = missing.length
      if (missing.length === 0) {
        job.message = '全部已安装'
        return
      }
      const installed = []
      for (const entry of missing) {
        job.current = entry.name
        job.phase = 'install'
        let spec = entry.kind === 'link' ? `link:${entry.linkPath}` : entry.name
        if (entry.kind === 'npm' && entry.pin) spec = `${entry.name}@${entry.pin}`
        if (entry.kind === 'link') {
          let exists = true
          try {
            await fsp.access(entry.linkPath)
          } catch {
            exists = false
          }
          if (!exists) {
            pushResult(job, { name: entry.name, ok: false, message: `本地目录不存在：${entry.linkPath}` })
            continue
          }
        }
        try {
          const result = await ctx.pluginManager.installBundle(spec, {
            enabled: false,
            saveExact: true,
            requestId: `${job.id}-${entry.name}`,
          })
          const ok = Boolean(result) && result.application !== 'failed' && !result.error
          const notes = []
          if (result && result.application) notes.push(describeChange(result))
          if (result && Array.isArray(result.pendingBuilds) && result.pendingBuilds.length) {
            notes.push(`构建脚本待批准：${result.pendingBuilds.join(', ')}`)
          }
          if (result && result.packageResult && result.packageResult.output) {
            const tail = String(result.packageResult.output).trim().split('\n').slice(-2).join(' / ')
            if (tail) notes.push(tail)
          }
          pushResult(job, { name: entry.name, ok, message: notes.join('；') || (ok ? '已下载' : '下载失败') })
          if (ok) installed.push(entry)
        } catch (error) {
          pushResult(job, { name: entry.name, ok: false, message: String((error && error.message) || error) })
        }
      }
      // 复核安装结果，多查两轮
      const expected = {}
      for (const entry of installed) expected[entry.name] = false
      job.verify = await verifyEnable(expected)

      // 装完顺手把「现在本来就开着」的那些打开，复刻当前这套组合。
      const toEnable = installed.filter((entry) => {
        const desired = state.snapshot && typeof state.snapshot[entry.name] === 'boolean'
          ? state.snapshot[entry.name]
          : entry.defaultEnabled === true
        return desired
      })
      if (toEnable.length > 0) {
        job.phase = 'enable'
        job.total += toEnable.length
        for (const entry of toEnable) {
          job.current = entry.name
          const result = await applyBundle(entry.name, true)
          pushResult(job, { name: entry.name, ok: result.ok, message: `启用：${result.message}` })
        }
        job.verify = await verifyEnable(Object.fromEntries(toEnable.map((entry) => [entry.name, true])))
      }
    })
  }

  function startCheckUpdates() {
    const npmEntries = effectiveEntries(state).filter((entry) => entry.kind === 'npm')
    return startJob('check', npmEntries.length, async (job) => {
      const registry = await resolveRegistry()
      state.registry = registry
      const map = await listBundleMap()
      job.total = npmEntries.length
      for (const entry of npmEntries) {
        job.current = entry.name
        job.phase = 'check'
        try {
          const latest = await fetchLatest(registry, entry.name)
          state.updates[entry.name] = { latest, checkedAt: Date.now() }
          const bundle = map.get(entry.name)
          const current = bundle && bundle.version ? String(bundle.version) : null
          const newer = current ? isNewer(latest, current) : true
          pushResult(job, {
            name: entry.name,
            ok: true,
            message: newer ? `可更新：${current || '未安装'} → ${latest}` : `已是最新 ${latest}`,
            latest,
            current,
            newer,
          })
        } catch (error) {
          pushResult(job, {
            name: entry.name,
            ok: false,
            message: `查询失败：${String((error && error.message) || error)}`,
          })
        }
      }
      state.checkedAt = Date.now()
      await persist()
    })
  }

  function startUpdateAll() {
    const entries = effectiveEntries(state)
    return startJob('update', entries.length, async (job) => {
      const map = await listBundleMap()
      const targets = []
      const skipped = []
      for (const entry of entries) {
        if (entry.kind !== 'npm') continue
        const bundle = map.get(entry.name)
        if (!bundle || !bundle.installed) continue
        const update = state.updates[entry.name]
        if (!update || !update.latest) continue
        if (!isNewer(update.latest, bundle.version)) continue
        if (entry.hold) {
          skipped.push({ name: entry.name, ok: false, message: `已跳过更新：${entry.hold}` })
          continue
        }
        targets.push({ entry, latest: update.latest, enabled: Boolean(bundle.enabled) })
      }
      job.total = targets.length + skipped.length
      if (targets.length === 0 && skipped.length === 0) {
        job.message = '没有可更新的插件'
        return
      }
      for (const item of skipped) pushResult(job, item)
      if (targets.length === 0) {
        job.message = '可更新的都已跳过'
        return
      }
      for (const target of targets) {
        const name = target.entry.name
        const current = (map.get(name) || {}).version
        job.current = name
        job.phase = 'update'
        try {
          /* DSH 的 installBundle 只负责「新增」：包已经在这个 profile 的 dependencies 里时，
             宿主会抛 already-installed（桌面端常驻 HMR，必走这条）。官方 UI 的更新路径是
             「先卸载，再安装」，这里照做；装新版本失败就把旧版本装回去，别把人家的插件弄丢。 */
          await ctx.pluginManager.removeBundle(name)
          const result = await ctx.pluginManager.installBundle(`${name}@${target.latest}`, {
            enabled: target.enabled,
            saveExact: true,
            requestId: `${job.id}-${name}`,
          })
          const ok = Boolean(result) && result.application !== 'failed' && !result.error
          pushResult(job, {
            name,
            ok,
            message: ok ? `已更新到 ${target.latest}` : describeChange(result),
          })
          if (!ok && current) {
            try {
              await ctx.pluginManager.installBundle(`${name}@${current}`, {
                enabled: target.enabled,
                saveExact: true,
                requestId: `${job.id}-${name}-rollback`,
              })
              pushResult(job, { name, ok: false, message: `已回滚到 ${current}` })
            } catch (rollbackError) {
              pushResult(job, {
                name,
                ok: false,
                message: `回滚失败，请到「设置 → 插件」重装：${String((rollbackError && rollbackError.message) || rollbackError)}`,
              })
            }
          }
        } catch (error) {
          pushResult(job, {
            name,
            ok: false,
            message: String((error && error.message) || error),
          })
        }
      }
      job.verify = await verifyEnable(Object.fromEntries(targets.map((t) => [t.entry.name, t.enabled])))
    })
  }

  /* ---------------- 路由 ---------------- */

  async function handle(req, res) {
    const url = new URL(req.url || '/', 'http://localhost')
    const pathname = url.pathname
    try {
      if (pathname === `${ROUTE}/state` && req.method === 'GET') {
        sendJson(res, 200, await buildState())
        return
      }

      if (pathname === `${ROUTE}/persona` && req.method === 'POST') {
        if (!sameOrigin(req)) return sendJson(res, 403, { ok: false, error: 'origin rejected' })
        const body = await readJsonBody(req)
        state.personaEnabled = body.enabled === true
        await persist()
        sendJson(res, 200, { ok: true, state: await buildState() })
        return
      }

      if (pathname === `${ROUTE}/action` && req.method === 'POST') {
        if (!sameOrigin(req)) return sendJson(res, 403, { ok: false, error: 'origin rejected' })
        const body = await readJsonBody(req)
        const action = String(body.action || '')

        if (action === 'refresh') {
          sendJson(res, 200, { ok: true, state: await buildState() })
          return
        }
        if (action === 'self-check') {
          const result = await actionSelfCheck()
          sendJson(res, 200, { ok: true, result, state: await buildState() })
          return
        }
        if (action === 'remember') {
          const result = await actionRemember()
          sendJson(res, 200, { ok: true, result, state: await buildState() })
          return
        }
        if (action === 'set-plugin') {
          const result = await actionSetPlugin(body)
          sendJson(res, 200, { ok: result.ok, result, error: result.ok ? undefined : result.error, state: await buildState() })
          return
        }
        if (action === 'add-plugin') {
          const result = await actionAddPlugin(body)
          sendJson(res, result.ok ? 200 : 400, {
            ok: result.ok,
            result,
            error: result.ok ? undefined : result.error,
            state: await buildState(),
          })
          return
        }
        if (action === 'remove-plugin') {
          const result = await actionRemovePlugin(body)
          sendJson(res, result.ok ? 200 : 400, {
            ok: result.ok,
            result,
            error: result.ok ? undefined : result.error,
            state: await buildState(),
          })
          return
        }
        if (action === 'reset-list') {
          const result = await actionResetList()
          sendJson(res, result.ok ? 200 : 400, {
            ok: result.ok,
            result,
            error: result.ok ? undefined : result.error,
            state: await buildState(),
          })
          return
        }
        if (action === 'set-mode') {
          const started = startSetMode(body)
          sendJson(res, started.ok ? 200 : 409, { ...started, state: await buildState() })
          return
        }
        if (action === 'set-all') {
          const started = startSetAll(body)
          sendJson(res, started.ok ? 200 : 409, { ...started, state: await buildState() })
          return
        }
        if (action === 'install-missing') {
          const started = startInstallMissing()
          sendJson(res, started.ok ? 200 : 409, { ...started, state: await buildState() })
          return
        }
        if (action === 'check-updates') {
          const started = startCheckUpdates()
          sendJson(res, started.ok ? 200 : 409, { ...started, state: await buildState() })
          return
        }
        if (action === 'update-all') {
          const started = startUpdateAll()
          sendJson(res, started.ok ? 200 : 409, { ...started, state: await buildState() })
          return
        }
        sendJson(res, 400, { ok: false, error: `未知操作：${action}` })
        return
      }

      sendJson(res, 404, { ok: false, error: 'not found' })
    } catch (error) {
      console.warn('[dsh-anime-bundle] 请求处理失败：', error)
      if (!res.headersSent) sendJson(res, 500, { ok: false, error: String((error && error.message) || error) })
      else res.end()
    }
  }

  return { handle, buildState }
}

/* ------------------------------------------------------------------ */
/* 插件入口                                                              */
/* ------------------------------------------------------------------ */

export async function apply(ctx) {
  const state = await loadState()
  const api = createApi(ctx, state)

  // 人格段落：关闭时返回空串，渲染阶段会被丢弃；开启时下一条消息就生效。
  ctx.effect(
    () =>
      ctx.systemPrompt.section({
        name: 'dafy-mode:persona',
        order: 21,
        interpolate: false,
        text: () => (state.personaEnabled ? PERSONA_TEXT : ''),
      }),
    'dsh-anime-bundle: persona section',
  )

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: ROUTE,
        handler: (req, res) => api.handle(req, res),
      }),
    'dsh-anime-bundle: routes',
  )
}

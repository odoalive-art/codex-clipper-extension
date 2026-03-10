import { STORAGE_KEYS, getDefaultRules, normalizeRules, ruleHostText } from './rules.js';
import {
  clearVaultRootHandle,
  detectObsidianAttachmentFolder,
  detectObsidianNewNoteRule,
  getVaultRootHandle,
  queryHandlePermission,
  requestHandlePermission,
  saveVaultRootHandle,
} from './obsidian-local.js';

const ruleEditorSelect = document.getElementById('ruleEditorSelect');
const ruleLabelInput = document.getElementById('ruleLabelInput');
const ruleContentInput = document.getElementById('ruleContentInput');
const createRuleBtn = document.getElementById('createRuleBtn');
const saveRuleEditorBtn = document.getElementById('saveRuleEditorBtn');
const deleteRuleBtn = document.getElementById('deleteRuleBtn');
const ruleEditorStatus = document.getElementById('ruleEditorStatus');
const debugModeCheckbox = document.getElementById('debugModeCheckbox');
const debugStatus = document.getElementById('debugStatus');
const notionTokenInput = document.getElementById('notionTokenInput');
const notionParentPageInput = document.getElementById('notionParentPageInput');
const notionTargetTypeSelect = document.getElementById('notionTargetTypeSelect');
const saveNotionConfigBtn = document.getElementById('saveNotionConfigBtn');
const notionVerifyBtn = document.getElementById('notionVerifyBtn');
const notionDiscoverPagesBtn = document.getElementById('notionDiscoverPagesBtn');
const notionPageSelect = document.getElementById('notionPageSelect');
const notionConfigStatus = document.getElementById('notionConfigStatus');
const obsidianVaultInput = document.getElementById('obsidianVaultInput');
const obsidianFolderInput = document.getElementById('obsidianFolderInput');
const obsidianWriteModeSelect = document.getElementById('obsidianWriteModeSelect');
const obsidianAttachmentFolderInput = document.getElementById('obsidianAttachmentFolderInput');
const pickObsidianVaultDirBtn = document.getElementById('pickObsidianVaultDirBtn');
const clearObsidianVaultDirBtn = document.getElementById('clearObsidianVaultDirBtn');
const saveObsidianConfigBtn = document.getElementById('saveObsidianConfigBtn');
const obsidianConfigStatus = document.getElementById('obsidianConfigStatus');
const obsidianVaultDirStatus = document.getElementById('obsidianVaultDirStatus');
const obsidianAttachmentRuleStatus = document.getElementById('obsidianAttachmentRuleStatus');
const obsidianReadinessStatus = document.getElementById('obsidianReadinessStatus');

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';

const state = {
  rules: getDefaultRules(),
  debugMode: true,
  obsidianVault: '',
  obsidianFolder: '',
  obsidianWriteMode: 'uri',
  obsidianAttachmentFolder: 'images',
  detectedObsidianAttachmentFolder: '',
  detectedObsidianNewNoteRule: { location: '', folder: '' },
  vaultRootHandle: null,
  notionToken: '',
  notionParentPageId: '',
  notionWriteTargetType: 'page',
  notionLastPageId: '',
  notionLastDataSourceId: '',
  notionLastPageTitle: '',
  notionLastDataSourceTitle: '',
  notionTargetCandidates: [],
  activeRuleId: '',
};

function setInlineStatus(el, message, tone = '') {
  if (!el) return;
  el.textContent = message || '';
  el.classList.remove('ok', 'warn', 'error');
  if (tone) el.classList.add(tone);
}

function setRuleEditorStatus(message, tone = '') {
  setInlineStatus(ruleEditorStatus, message, tone);
}

function setNotionConfigStatus(message, tone = '') {
  setInlineStatus(notionConfigStatus, message, tone);
}

function setDebugStatus(message, tone = '') {
  setInlineStatus(debugStatus, message, tone);
}

function setObsidianConfigStatus(message, tone = '') {
  setInlineStatus(obsidianConfigStatus, message, tone);
}

function setObsidianVaultDirStatus(message, tone = '') {
  setInlineStatus(obsidianVaultDirStatus, message, tone);
}

function setObsidianAttachmentRuleStatus(message, tone = '') {
  setInlineStatus(obsidianAttachmentRuleStatus, message, tone);
}

function setObsidianReadinessStatus(message, tone = '') {
  setInlineStatus(obsidianReadinessStatus, message, tone);
}

function refreshObsidianReadinessStatus() {
  const vaultReady = Boolean(state.obsidianVault);
  const localHandleReady = Boolean(state.vaultRootHandle);
  const newNoteRuleActive = state.detectedObsidianNewNoteRule?.location === 'folder' && state.detectedObsidianNewNoteRule?.folder;
  const modeLabel = state.obsidianWriteMode === 'local' ? '本地直写' : 'URI 直连';
  const lines = [
    `Vault 名称：${vaultReady ? `已配置（${state.obsidianVault}）` : '未配置（必填）'}`,
    `目录授权：${localHandleReady ? '已绑定本地库目录' : '未绑定本地库目录'}`,
    `新建笔记规则：${newNoteRuleActive ? state.detectedObsidianNewNoteRule.folder : '未检测到指定目录规则（将使用扩展目录或库根）'}`,
    `URI 唤起：${vaultReady ? '可用' : '不可用（缺少 Vault）'}`,
    `当前模式：${modeLabel}`,
  ];
  setObsidianReadinessStatus(lines.join('\n'), vaultReady ? 'ok' : 'warn');
}

function normalizeRuleId(raw) {
  const text = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text || `rule-${Date.now()}`;
}

function renderRuleEditorOptions() {
  if (!ruleEditorSelect) return;
  const frag = document.createDocumentFragment();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = state.rules.length ? '请选择规则' : '暂无规则';
  frag.appendChild(placeholder);

  state.rules.forEach(rule => {
    const option = document.createElement('option');
    option.value = rule.id;
    option.textContent = rule.label || rule.id;
    option.title = ruleHostText(rule);
    if (state.activeRuleId && state.activeRuleId === rule.id) option.selected = true;
    frag.appendChild(option);
  });
  ruleEditorSelect.replaceChildren(frag);
}

function getRuleById(ruleId) {
  return state.rules.find(rule => rule.id === ruleId) || null;
}

function fillRuleEditor(rule) {
  if (!rule) {
    if (ruleLabelInput) ruleLabelInput.value = '';
    if (ruleContentInput) ruleContentInput.value = '';
    return;
  }
  if (ruleLabelInput) ruleLabelInput.value = rule.label || rule.id || '';
  if (ruleContentInput) {
    const { id, label, enabled, ...rest } = rule;
    const contentPayload = {
      ...rest,
      ...(enabled === false ? { enabled: false } : {}),
    };
    ruleContentInput.value = JSON.stringify(contentPayload, null, 2);
  }
}

function refreshRuleEditorView() {
  if (!state.activeRuleId && state.rules[0]) state.activeRuleId = state.rules[0].id;
  renderRuleEditorOptions();
  fillRuleEditor(getRuleById(state.activeRuleId));
}

function buildRuleFromEditor(existingRule = null) {
  const label = String(ruleLabelInput?.value || '').trim();
  const contentRaw = String(ruleContentInput?.value || '').trim();
  if (!contentRaw) throw new Error('请填写规则 JSON');

  let parsed = null;
  try {
    parsed = JSON.parse(contentRaw);
  } catch {
    throw new Error('规则 JSON 解析失败');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('规则 JSON 必须是对象');
  }

  const base = existingRule ? { ...existingRule } : { ...getDefaultRules()[0] };
  const candidate = {
    ...base,
    ...parsed,
    id: existingRule?.id || normalizeRuleId(label || parsed?.match?.hostSuffix || parsed?.match?.hostEquals || parsed?.match?.hostRegex),
    label: label || existingRule?.label || parsed.label || '未命名规则',
  };
  const normalized = normalizeRules([candidate]);
  if (!normalized[0]) throw new Error('规则结构无效，请检查 match 字段');
  return normalized[0];
}

async function persistRules(reasonText = '规则已保存') {
  await chrome.storage.local.set({ [STORAGE_KEYS.siteRules]: state.rules });
  refreshRuleEditorView();
  setRuleEditorStatus(reasonText, 'ok');
}

function toNotionUuid(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const direct = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  if (direct) return direct.toLowerCase();

  const plain = value.replace(/[^0-9a-f]/gi, '');
  const hit = plain.match(/[0-9a-f]{32}/i)?.[0];
  if (!hit) return '';
  const source = hit.toLowerCase();
  return `${source.slice(0, 8)}-${source.slice(8, 12)}-${source.slice(12, 16)}-${source.slice(16, 20)}-${source.slice(20, 32)}`;
}

function notionPageTitleFromObject(page) {
  if (!page || typeof page !== 'object') return '';
  const properties = page.properties && typeof page.properties === 'object' ? Object.values(page.properties) : [];
  for (const property of properties) {
    if (property?.type === 'title' && Array.isArray(property.title)) {
      const text = property.title.map(part => part?.plain_text || '').join('').trim();
      if (text) return text;
    }
  }
  return '';
}

function notionDatabaseTitleFromObject(database) {
  if (!database || typeof database !== 'object') return '';
  if (Array.isArray(database.title)) {
    const fromTitle = database.title.map(part => part?.plain_text || '').join('').trim();
    if (fromTitle) return fromTitle;
  }
  if (Array.isArray(database.name)) {
    const fromName = database.name.map(part => part?.plain_text || '').join('').trim();
    if (fromName) return fromName;
  }
  if (typeof database?.plain_text === 'string' && database.plain_text.trim()) return database.plain_text.trim();
  if (typeof database?.title === 'string' && database.title.trim()) return database.title.trim();
  if (typeof database?.name === 'string' && database.name.trim()) return database.name.trim();
  return '';
}

function getCurrentNotionTargetType() {
  return notionTargetTypeSelect?.value === 'database' || state.notionWriteTargetType === 'database' ? 'database' : 'page';
}

function getLastTargetIdByType(type) {
  return type === 'database' ? state.notionLastDataSourceId : state.notionLastPageId;
}

function getLastTargetTitleByType(type) {
  return type === 'database' ? state.notionLastDataSourceTitle : state.notionLastPageTitle;
}

function setLastTargetIdByType(type, id) {
  if (type === 'database') state.notionLastDataSourceId = id;
  else state.notionLastPageId = id;
}

function setLastTargetTitleByType(type, title) {
  if (type === 'database') state.notionLastDataSourceTitle = title;
  else state.notionLastPageTitle = title;
}

function parseNotionTargetValue(raw) {
  const value = String(raw || '').trim();
  if (!value) return { type: '', id: '' };
  const [typePart, ...rest] = value.split(':');
  const idPart = rest.join(':');
  const type = typePart === 'database' ? 'database' : typePart === 'page' ? 'page' : '';
  const id = toNotionUuid(idPart);
  if (!type || !id) return { type: '', id: '' };
  return { type, id };
}

function applyNotionTargetCandidates(targets) {
  if (!notionPageSelect) return;
  const selectedType = getCurrentNotionTargetType();
  const selectedId = toNotionUuid(notionParentPageInput?.value || state.notionParentPageId || getLastTargetIdByType(selectedType));
  const selectedValue = selectedId ? `${selectedType}:${selectedId}` : '';
  const filteredTargets = targets.filter(target => target?.type === selectedType);
  const hasSelected = selectedValue ? filteredTargets.some(target => `${target.type}:${target.id}` === selectedValue) : false;
  const lastTitle = getLastTargetTitleByType(selectedType);

  if (selectedId && !hasSelected) {
    filteredTargets.unshift({
      type: selectedType,
      id: selectedId,
      title: lastTitle || `最近选择 (${selectedId.slice(0, 8)})`,
      url: '',
    });
  }

  const frag = document.createDocumentFragment();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = filteredTargets.length
    ? selectedType === 'database'
      ? '请选择一个可写数据库'
      : '请选择一个可写页面'
    : selectedType === 'database'
      ? '未发现可写数据库'
      : '未发现可写页面';
  frag.appendChild(placeholder);

  filteredTargets.forEach(target => {
    const option = document.createElement('option');
    option.value = `${target.type}:${target.id}`;
    option.textContent = target.title || 'Untitled';
    option.title = target.url || target.id;
    if (selectedValue && option.value === selectedValue) option.selected = true;
    frag.appendChild(option);
  });

  notionPageSelect.replaceChildren(frag);
}

function persistNotionTargetSelection() {
  return chrome.storage.local.set({
    [STORAGE_KEYS.notionParentPageId]: state.notionParentPageId,
    [STORAGE_KEYS.notionWriteTargetType]: state.notionWriteTargetType,
    [STORAGE_KEYS.notionLastPageId]: state.notionLastPageId,
    [STORAGE_KEYS.notionLastDataSourceId]: state.notionLastDataSourceId,
    [STORAGE_KEYS.notionLastPageTitle]: state.notionLastPageTitle,
    [STORAGE_KEYS.notionLastDataSourceTitle]: state.notionLastDataSourceTitle,
    [STORAGE_KEYS.notionTargetCandidatesCache]: state.notionTargetCandidates,
  });
}

async function notionRequest(path, { method = 'GET', token, json } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
  };
  const init = { method, headers };
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(json);
  }

  const response = await fetch(`${NOTION_API_BASE}${path}`, init);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const code = payload?.code ? `${payload.code}: ` : '';
    const message = payload?.message || `HTTP ${response.status}`;
    throw new Error(`${code}${message}`);
  }
  return payload;
}

async function verifyNotionConnection(token) {
  const me = await notionRequest('/users/me', { method: 'GET', token });
  const userName = me?.name || me?.bot?.owner?.user?.name || me?.type || '当前集成';
  return { userName };
}

async function discoverWritableNotionTargets(token) {
  const pages = [];
  const databases = [];
  let cursor = '';

  for (let i = 0; i < 3; i += 1) {
    const payload = await notionRequest('/search', {
      method: 'POST',
      token,
      json: {
        query: '',
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 50,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });

    const results = Array.isArray(payload?.results) ? payload.results : [];
    for (const page of results) {
      const id = toNotionUuid(page?.id);
      if (!id) continue;
      const title = notionPageTitleFromObject(page) || `Untitled (${id.slice(0, 8)})`;
      pages.push({ id, title, url: typeof page?.url === 'string' ? page.url : '' });
    }

    if (!payload?.has_more || !payload?.next_cursor) break;
    cursor = payload.next_cursor;
  }

  const uniq = [];
  const seen = new Set();
  pages.forEach(page => {
    if (seen.has(page.id)) return;
    seen.add(page.id);
    uniq.push({ ...page, type: 'page' });
  });

  cursor = '';
  for (let i = 0; i < 3; i += 1) {
    const payload = await notionRequest('/search', {
      method: 'POST',
      token,
      json: {
        query: '',
        filter: { property: 'object', value: 'data_source' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 50,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });

    const results = Array.isArray(payload?.results) ? payload.results : [];
    for (const database of results) {
      const id = toNotionUuid(database?.id);
      if (!id) continue;
      const title = notionDatabaseTitleFromObject(database) || `Untitled DB (${id.slice(0, 8)})`;
      databases.push({ id, title, url: typeof database?.url === 'string' ? database.url : '' });
    }

    if (!payload?.has_more || !payload?.next_cursor) break;
    cursor = payload.next_cursor;
  }

  databases.forEach(database => {
    const key = `database:${database.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    uniq.push({ ...database, type: 'database' });
  });

  return uniq;
}

async function saveNotionConfig() {
  const notionToken = notionTokenInput?.value?.trim() || '';
  const notionParentPageId = notionParentPageInput?.value?.trim() || '';
  const notionWriteTargetType = notionTargetTypeSelect?.value === 'database' ? 'database' : 'page';
  const notionLastPageId = notionWriteTargetType === 'page' ? notionParentPageId : state.notionLastPageId;
  const notionLastDataSourceId = notionWriteTargetType === 'database' ? notionParentPageId : state.notionLastDataSourceId;

  state.notionToken = notionToken;
  state.notionParentPageId = notionParentPageId;
  state.notionWriteTargetType = notionWriteTargetType;
  state.notionLastPageId = notionLastPageId;
  state.notionLastDataSourceId = notionLastDataSourceId;

  await chrome.storage.local.set({
    [STORAGE_KEYS.notionToken]: notionToken,
    [STORAGE_KEYS.notionParentPageId]: notionParentPageId,
    [STORAGE_KEYS.notionWriteTargetType]: notionWriteTargetType,
    [STORAGE_KEYS.notionLastPageId]: notionLastPageId,
    [STORAGE_KEYS.notionLastDataSourceId]: notionLastDataSourceId,
    [STORAGE_KEYS.notionLastPageTitle]: state.notionLastPageTitle,
    [STORAGE_KEYS.notionLastDataSourceTitle]: state.notionLastDataSourceTitle,
    [STORAGE_KEYS.notionTargetCandidatesCache]: state.notionTargetCandidates,
  });
}

async function loadSettings() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.siteRules,
    STORAGE_KEYS.debugMode,
    STORAGE_KEYS.obsidianVault,
    STORAGE_KEYS.obsidianFolder,
    STORAGE_KEYS.obsidianWriteMode,
    STORAGE_KEYS.obsidianAttachmentFolder,
    STORAGE_KEYS.notionToken,
    STORAGE_KEYS.notionParentPageId,
    STORAGE_KEYS.notionWriteTargetType,
    STORAGE_KEYS.notionLastPageId,
    STORAGE_KEYS.notionLastDataSourceId,
    STORAGE_KEYS.notionLastPageTitle,
    STORAGE_KEYS.notionLastDataSourceTitle,
    STORAGE_KEYS.notionTargetCandidatesCache,
  ]);

  state.rules = normalizeRules(stored[STORAGE_KEYS.siteRules]);
  state.debugMode = stored[STORAGE_KEYS.debugMode] !== false;
  state.obsidianVault = typeof stored[STORAGE_KEYS.obsidianVault] === 'string' ? stored[STORAGE_KEYS.obsidianVault].trim() : '';
  state.obsidianFolder = typeof stored[STORAGE_KEYS.obsidianFolder] === 'string' ? stored[STORAGE_KEYS.obsidianFolder].trim() : '';
  state.obsidianWriteMode = stored[STORAGE_KEYS.obsidianWriteMode] === 'local' ? 'local' : 'uri';
  state.obsidianAttachmentFolder =
    typeof stored[STORAGE_KEYS.obsidianAttachmentFolder] === 'string' && stored[STORAGE_KEYS.obsidianAttachmentFolder].trim()
      ? stored[STORAGE_KEYS.obsidianAttachmentFolder].trim()
      : 'images';
  state.notionToken = typeof stored[STORAGE_KEYS.notionToken] === 'string' ? stored[STORAGE_KEYS.notionToken].trim() : '';
  state.notionParentPageId = typeof stored[STORAGE_KEYS.notionParentPageId] === 'string' ? stored[STORAGE_KEYS.notionParentPageId].trim() : '';
  state.notionWriteTargetType = stored[STORAGE_KEYS.notionWriteTargetType] === 'database' ? 'database' : 'page';
  state.notionLastPageId = typeof stored[STORAGE_KEYS.notionLastPageId] === 'string' ? stored[STORAGE_KEYS.notionLastPageId].trim() : '';
  state.notionLastDataSourceId = typeof stored[STORAGE_KEYS.notionLastDataSourceId] === 'string' ? stored[STORAGE_KEYS.notionLastDataSourceId].trim() : '';
  state.notionLastPageTitle = typeof stored[STORAGE_KEYS.notionLastPageTitle] === 'string' ? stored[STORAGE_KEYS.notionLastPageTitle].trim() : '';
  state.notionLastDataSourceTitle = typeof stored[STORAGE_KEYS.notionLastDataSourceTitle] === 'string' ? stored[STORAGE_KEYS.notionLastDataSourceTitle].trim() : '';

  if (state.notionParentPageId) {
    if (state.notionWriteTargetType === 'database' && !state.notionLastDataSourceId) {
      state.notionLastDataSourceId = state.notionParentPageId;
    }
    if (state.notionWriteTargetType === 'page' && !state.notionLastPageId) {
      state.notionLastPageId = state.notionParentPageId;
    }
  }

  const cachedTargets = Array.isArray(stored[STORAGE_KEYS.notionTargetCandidatesCache])
    ? stored[STORAGE_KEYS.notionTargetCandidatesCache]
        .map(item => ({
          type: item?.type === 'database' ? 'database' : item?.type === 'page' ? 'page' : '',
          id: toNotionUuid(item?.id),
          title: typeof item?.title === 'string' ? item.title.trim() : '',
          url: typeof item?.url === 'string' ? item.url : '',
        }))
        .filter(item => item.type && item.id)
    : [];

  state.notionTargetCandidates = cachedTargets;
  state.activeRuleId = state.rules[0]?.id || '';

  if (debugModeCheckbox) debugModeCheckbox.checked = state.debugMode;
  if (obsidianVaultInput) obsidianVaultInput.value = state.obsidianVault;
  if (obsidianFolderInput) obsidianFolderInput.value = state.obsidianFolder;
  if (obsidianWriteModeSelect) obsidianWriteModeSelect.value = state.obsidianWriteMode;
  if (obsidianAttachmentFolderInput) obsidianAttachmentFolderInput.value = state.obsidianAttachmentFolder;
  if (notionTokenInput) notionTokenInput.value = state.notionToken;
  if (notionParentPageInput) notionParentPageInput.value = state.notionParentPageId;
  if (notionTargetTypeSelect) notionTargetTypeSelect.value = state.notionWriteTargetType;

  refreshRuleEditorView();
  applyNotionTargetCandidates(state.notionTargetCandidates);
  setDebugStatus(state.debugMode ? '调试模式已启用' : '调试模式已关闭', 'ok');
  setRuleEditorStatus('设置已加载', 'ok');
  setNotionConfigStatus('');
  updateWriteModeHint();
  await refreshVaultBindingStatus();
  refreshObsidianReadinessStatus();
}

async function saveObsidianConfig() {
  const obsidianVault = state.obsidianVault || '';
  const obsidianFolder = obsidianFolderInput?.value?.trim() || '';
  const obsidianWriteMode = obsidianWriteModeSelect?.value === 'local' ? 'local' : 'uri';
  const obsidianAttachmentFolder = obsidianAttachmentFolderInput?.value?.trim() || 'images';
  if (!obsidianVault) throw new Error('请先点击“选择本地库目录”完成 Vault 同步');
  state.obsidianVault = obsidianVault;
  state.obsidianFolder = obsidianFolder;
  state.obsidianWriteMode = obsidianWriteMode;
  state.obsidianAttachmentFolder = obsidianAttachmentFolder;
  await chrome.storage.local.set({
    [STORAGE_KEYS.obsidianVault]: obsidianVault,
    [STORAGE_KEYS.obsidianFolder]: obsidianFolder,
    [STORAGE_KEYS.obsidianWriteMode]: obsidianWriteMode,
    [STORAGE_KEYS.obsidianAttachmentFolder]: obsidianAttachmentFolder,
  });
}

function updateWriteModeHint() {
  if (state.obsidianWriteMode === 'local') {
    setObsidianConfigStatus('已启用本地直写模式：发送时将直接写入本地库目录。', 'ok');
  } else {
    setObsidianConfigStatus('当前为 URI 直连模式：通过 obsidian://new 创建笔记。', 'warn');
  }
}

async function syncVaultFromHandle(handle) {
  const vaultName = typeof handle?.name === 'string' ? handle.name.trim() : '';
  if (!vaultName) return false;
  state.obsidianVault = vaultName;
  if (obsidianVaultInput) obsidianVaultInput.value = vaultName;
  await chrome.storage.local.set({ [STORAGE_KEYS.obsidianVault]: vaultName });
  return true;
}

async function refreshVaultBindingStatus() {
  state.vaultRootHandle = await getVaultRootHandle();
  state.detectedObsidianNewNoteRule = { location: '', folder: '' };
  if (!state.vaultRootHandle) {
    state.obsidianVault = '';
    setObsidianVaultDirStatus('未绑定本地库目录。', 'warn');
    state.detectedObsidianAttachmentFolder = '';
    setObsidianAttachmentRuleStatus('未检测到 Obsidian 附件规则，将使用扩展配置。', 'warn');
    if (obsidianVaultInput) obsidianVaultInput.value = '';
    await chrome.storage.local.set({ [STORAGE_KEYS.obsidianVault]: '' });
    refreshObsidianReadinessStatus();
    return;
  }
  await syncVaultFromHandle(state.vaultRootHandle);
  const permission = await queryHandlePermission(state.vaultRootHandle, 'readwrite');
  if (permission === 'granted') {
    setObsidianVaultDirStatus(`已绑定目录：${state.vaultRootHandle.name || '已授权目录'}（Vault 已同步）`, 'ok');
  } else {
    setObsidianVaultDirStatus('目录授权已失效，请重新授权。', 'warn');
  }
  state.detectedObsidianAttachmentFolder = await detectObsidianAttachmentFolder(state.vaultRootHandle);
  state.detectedObsidianNewNoteRule = await detectObsidianNewNoteRule(state.vaultRootHandle);
  if (state.detectedObsidianAttachmentFolder) {
    setObsidianAttachmentRuleStatus(`检测到 Obsidian 附件目录规则：${state.detectedObsidianAttachmentFolder}（发送时优先使用）`, 'ok');
  } else {
    setObsidianAttachmentRuleStatus('未检测到 Obsidian 附件目录规则，将使用扩展配置。', 'warn');
  }
  refreshObsidianReadinessStatus();
}

ruleEditorSelect?.addEventListener('change', () => {
  const ruleId = ruleEditorSelect.value || '';
  if (!ruleId) return;
  state.activeRuleId = ruleId;
  fillRuleEditor(getRuleById(ruleId));
  setRuleEditorStatus('已切换规则', 'ok');
});

createRuleBtn?.addEventListener('click', async () => {
  try {
    const candidate = buildRuleFromEditor(null);
    const exists = state.rules.some(rule => rule.id === candidate.id);
    if (exists) throw new Error('规则 ID 已存在，请更换标签名或匹配值');
    state.rules = normalizeRules([...state.rules, candidate]);
    state.activeRuleId = candidate.id;
    await persistRules(`已新增标签：${candidate.label}`);
  } catch (err) {
    setRuleEditorStatus(`新增失败：${err?.message || '未知错误'}`, 'error');
  }
});

saveRuleEditorBtn?.addEventListener('click', async () => {
  if (!state.activeRuleId) {
    setRuleEditorStatus('请先选择一个规则', 'warn');
    return;
  }
  try {
    const index = state.rules.findIndex(rule => rule.id === state.activeRuleId);
    if (index < 0) throw new Error('未找到当前规则');
    const updated = buildRuleFromEditor(state.rules[index]);
    const nextRules = [...state.rules];
    nextRules[index] = updated;
    state.rules = normalizeRules(nextRules);
    await persistRules(`已保存标签：${updated.label}`);
  } catch (err) {
    setRuleEditorStatus(`保存失败：${err?.message || '未知错误'}`, 'error');
  }
});

deleteRuleBtn?.addEventListener('click', async () => {
  if (!state.activeRuleId) {
    setRuleEditorStatus('请先选择一个规则', 'warn');
    return;
  }
  const toDelete = getRuleById(state.activeRuleId);
  if (!toDelete) {
    setRuleEditorStatus('当前规则不存在', 'error');
    return;
  }
  const nextRules = state.rules.filter(rule => rule.id !== state.activeRuleId);
  state.rules = normalizeRules(nextRules);
  state.activeRuleId = state.rules[0]?.id || '';
  await persistRules(`已删除标签：${toDelete.label || toDelete.id}`);
});

debugModeCheckbox?.addEventListener('change', async () => {
  state.debugMode = Boolean(debugModeCheckbox.checked);
  await chrome.storage.local.set({ [STORAGE_KEYS.debugMode]: state.debugMode });
  setDebugStatus(state.debugMode ? '调试模式已启用' : '调试模式已关闭', 'ok');
});

saveNotionConfigBtn?.addEventListener('click', async () => {
  try {
    await saveNotionConfig();
    setNotionConfigStatus('已保存 Notion 配置', 'ok');
  } catch (err) {
    setNotionConfigStatus(`保存失败：${err?.message || '未知错误'}`, 'error');
  }
});

notionVerifyBtn?.addEventListener('click', async () => {
  const token = notionTokenInput?.value?.trim() || state.notionToken;
  if (!token) {
    setNotionConfigStatus('请先填写 Integration Token', 'warn');
    return;
  }
  notionVerifyBtn.disabled = true;
  try {
    const info = await verifyNotionConnection(token);
    state.notionToken = token;
    setNotionConfigStatus(`连接成功：${info.userName}`, 'ok');
  } catch (err) {
    setNotionConfigStatus(`连接失败：${err?.message || '验证失败'}`, 'error');
  } finally {
    notionVerifyBtn.disabled = false;
  }
});

notionDiscoverPagesBtn?.addEventListener('click', async () => {
  const token = notionTokenInput?.value?.trim() || state.notionToken;
  if (!token) {
    setNotionConfigStatus('请先填写 Integration Token', 'warn');
    return;
  }
  notionDiscoverPagesBtn.disabled = true;
  setNotionConfigStatus('正在拉取可写目标（页面/数据库）...', 'warn');
  try {
    const targets = await discoverWritableNotionTargets(token);
    state.notionToken = token;
    state.notionTargetCandidates = targets;

    const currentType = getCurrentNotionTargetType();
    const currentId = toNotionUuid(state.notionParentPageId || notionParentPageInput?.value?.trim() || '');
    if (currentId) {
      const current = targets.find(item => item.id === currentId && item.type === currentType);
      if (current) setLastTargetTitleByType(currentType, current.title || '');
    }

    applyNotionTargetCandidates(targets);
    persistNotionTargetSelection().catch(err => {
      console.warn('Persist notion candidates cache failed:', err);
    });

    if (targets.length) {
      const pageCount = targets.filter(item => item.type === 'page').length;
      const databaseCount = targets.filter(item => item.type === 'database').length;
      setNotionConfigStatus(`发现 ${targets.length} 个可写目标（页面 ${pageCount} / 数据库 ${databaseCount}）`, 'ok');
    } else {
      setNotionConfigStatus('未发现可写目标，请先在 Notion 中 Add connections', 'warn');
    }
  } catch (err) {
    setNotionConfigStatus(`自动发现失败：${err?.message || '未知错误'}`, 'error');
  } finally {
    notionDiscoverPagesBtn.disabled = false;
  }
});

notionPageSelect?.addEventListener('change', () => {
  const parsed = parseNotionTargetValue(notionPageSelect.value || '');
  if (!parsed.id || !parsed.type) return;

  const selectedTarget =
    state.notionTargetCandidates.find(item => item.id === parsed.id && item.type === parsed.type) || null;

  state.notionParentPageId = parsed.id;
  state.notionWriteTargetType = parsed.type;
  setLastTargetIdByType(parsed.type, parsed.id);

  if (notionParentPageInput) notionParentPageInput.value = parsed.id;
  if (notionTargetTypeSelect) notionTargetTypeSelect.value = parsed.type;

  persistNotionTargetSelection().catch(err => {
    console.warn('Persist notion target selection failed:', err);
  });

  const label = parsed.type === 'database' ? '数据库' : '页面';
  if (selectedTarget) {
    setLastTargetTitleByType(parsed.type, selectedTarget.title || '');
    setNotionConfigStatus(`已选择${label}：${selectedTarget.title}`, 'ok');
  } else {
    setNotionConfigStatus(`已填充${label} ID`, 'ok');
  }
});

notionTargetTypeSelect?.addEventListener('change', () => {
  const targetType = notionTargetTypeSelect.value === 'database' ? 'database' : 'page';
  state.notionWriteTargetType = targetType;
  const nextId = getLastTargetIdByType(targetType);
  state.notionParentPageId = nextId || '';
  if (notionParentPageInput) notionParentPageInput.value = state.notionParentPageId;
  applyNotionTargetCandidates(state.notionTargetCandidates);
  persistNotionTargetSelection().catch(err => {
    console.warn('Persist notion target type failed:', err);
  });
  setNotionConfigStatus(targetType === 'database' ? '已切换到数据库模式' : '已切换到页面模式', 'ok');
});

saveObsidianConfigBtn?.addEventListener('click', async () => {
  try {
    if (!state.vaultRootHandle) throw new Error('请先点击“选择本地库目录”');
    await saveObsidianConfig();
    updateWriteModeHint();
    refreshObsidianReadinessStatus();
  } catch (err) {
    setObsidianConfigStatus(`保存失败：${err?.message || '未知错误'}`, 'error');
    refreshObsidianReadinessStatus();
  }
});

obsidianWriteModeSelect?.addEventListener('change', () => {
  state.obsidianWriteMode = obsidianWriteModeSelect.value === 'local' ? 'local' : 'uri';
  updateWriteModeHint();
  refreshObsidianReadinessStatus();
});

pickObsidianVaultDirBtn?.addEventListener('click', async () => {
  if (typeof window.showDirectoryPicker !== 'function') {
    setObsidianVaultDirStatus('当前浏览器不支持目录选择器。', 'error');
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const permission = await requestHandlePermission(handle, 'readwrite');
    if (permission !== 'granted') {
      setObsidianVaultDirStatus('未获得目录写入权限。', 'error');
      return;
    }
    await saveVaultRootHandle(handle);
    await syncVaultFromHandle(handle);
    await refreshVaultBindingStatus();
    refreshObsidianReadinessStatus();
    setObsidianConfigStatus('Vault 已从本地库目录自动同步，可继续保存其他配置。', 'ok');
  } catch (err) {
    if (err?.name === 'AbortError') return;
    setObsidianVaultDirStatus(`绑定目录失败：${err?.message || '未知错误'}`, 'error');
  }
});

clearObsidianVaultDirBtn?.addEventListener('click', async () => {
  try {
    await clearVaultRootHandle();
    state.vaultRootHandle = null;
    state.obsidianVault = '';
    if (obsidianVaultInput) obsidianVaultInput.value = '';
    await chrome.storage.local.set({ [STORAGE_KEYS.obsidianVault]: '' });
    await refreshVaultBindingStatus();
    setObsidianVaultDirStatus('已清除目录授权。', 'ok');
    refreshObsidianReadinessStatus();
  } catch (err) {
    setObsidianVaultDirStatus(`清除失败：${err?.message || '未知错误'}`, 'error');
  }
});

loadSettings().catch(err => {
  console.error('Load settings failed:', err);
  setRuleEditorStatus('设置加载失败', 'error');
  setNotionConfigStatus('设置加载失败', 'error');
});

import { extractPageContent } from './extractor.js';
import { renderIcon } from './icons.js';
import { STORAGE_KEYS, getDefaultRules, normalizeRules, ruleHostText } from './rules.js';

const grabBtn = document.getElementById('grabBtn');
const copyBtn = document.getElementById('copyBtn');
const preview = document.getElementById('preview');
const siteBadges = document.getElementById('siteBadges');
const rulesInput = document.getElementById('rulesInput');
const saveRulesBtn = document.getElementById('saveRulesBtn');
const resetRulesBtn = document.getElementById('resetRulesBtn');
const copyRulesBtn = document.getElementById('copyRulesBtn');
const debugOutput = document.getElementById('debugOutput');
const debugModeCheckbox = document.getElementById('debugModeCheckbox');
const statusChip = document.getElementById('statusChip');
const countChip = document.getElementById('countChip');
const exportNotionBtn = document.getElementById('exportNotionBtn');
const clipToNotionBtn = document.getElementById('clipToNotionBtn');
const notionTokenInput = document.getElementById('notionTokenInput');
const notionParentPageInput = document.getElementById('notionParentPageInput');
const saveNotionConfigBtn = document.getElementById('saveNotionConfigBtn');
const notionVerifyBtn = document.getElementById('notionVerifyBtn');
const notionDiscoverPagesBtn = document.getElementById('notionDiscoverPagesBtn');
const notionPageSelect = document.getElementById('notionPageSelect');
const notionConfigStatus = document.getElementById('notionConfigStatus');
const footer = document.querySelector('.footer');
const debugMockBtn = document.getElementById('debugMockBtn');

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);
const PREVIEW_PROTOCOLS = new Set(['http:', 'https:', 'data:', 'blob:']);
const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';

const state = {
  rules: getDefaultRules(),
  debugMode: true,
  activeHost: '',
  notionToken: '',
  notionParentPageId: '',
  notionPageCandidates: [],
};

function createPlaceholderImageDataUrl(title, toneA, toneB) {
  const safeTitle = escapeHtml(title);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${toneA}" />
          <stop offset="100%" stop-color="${toneB}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" rx="36" fill="url(#g)" />
      <circle cx="1030" cy="120" r="120" fill="rgba(255,255,255,0.18)" />
      <circle cx="220" cy="560" r="160" fill="rgba(255,255,255,0.12)" />
      <rect x="84" y="84" width="188" height="30" rx="15" fill="rgba(255,255,255,0.22)" />
      <text x="84" y="290" fill="#ffffff" font-family="SF Pro Display, Arial, sans-serif" font-size="68" font-weight="700">${safeTitle}</text>
      <text x="84" y="362" fill="rgba(255,255,255,0.86)" font-family="SF Pro Text, Arial, sans-serif" font-size="28">Debug placeholder image for UI tuning</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const DEBUG_MOCK_PAYLOAD = {
  blocks: [
    { type: 'h1', content: '把文章净化成能直接粘进 Notion 的版本' },
    { type: 'p', content: '这是调试模式生成的虚拟内容，用来模拟真实文章的排版密度、长段落换行、按钮状态和图片区块，不依赖当前网页是否可抓取。' },
    { type: 'p', content: '你可以在任何页面点击这个悬浮按钮，快速填充标题、正文、二级标题、图片和长文段落，专门用于调字体、留白、按钮层级、卡片边界和滚动表现。' },
    { type: 'img', src: createPlaceholderImageDataUrl('Hero Cover', '#2563eb', '#0f172a') },
    { type: 'h2', content: '为什么这个模式有用' },
    { type: 'p', content: '很多页面是 chrome://、新标签页、登录后内容或者短文页面，根本无法稳定复现最终视觉。调试模式把 UI 调整和抓取能力拆开，让界面设计可以独立推进。' },
    { type: 'h3', content: '模拟真实使用场景' },
    { type: 'p', content: '这里保留了较长的中文段落、多个标题层级、图片区块和底部操作区显隐状态。你可以直接观察滚动手感、图片按钮位置、状态 chip 密度，以及 footer 在有内容时的空间分配。' },
    { type: 'img', src: createPlaceholderImageDataUrl('Inline Visual', '#ec4899', '#7c3aed') },
    { type: 'p', content: '如果你只是在调圆角、字号、色值、间距、边框或阴影，这个模式比不断切换网页更高效。等视觉确定后，再回到真实抓取链路验证即可。' },
  ],
  debug: {
    host: 'debug.mock.local',
    matchedRuleId: 'debug-preview',
    matchedRuleLabel: '调试样例',
    rootSelector: '#preview',
    preload: { enabled: false },
    counters: {
      candidates: 12,
      kept: 10,
      skipNoiseAncestor: 1,
      skipNoiseText: 0,
      skipEmpty: 1,
      skipDuplicateText: 0,
      skipContainerText: 0,
      skipInvalidImageSrc: 0,
      skipDecorativeImage: 0,
      skipSmallImage: 0,
      skipDuplicateImage: 0,
      stopByMaxBlocks: 0,
      stopByMaxChars: 0,
    },
  },
};

function setBtn(btn, icon, label) {
  btn.innerHTML = `${renderIcon(icon)}<span class="btn-text">${label}</span>`;
}

function setIconOnlyBtn(btn, icon, label = '') {
  btn.innerHTML = `${renderIcon(icon)}${label ? `<span class="btn-text">${label}</span>` : ''}`;
}

function normalizeHttpUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const url = new URL(raw, location.href);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function normalizePreviewUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const url = new URL(raw, location.href);
    return PREVIEW_PROTOCOLS.has(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function hostMatchesRule(host, rule) {
  const match = rule?.match || {};
  if (typeof match.hostEquals === 'string' && match.hostEquals && host === match.hostEquals) return true;
  if (typeof match.hostSuffix === 'string' && match.hostSuffix) {
    if (host === match.hostSuffix || host.endsWith(`.${match.hostSuffix}`)) return true;
  }
  if (typeof match.hostRegex === 'string' && match.hostRegex) {
    try {
      return new RegExp(match.hostRegex).test(host);
    } catch {
      return false;
    }
  }
  return false;
}

function renderStatus(message, kind = '') {
  const p = document.createElement('p');
  p.className = `msg${kind ? ` ${kind}` : ''}`;
  p.textContent = message;
  preview.replaceChildren(p);
  footer?.classList.remove('has-results');
  if (kind === 'error') setStatusChip('状态：失败', 'error');
  else if (kind === 'warn') setStatusChip('状态：提醒', 'warn');
  else setStatusChip('状态：就绪');
}

function renderRulesJson() {
  if (rulesInput) {
    rulesInput.value = JSON.stringify(state.rules, null, 2);
  }
}

function renderSiteBadges() {
  if (!siteBadges) return;
  const frag = document.createDocumentFragment();
  state.rules.forEach(rule => {
    const badge = document.createElement('span');
    badge.className = 'site-badge';
    badge.dataset.ruleId = rule.id;
    badge.textContent = rule.label || rule.id;
    badge.title = ruleHostText(rule);
    frag.appendChild(badge);
  });
  siteBadges.replaceChildren(frag);
}

function setStatusChip(text, tone = '') {
  if (!statusChip) return;
  statusChip.textContent = text;
  statusChip.classList.remove('status-running', 'status-ok', 'status-warn', 'status-error');
  if (tone) statusChip.classList.add(`status-${tone}`);
}

function setCountChip(count) {
  if (!countChip) return;
  countChip.textContent = `块数：${Math.max(0, Number(count) || 0)}`;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

function hostFromUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl) return '';
  try {
    return new URL(rawUrl).hostname || '';
  } catch {
    return '';
  }
}

function canInjectOnUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function highlightCurrentSiteBadge() {
  const badges = Array.from(document.querySelectorAll('.site-badge[data-rule-id]'));
  badges.forEach(badge => badge.classList.remove('active'));

  const tab = await getActiveTab();
  if (!tab?.url) {
    state.activeHost = '';
    return;
  }

  let host = '';
  try {
    host = new URL(tab.url).hostname;
  } catch {
    state.activeHost = '';
    return;
  }

  state.activeHost = host;
  badges.forEach(badge => {
    const rule = state.rules.find(item => item.id === badge.dataset.ruleId);
    if (rule && hostMatchesRule(host, rule)) {
      badge.classList.add('active');
    }
  });
}

function bindTabChangeListeners() {
  const refresh = () => {
    highlightCurrentSiteBadge().catch(err => {
      console.warn('Refresh site badges failed:', err);
    });
  };

  chrome.tabs.onActivated.addListener(() => {
    refresh();
  });

  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (!tab?.active) return;
    if (!changeInfo.url && changeInfo.status !== 'complete') return;
    refresh();
  });

  chrome.tabs.onRemoved.addListener(() => {
    refresh();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
}

function renderToPreview(blocks) {
  const frag = document.createDocumentFragment();
  blocks.forEach(block => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'img') {
      const src = normalizePreviewUrl(block.src);
      if (!src) return;

      const card = document.createElement('div');
      card.className = 'preview-image-card';
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      const copyImageBtn = document.createElement('button');
      copyImageBtn.type = 'button';
      copyImageBtn.className = 'copy-image-btn';
      copyImageBtn.textContent = '复制图片';
      copyImageBtn.dataset.copyImageBtn = '1';

      card.appendChild(img);
      card.appendChild(copyImageBtn);
      frag.appendChild(card);
      return;
    }

    const text = typeof block.content === 'string' ? block.content.trim() : '';
    if (!text) return;

    let tagName = '';
    if (block.type === 'h1') tagName = 'h1';
    else if (block.type === 'h2') tagName = 'h2';
    else if (block.type === 'h3') tagName = 'h3';
    else if (block.type === 'p') tagName = 'p';
    if (!tagName) return;

    const el = document.createElement(tagName);
    el.textContent = text;
    frag.appendChild(el);
  });

  preview.replaceChildren(frag);
  if (!preview.children.length) {
    setCountChip(0);
    renderStatus('未能提取到有效内容', 'warn');
    return;
  }
  setCountChip(preview.children.length);
  footer?.classList.add('has-results');
  setStatusChip('状态：已抓取', 'ok');
}

function renderDebug(debug, blocksCount = 0) {
  if (!debugOutput) return;
  if (!debug) {
    debugOutput.textContent = '未启用调试或暂无调试信息';
    return;
  }
  const counters = debug.counters || {};
  const candidates = Number(counters.candidates || 0);
  const kept = Number(counters.kept || 0);
  const keptRate = candidates > 0 ? `${((kept / candidates) * 100).toFixed(1)}%` : '0%';
  const summaryLines = [
    `host: ${debug.host || '-'}`,
    `规则: ${debug.matchedRuleLabel || '-'} (${debug.matchedRuleId || '-'})`,
    `root: ${debug.rootSelector || '-'}`,
    `预加载: ${debug.preload?.enabled ? `已执行(steps=${debug.preload.steps || 0}, imgs=${debug.preload.imageCandidates || 0})` : '未执行'}`,
    `候选: ${candidates}`,
    `保留: ${kept} (保留率 ${keptRate})`,
    `最终块数: ${blocksCount}`,
  ];
  const details = JSON.stringify(debug, null, 2);
  debugOutput.textContent = `${summaryLines.join('\n')}\n\n---- raw debug ----\n${details}`;
}

async function loadSettings() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.siteRules,
    STORAGE_KEYS.debugMode,
    STORAGE_KEYS.notionToken,
    STORAGE_KEYS.notionParentPageId,
  ]);
  state.rules = normalizeRules(stored[STORAGE_KEYS.siteRules]);
  state.debugMode = stored[STORAGE_KEYS.debugMode] !== false;
  state.notionToken = typeof stored[STORAGE_KEYS.notionToken] === 'string' ? stored[STORAGE_KEYS.notionToken].trim() : '';
  state.notionParentPageId =
    typeof stored[STORAGE_KEYS.notionParentPageId] === 'string' ? stored[STORAGE_KEYS.notionParentPageId].trim() : '';
  if (debugModeCheckbox) debugModeCheckbox.checked = state.debugMode;
  if (notionTokenInput) notionTokenInput.value = state.notionToken;
  if (notionParentPageInput) notionParentPageInput.value = state.notionParentPageId;
  applyNotionPageCandidates([]);
  setNotionConfigStatus('');
  renderRulesJson();
  renderSiteBadges();
  setStatusChip('状态：就绪');
  setCountChip(preview.children.length || 0);
  await highlightCurrentSiteBadge();
}

async function saveNotionConfig() {
  const notionToken = notionTokenInput?.value?.trim() || '';
  const notionParentPageId = notionParentPageInput?.value?.trim() || '';
  state.notionToken = notionToken;
  state.notionParentPageId = notionParentPageId;
  await chrome.storage.local.set({
    [STORAGE_KEYS.notionToken]: notionToken,
    [STORAGE_KEYS.notionParentPageId]: notionParentPageId,
  });
  setStatusChip('状态：Notion配置已保存', 'ok');
}

function setNotionConfigStatus(message, tone = '') {
  if (!notionConfigStatus) return;
  notionConfigStatus.textContent = message || '';
  notionConfigStatus.style.color =
    tone === 'error' ? '#b91c1c' : tone === 'ok' ? '#15803d' : tone === 'warn' ? '#b45309' : '#64748b';
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

function applyNotionPageCandidates(pages) {
  if (!notionPageSelect) return;
  const selected = toNotionUuid(notionParentPageInput?.value || state.notionParentPageId);
  const frag = document.createDocumentFragment();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = pages.length ? '请选择一个可写页面' : '未发现可写页面';
  frag.appendChild(placeholder);

  pages.forEach(page => {
    const option = document.createElement('option');
    option.value = page.id;
    const title = page.title || 'Untitled';
    option.textContent = title;
    option.title = page.url || page.id;
    if (selected && page.id === selected) option.selected = true;
    frag.appendChild(option);
  });

  notionPageSelect.replaceChildren(frag);
}

async function saveRulesFromInput() {
  if (!rulesInput) return;
  try {
    const parsed = JSON.parse(rulesInput.value);
    const normalized = normalizeRules(parsed);
    state.rules = normalized;
    await chrome.storage.local.set({ [STORAGE_KEYS.siteRules]: normalized });
    renderRulesJson();
    renderSiteBadges();
    await highlightCurrentSiteBadge();
    renderStatus('规则已保存', 'warn');
  } catch (err) {
    console.error('Invalid rules JSON:', err);
    renderStatus('规则JSON无效，请检查格式', 'error');
  }
}

async function resetRules() {
  state.rules = getDefaultRules();
  await chrome.storage.local.remove(STORAGE_KEYS.siteRules);
  renderRulesJson();
  renderSiteBadges();
  await highlightCurrentSiteBadge();
  renderStatus('已恢复默认规则', 'warn');
}

async function copyRulesJson() {
  if (!rulesInput) return;
  try {
    await navigator.clipboard.writeText(rulesInput.value || '');
    renderStatus('规则JSON已复制', 'warn');
  } catch (err) {
    console.error('Copy rules failed:', err);
    renderStatus('复制规则失败，请重试', 'error');
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array(0);
}

function encodeText(value) {
  return new TextEncoder().encode(String(value || ''));
}

function getImageExt(blob, src) {
  const mime = typeof blob?.type === 'string' ? blob.type.toLowerCase() : '';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/svg+xml') return 'svg';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  const pathname = (() => {
    try {
      return new URL(src, location.href).pathname || '';
    } catch {
      return '';
    }
  })();
  const ext = pathname.split('.').pop()?.toLowerCase() || '';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'jpg';
}

function sanitizeFilename(raw, fallback = 'article') {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, 80);
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

function splitTextForNotion(raw, chunkSize = 1800) {
  const text = String(raw || '').trim();
  if (!text) return [];
  if (text.length <= chunkSize) return [text];

  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const maxEnd = Math.min(text.length, start + chunkSize);
    let end = maxEnd;
    if (maxEnd < text.length) {
      const breakAt = text.lastIndexOf('\n', maxEnd);
      if (breakAt > start + Math.floor(chunkSize * 0.45)) {
        end = breakAt;
      }
    }
    const part = text.slice(start, end).trim();
    if (part) chunks.push(part);
    start = end;
  }
  return chunks;
}

function textBlockToNotion(blockType, content) {
  const parts = splitTextForNotion(content);
  if (!parts.length) return [];
  const blockName =
    blockType === 'h1' ? 'heading_1' : blockType === 'h2' ? 'heading_2' : blockType === 'h3' ? 'heading_3' : 'paragraph';

  return parts.map(part => ({
    object: 'block',
    type: blockName,
    [blockName]: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: part,
          },
        },
      ],
    },
  }));
}

function collectPreviewBlocks() {
  const blocks = [];
  for (const node of Array.from(preview.childNodes)) {
    const tag = node.nodeName;
    const text = node.textContent?.trim() || '';
    if (tag === 'H1' && text) {
      blocks.push({ type: 'h1', content: text });
      continue;
    }
    if (tag === 'H2' && text) {
      blocks.push({ type: 'h2', content: text });
      continue;
    }
    if (tag === 'H3' && text) {
      blocks.push({ type: 'h3', content: text });
      continue;
    }
    if (tag === 'P' && text) {
      blocks.push({ type: 'p', content: text });
      continue;
    }
    const imageNode = (() => {
      if (tag === 'IMG') return node;
      if (node instanceof Element && node.classList.contains('preview-image-card')) {
        return node.querySelector('img');
      }
      return null;
    })();
    if (!(imageNode instanceof HTMLImageElement)) continue;
    const src = normalizePreviewUrl(imageNode.getAttribute('src') || imageNode.src || imageNode.currentSrc || '');
    if (!src) continue;
    blocks.push({ type: 'img', src });
  }
  return blocks;
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

async function notionUploadImage(blob, filename, token) {
  const createPayload = await notionRequest('/file_uploads', {
    method: 'POST',
    token,
    json: {
      filename,
      content_type: blob.type || 'application/octet-stream',
      mode: 'single_part',
    },
  });
  const uploadId = createPayload?.id;
  if (!uploadId) {
    throw new Error('Notion file upload id missing');
  }

  const form = new FormData();
  form.append('file', blob, filename);
  const sendRes = await fetch(`${NOTION_API_BASE}/file_uploads/${uploadId}/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
    },
    body: form,
  });
  let sendPayload = null;
  try {
    sendPayload = await sendRes.json();
  } catch {
    sendPayload = null;
  }
  if (!sendRes.ok) {
    const code = sendPayload?.code ? `${sendPayload.code}: ` : '';
    const message = sendPayload?.message || `HTTP ${sendRes.status}`;
    throw new Error(`${code}${message}`);
  }

  const status = sendPayload?.status || '';
  if (status !== 'uploaded') {
    await notionRequest(`/file_uploads/${uploadId}/complete`, {
      method: 'POST',
      token,
      json: {},
    });
  }
  return uploadId;
}

async function verifyNotionConnection(token) {
  const me = await notionRequest('/users/me', {
    method: 'GET',
    token,
  });
  const userName = me?.name || me?.bot?.owner?.user?.name || me?.type || '当前集成';
  return { userName };
}

async function discoverWritableNotionPages(token) {
  const pages = [];
  let cursor = '';
  for (let i = 0; i < 3; i += 1) {
    const payload = await notionRequest('/search', {
      method: 'POST',
      token,
      json: {
        query: '',
        filter: {
          property: 'object',
          value: 'page',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        page_size: 50,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });
    const results = Array.isArray(payload?.results) ? payload.results : [];
    for (const page of results) {
      const id = toNotionUuid(page?.id);
      if (!id) continue;
      const title = notionPageTitleFromObject(page) || `Untitled (${id.slice(0, 8)})`;
      pages.push({
        id,
        title,
        url: typeof page?.url === 'string' ? page.url : '',
      });
    }
    if (!payload?.has_more || !payload?.next_cursor) break;
    cursor = payload.next_cursor;
  }

  const uniq = [];
  const seen = new Set();
  pages.forEach(page => {
    if (seen.has(page.id)) return;
    seen.add(page.id);
    uniq.push(page);
  });
  return uniq;
}

function chunkArray(input, size) {
  const chunks = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size));
  }
  return chunks;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const limit = Math.max(1, Number(concurrency) || 1);
  const input = Array.isArray(items) ? items : [];
  if (!input.length) return [];

  const results = new Array(input.length);
  let nextIndex = 0;

  async function runOne() {
    while (nextIndex < input.length) {
      const cur = nextIndex;
      nextIndex += 1;
      results[cur] = await worker(input[cur], cur);
    }
  }

  const runners = [];
  const runnerCount = Math.min(limit, input.length);
  for (let i = 0; i < runnerCount; i += 1) {
    runners.push(runOne());
  }
  await Promise.all(runners);
  return results;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dateToDosTimeParts(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const month = Math.max(1, Math.min(12, date.getMonth() + 1));
  const day = Math.max(1, Math.min(31, date.getDate()));
  const hour = Math.max(0, Math.min(23, date.getHours()));
  const minute = Math.max(0, Math.min(59, date.getMinutes()));
  const second = Math.max(0, Math.min(59, date.getSeconds()));
  const dosTime = (hour << 11) | (minute << 5) | Math.floor(second / 2);
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

function createZipBlob(files) {
  const normalized = files.map(file => {
    const nameBytes = encodeText(file.name);
    const dataBytes = toUint8Array(file.data);
    const crc = crc32(dataBytes);
    const { dosTime, dosDate } = dateToDosTimeParts(file.date || new Date());
    return {
      name: file.name,
      nameBytes,
      dataBytes,
      crc,
      dosTime,
      dosDate,
    };
  });

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  normalized.forEach(file => {
    const localHeader = new Uint8Array(30 + file.nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, file.dosTime);
    writeUint16(localView, 12, file.dosDate);
    writeUint32(localView, 14, file.crc);
    writeUint32(localView, 18, file.dataBytes.length);
    writeUint32(localView, 22, file.dataBytes.length);
    writeUint16(localView, 26, file.nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(file.nameBytes, 30);
    localParts.push(localHeader, file.dataBytes);

    const centralHeader = new Uint8Array(46 + file.nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, file.dosTime);
    writeUint16(centralView, 14, file.dosDate);
    writeUint32(centralView, 16, file.crc);
    writeUint32(centralView, 20, file.dataBytes.length);
    writeUint32(centralView, 24, file.dataBytes.length);
    writeUint16(centralView, 28, file.nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralHeader.set(file.nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + file.dataBytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, normalized.length);
  writeUint16(endView, 10, normalized.length);
  writeUint32(endView, 12, centralSize);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  return new Blob([...localParts, ...centralParts, endRecord], { type: 'application/zip' });
}

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

async function fetchImageBlob(src) {
  const response = await fetch(src, { credentials: 'include', cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }
  const blob = await response.blob();
  if (!blob || !blob.size) {
    throw new Error('Empty image blob');
  }
  return blob;
}

async function localizePreviewImagesForWechat() {
  if (state.activeHost !== 'mp.weixin.qq.com') return { total: 0, localized: 0 };
  const images = Array.from(preview.querySelectorAll('img'));
  if (!images.length) return { total: 0, localized: 0 };

  const outputs = await mapWithConcurrency(images, 4, async image => {
    const src = normalizeHttpUrl(image.getAttribute('src') || image.src || '');
    if (!src) return 0;
    try {
      const blob = await fetchImageBlob(src);
      const dataUrl = await blobToDataUrl(blob);
      if (!dataUrl) return 0;
      image.dataset.remoteSrc = src;
      image.src = dataUrl;
      return 1;
    } catch (err) {
      console.warn('Localize preview image failed:', err);
      return 0;
    }
  });

  const localized = outputs.reduce((sum, value) => sum + (Number(value) || 0), 0);
  return { total: images.length, localized };
}

async function copySinglePreviewImage(imageEl) {
  const rawSrc = imageEl?.currentSrc || imageEl?.src || '';
  const src = typeof rawSrc === 'string' ? rawSrc.trim() : '';
  if (!src) {
    throw new Error('No image source');
  }
  const response = await fetch(src, { credentials: 'include', cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }
  const blob = await response.blob();
  if (!blob || !blob.size) {
    throw new Error('Empty image blob');
  }

  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Rich clipboard not supported');
  }
  const mimeType = typeof blob.type === 'string' && blob.type.startsWith('image/') ? blob.type : 'image/png';
  await navigator.clipboard.write([
    new ClipboardItem({
      [mimeType]: blob,
    }),
  ]);
}

async function buildNotionExportZipBlob() {
  const files = [];
  const markdownLines = [];
  let imageIndex = 0;

  for (const node of Array.from(preview.childNodes)) {
    const tag = node.nodeName;
    const text = node.textContent?.trim() || '';
    if (tag === 'H1' && text) {
      markdownLines.push(`# ${text}`);
      continue;
    }
    if (tag === 'H2' && text) {
      markdownLines.push(`## ${text}`);
      continue;
    }
    if (tag === 'H3' && text) {
      markdownLines.push(`### ${text}`);
      continue;
    }
    if (tag === 'P' && text) {
      markdownLines.push(text);
      continue;
    }
    const imageNode = (() => {
      if (tag === 'IMG') return node;
      if (node instanceof Element && node.classList.contains('preview-image-card')) {
        return node.querySelector('img');
      }
      return null;
    })();
    if (!(imageNode instanceof HTMLImageElement)) continue;

    const src = imageNode.currentSrc || imageNode.src || imageNode.getAttribute('src') || '';
    if (!src) continue;
    try {
      const response = await fetch(src, { credentials: 'include', cache: 'force-cache' });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (!blob || !blob.size) continue;
      imageIndex += 1;
      const ext = getImageExt(blob, src);
      const imageName = `images/${String(imageIndex).padStart(3, '0')}.${ext}`;
      const imageData = new Uint8Array(await blob.arrayBuffer());
      files.push({ name: imageName, data: imageData, date: new Date() });
      markdownLines.push(`![](${imageName})`);
    } catch (err) {
      console.warn('Export image failed:', err);
    }
  }

  const markdown = markdownLines.join('\n\n').trim();
  if (!markdown) {
    throw new Error('No exportable content');
  }

  files.push({ name: 'article.md', data: encodeText(markdown), date: new Date() });
  return createZipBlob(files);
}

async function clipPreviewToNotion() {
  const notionToken = state.notionToken || notionTokenInput?.value?.trim() || '';
  const parentRaw = state.notionParentPageId || notionParentPageInput?.value?.trim() || '';
  const parentPageId = toNotionUuid(parentRaw);
  if (!notionToken) {
    throw new Error('请先填写并保存 Notion Integration Token');
  }
  if (!parentPageId) {
    throw new Error('Parent Page ID / URL 无效');
  }

  const blocks = collectPreviewBlocks();
  if (!blocks.length) {
    throw new Error('当前没有可发送内容');
  }

  const tab = await getActiveTab();
  const titleFromBlocks = blocks.find(item => item.type === 'h1')?.content || '';
  const pageTitle = sanitizeFilename(titleFromBlocks || tab?.title || '剪藏文章', '剪藏文章').slice(0, 90);

  let created = null;
  try {
    created = await notionRequest('/pages', {
      method: 'POST',
      token: notionToken,
      json: {
        parent: {
          type: 'page_id',
          page_id: parentPageId,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: pageTitle,
                },
              },
            ],
          },
        },
        children: [],
      },
    });
  } catch (err) {
    console.warn('Create page via /pages failed, fallback to child_page block:', err);
    const appended = await notionRequest(`/blocks/${parentPageId}/children`, {
      method: 'PATCH',
      token: notionToken,
      json: {
        children: [
          {
            object: 'block',
            type: 'child_page',
            child_page: {
              title: pageTitle,
            },
          },
        ],
      },
    });
    created = appended?.results?.[0] || null;
  }

  const pageId = created?.id;
  if (!pageId) {
    throw new Error('创建 Notion 页面失败：未返回页面 ID');
  }

  const totalImages = blocks.filter(item => item.type === 'img').length;
  let finishedImages = 0;
  let imageCount = 0;
  const mappedChildren = await mapWithConcurrency(blocks, 3, async (block, index) => {
    if (block.type !== 'img') {
      return textBlockToNotion(block.type, block.content);
    }
    try {
      const blob = await fetchImageBlob(block.src);
      const ext = getImageExt(blob, block.src);
      const uploadId = await notionUploadImage(blob, `image-${String(index + 1).padStart(3, '0')}.${ext}`, notionToken);
      imageCount += 1;
      finishedImages += 1;
      setStatusChip(`状态：发送 Notion 中（图片 ${finishedImages}/${totalImages}）`, 'running');
      return [
        {
          object: 'block',
          type: 'image',
          image: {
            type: 'file_upload',
            file_upload: {
              id: uploadId,
            },
          },
        },
      ];
    } catch (err) {
      finishedImages += 1;
      setStatusChip(`状态：发送 Notion 中（图片 ${finishedImages}/${totalImages}）`, 'running');
      console.warn('Upload image to Notion failed:', err);
      return textBlockToNotion('p', `[图片上传失败] ${block.src}`);
    }
  });
  const notionChildren = mappedChildren.flat();

  if (!notionChildren.length) {
    throw new Error('没有可写入 Notion 的块');
  }

  const batches = chunkArray(notionChildren, 90);
  for (const children of batches) {
    await notionRequest(`/blocks/${pageId}/children`, {
      method: 'PATCH',
      token: notionToken,
      json: { children },
    });
  }

  return {
    pageId,
    pageUrl: created?.url || '',
    imageCount,
    blockCount: notionChildren.length,
  };
}

async function buildClipboardPayload() {
  const tab = await getActiveTab();
  const host = (() => {
    try {
      return tab?.url ? new URL(tab.url).hostname : '';
    } catch {
      return '';
    }
  })();
  const shouldInlineWechatImages = host === 'mp.weixin.qq.com';

  const markdownLines = [];
  const htmlLines = [];
  const imageBlobs = [];
  let inlinedWechatImageCount = 0;

  for (const node of Array.from(preview.childNodes)) {
    const tag = node.nodeName;
    const text = node.textContent?.trim() || '';
    if (tag === 'H1' && text) {
      markdownLines.push(`# ${text}`);
      htmlLines.push(`<h1>${escapeHtml(text)}</h1>`);
      continue;
    }
    if (tag === 'H2' && text) {
      markdownLines.push(`## ${text}`);
      htmlLines.push(`<h2>${escapeHtml(text)}</h2>`);
      continue;
    }
    if (tag === 'H3' && text) {
      markdownLines.push(`### ${text}`);
      htmlLines.push(`<h3>${escapeHtml(text)}</h3>`);
      continue;
    }
    if (tag === 'P' && text) {
      markdownLines.push(text);
      htmlLines.push(`<p>${escapeHtml(text)}</p>`);
      continue;
    }
    const imageNode = (() => {
      if (tag === 'IMG') return node;
      if (node instanceof Element && node.classList.contains('preview-image-card')) {
        return node.querySelector('img');
      }
      return null;
    })();
    if (imageNode instanceof HTMLImageElement) {
      const src = normalizePreviewUrl(imageNode.getAttribute('src') || imageNode.src || '');
      if (!src) continue;
      markdownLines.push(`![](${src})`);
      let htmlSrc = src;
      if (shouldInlineWechatImages) {
        try {
          const blob = await fetchImageBlob(src);
          htmlSrc = await blobToDataUrl(blob);
          imageBlobs.push(blob);
          inlinedWechatImageCount += 1;
        } catch (err) {
          console.warn('Inline wechat image failed, fallback to remote src:', err);
          htmlSrc = src;
        }
      }
      htmlLines.push(`<p><img src="${escapeHtml(htmlSrc)}" alt="" /></p>`);
    }
  }

  return {
    markdown: markdownLines.join('\n\n').trim(),
    html: htmlLines.join('\n').trim(),
    inlinedWechatImageCount,
    isWechat: shouldInlineWechatImages,
    imageBlobs,
  };
}

function renderDebugMock() {
  state.activeHost = 'debug.mock.local';
  renderToPreview(DEBUG_MOCK_PAYLOAD.blocks);
  renderDebug(DEBUG_MOCK_PAYLOAD.debug, DEBUG_MOCK_PAYLOAD.blocks.length);
  setBtn(grabBtn, 'refreshCw', '重新抓取');
  setStatusChip('状态：调试样例', 'ok');
}

grabBtn.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab?.id) {
    renderStatus('未找到可用标签页', 'error');
    return;
  }
  if (!canInjectOnUrl(tab.url || '')) {
    setCountChip(0);
    renderStatus('当前页面不支持抓取，请切换到普通网页（http/https）后重试。', 'warn');
    return;
  }
  state.activeHost = hostFromUrl(tab.url);

  grabBtn.disabled = true;
  setBtn(grabBtn, 'refreshCw', '抓取中...');
  setStatusChip('状态：抓取中', 'running');
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageContent,
      args: [{ rules: state.rules, debug: state.debugMode }],
    });

    const payload = results?.[0]?.result;
    const blocks = Array.isArray(payload?.blocks) ? payload.blocks : [];
    if (!blocks.length) {
      setCountChip(0);
      renderStatus('未能提取到有效内容', 'warn');
      renderDebug(payload?.debug || null, blocks.length);
      return;
    }

    renderToPreview(blocks);
    if (state.activeHost === 'mp.weixin.qq.com') {
      setStatusChip('状态：图片处理中', 'running');
      const result = await localizePreviewImagesForWechat();
      if (result.total > 0 && result.localized > 0) {
        setStatusChip(`状态：已抓取（图片本地化 ${result.localized}/${result.total}）`, 'ok');
      } else if (result.total > 0) {
        setStatusChip('状态：已抓取（图片本地化失败）', 'warn');
      }
    }
    renderDebug(payload?.debug || null, blocks.length);
    setBtn(grabBtn, 'refreshCw', '重新抓取');
  } catch (err) {
    console.error('Grabbing failed:', err);
    setCountChip(0);
    const message = typeof err?.message === 'string' ? err.message : '';
    if (message.includes('Cannot access contents of the page') || message.includes('Cannot access a chrome:// URL')) {
      renderStatus('当前页面不支持抓取，请切换到普通网页（http/https）后重试。', 'warn');
    } else {
      renderStatus('抓取失败，请刷新页面重试', 'error');
    }
  } finally {
    grabBtn.disabled = false;
    if (!grabBtn.textContent?.includes('重新抓取')) {
      setBtn(grabBtn, 'zap', '开始净化');
    }
  }
});

copyBtn.addEventListener('click', async () => {
  const payload = await buildClipboardPayload();
  if (!payload.markdown) {
    setStatusChip('状态：无可复制内容', 'warn');
    renderStatus('当前没有可复制的内容', 'warn');
    return;
  }

  const orig = copyBtn.innerHTML;
  try {
    let copied = false;
    let binaryImageCopiedCount = 0;
    let copiedAsWechatHtmlOnly = false;
    const canUseRichClipboard = Boolean(
      navigator.clipboard?.write &&
        typeof ClipboardItem !== 'undefined' &&
        payload.html
    );
    if (canUseRichClipboard) {
      try {
        if (payload.isWechat) {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([payload.html], { type: 'text/html' }),
            }),
          ]);
          copiedAsWechatHtmlOnly = true;
        } else {
          const clipboardItems = [
            new ClipboardItem({
              'text/plain': new Blob([payload.markdown], { type: 'text/plain' }),
              'text/html': new Blob([payload.html], { type: 'text/html' }),
            }),
          ];
          await navigator.clipboard.write(clipboardItems);
        }
        copied = true;
        binaryImageCopiedCount = payload.isWechat ? payload.imageBlobs.length : 0;
      } catch (err) {
        console.warn('Rich clipboard write failed, fallback to text:', err);
      }
    }

    if (!copied) {
      await navigator.clipboard.writeText(payload.markdown);
    }

    setBtn(copyBtn, 'check', '已存入剪贴板');
    const copiedStatus = copiedAsWechatHtmlOnly
      ? '状态：已复制（公众号HTML）'
      : binaryImageCopiedCount > 0
        ? `状态：已复制（二进制${binaryImageCopiedCount}图）`
        : '状态：已复制';
    setStatusChip(copiedStatus, 'ok');
  } catch (err) {
    console.error('Copy failed:', err);
    setBtn(copyBtn, 'circleX', '复制失败');
    setStatusChip('状态：复制失败', 'error');
    renderStatus('复制失败，请重试', 'error');
  } finally {
    setTimeout(() => {
      copyBtn.innerHTML = orig;
    }, 2000);
  }
});

preview.addEventListener('click', async event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const btn = target.closest('[data-copy-image-btn]');
  if (!(btn instanceof HTMLButtonElement)) return;

  const image = btn.parentElement?.querySelector('img');
  if (!(image instanceof HTMLImageElement)) return;

  const originalText = btn.textContent || '复制图片';
  btn.disabled = true;
  btn.textContent = '复制中...';
  try {
    await copySinglePreviewImage(image);
    btn.textContent = '已复制';
    setStatusChip('状态：单图已复制', 'ok');
  } catch (err) {
    console.error('Copy single image failed:', err);
    btn.textContent = '复制失败';
    setStatusChip('状态：单图复制失败', 'error');
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = originalText;
    }, 1200);
  }
});

exportNotionBtn?.addEventListener('click', async () => {
  const labelEl = exportNotionBtn.querySelector('.btn-text');
  const original = labelEl?.textContent || '导出 Notion 包';
  exportNotionBtn.disabled = true;
  labelEl?.replaceChildren('导出中...');
  try {
    const zipBlob = await buildNotionExportZipBlob();
    const title = sanitizeFilename(preview.querySelector('h1')?.textContent || 'notion-import');
    const filename = `${title}.zip`;
    downloadBlob(zipBlob, filename);
    setStatusChip('状态：导出完成', 'ok');
  } catch (err) {
    console.error('Export notion package failed:', err);
    setStatusChip('状态：导出失败', 'error');
  } finally {
    exportNotionBtn.disabled = false;
    labelEl?.replaceChildren(original);
  }
});

saveNotionConfigBtn?.addEventListener('click', async () => {
  try {
    await saveNotionConfig();
    setNotionConfigStatus('已保存 Notion 配置', 'ok');
  } catch (err) {
    console.error('Save notion config failed:', err);
    setStatusChip('状态：Notion配置保存失败', 'error');
    setNotionConfigStatus('保存失败，请重试', 'error');
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
    setStatusChip('状态：Notion已连接', 'ok');
  } catch (err) {
    const message = typeof err?.message === 'string' ? err.message : '验证失败';
    setNotionConfigStatus(`连接失败：${message}`, 'error');
    setStatusChip('状态：Notion连接失败', 'error');
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
  setNotionConfigStatus('正在拉取可写页面...', 'warn');
  try {
    const pages = await discoverWritableNotionPages(token);
    state.notionToken = token;
    state.notionPageCandidates = pages;
    applyNotionPageCandidates(pages);
    if (pages.length) {
      setNotionConfigStatus(`发现 ${pages.length} 个可写页面，请选择一个`, 'ok');
      setStatusChip('状态：可选页面已加载', 'ok');
    } else {
      setNotionConfigStatus('未发现可写页面，请先在 Notion 中 Add connections', 'warn');
      setStatusChip('状态：未发现可写页面', 'warn');
    }
  } catch (err) {
    const message = typeof err?.message === 'string' ? err.message : '拉取失败';
    setNotionConfigStatus(`自动发现失败：${message}`, 'error');
    setStatusChip('状态：页面发现失败', 'error');
  } finally {
    notionDiscoverPagesBtn.disabled = false;
  }
});

notionPageSelect?.addEventListener('change', () => {
  const selectedId = notionPageSelect.value || '';
  if (!selectedId) return;
  const selectedPage = state.notionPageCandidates.find(page => page.id === selectedId) || null;
  state.notionParentPageId = selectedId;
  if (notionParentPageInput) notionParentPageInput.value = selectedId;
  if (selectedPage) {
    setNotionConfigStatus(`已选择：${selectedPage.title}`, 'ok');
  } else {
    setNotionConfigStatus('已填充 Parent Page', 'ok');
  }
});

clipToNotionBtn?.addEventListener('click', async () => {
  const original = clipToNotionBtn.innerHTML;
  clipToNotionBtn.disabled = true;
  setIconOnlyBtn(clipToNotionBtn, 'send', '发送中...');
  setStatusChip('状态：发送 Notion 中', 'running');
  try {
    const result = await clipPreviewToNotion();
    setIconOnlyBtn(clipToNotionBtn, 'check', '已发送');
    setStatusChip(`状态：Notion 已写入（${result.imageCount} 图）`, 'ok');
    if (statusChip) statusChip.title = '';
    if (result.pageUrl) {
      chrome.tabs.create({ url: result.pageUrl }).catch(err => {
        console.warn('Open notion page failed:', err);
      });
    }
  } catch (err) {
    console.error('Clip to notion failed:', err);
    const message = typeof err?.message === 'string' ? err.message : '发送失败';
    setIconOnlyBtn(clipToNotionBtn, 'circleX', '发送失败');
    setStatusChip('状态：Notion 发送失败', 'error');
    if (statusChip) statusChip.title = message;
  } finally {
    setTimeout(() => {
      clipToNotionBtn.innerHTML = original;
    }, 1800);
    clipToNotionBtn.disabled = false;
  }
});

saveRulesBtn?.addEventListener('click', saveRulesFromInput);
resetRulesBtn?.addEventListener('click', resetRules);
copyRulesBtn?.addEventListener('click', copyRulesJson);
debugModeCheckbox?.addEventListener('change', async () => {
  state.debugMode = Boolean(debugModeCheckbox.checked);
  await chrome.storage.local.set({ [STORAGE_KEYS.debugMode]: state.debugMode });
});

debugMockBtn?.addEventListener('click', () => {
  renderDebugMock();
});

setBtn(grabBtn, 'zap', '开始净化');
setBtn(copyBtn, 'copy', '复制 Markdown');
setIconOnlyBtn(exportNotionBtn, 'download', '导出 Notion 包');
setIconOnlyBtn(clipToNotionBtn, 'send', '发送到 Notion');
setIconOnlyBtn(debugMockBtn, 'flaskConical', '调试模式');

loadSettings().catch(err => {
  console.error('Load settings failed:', err);
  renderSiteBadges();
});

bindTabChangeListeners();

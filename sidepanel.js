import { extractPageContent } from './extractor.js';
import { renderIcon } from './icons.js';
import { STORAGE_KEYS, getDefaultRules, normalizeRules, ruleHostText } from './rules.js';
import {
  codeBlockToNotion,
  listBlockToNotion,
  normalizeCodeLanguage,
  normalizeInlineSegments,
  normalizeLinkUrl,
  textBlockToNotion,
} from './notion-blocks.js';
import {
  buildRelativePath,
  detectObsidianAttachmentFolder,
  detectObsidianNewNoteFolder,
  getVaultRootHandle,
  normalizePathSegments,
  queryHandlePermission,
  resolveUniqueFilePath,
  writeBlobFileByPath,
  writeTextFileByPath,
} from './obsidian-local.js';

const grabBtn = document.getElementById('grabBtn');
const copyBtn = document.getElementById('copyBtn');
const preview = document.getElementById('preview');
const siteBadges = document.getElementById('siteBadges');
const ruleEditorSelect = document.getElementById('ruleEditorSelect');
const ruleLabelInput = document.getElementById('ruleLabelInput');
const ruleContentInput = document.getElementById('ruleContentInput');
const createRuleBtn = document.getElementById('createRuleBtn');
const saveRuleEditorBtn = document.getElementById('saveRuleEditorBtn');
const deleteRuleBtn = document.getElementById('deleteRuleBtn');
const ruleEditorStatus = document.getElementById('ruleEditorStatus');
const debugOutput = document.getElementById('debugOutput');
const debugModeCheckbox = document.getElementById('debugModeCheckbox');
const statusChip = document.getElementById('statusChip');
const countChip = document.getElementById('countChip');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const exportNotionBtn = document.getElementById('exportNotionBtn');
const clipToObsidianBtn = document.getElementById('clipToObsidianBtn');
const clipToNotionBtn = document.getElementById('clipToNotionBtn');
const notionTokenInput = document.getElementById('notionTokenInput');
const notionParentPageInput = document.getElementById('notionParentPageInput');
const notionTargetTypeSelect = document.getElementById('notionTargetTypeSelect');
const saveNotionConfigBtn = document.getElementById('saveNotionConfigBtn');
const notionVerifyBtn = document.getElementById('notionVerifyBtn');
const notionDiscoverPagesBtn = document.getElementById('notionDiscoverPagesBtn');
const notionPageSelect = document.getElementById('notionPageSelect');
const notionConfigStatus = document.getElementById('notionConfigStatus');
const footer = document.querySelector('.footer');
const debugMockBtn = document.getElementById('debugMockBtn');
const obsidianToast = document.getElementById('obsidianToast');
const obsidianToastTitle = document.getElementById('obsidianToastTitle');
const obsidianToastDetail = document.getElementById('obsidianToastDetail');
const obsidianToastAction = document.getElementById('obsidianToastAction');
const obsidianToastDismiss = document.getElementById('obsidianToastDismiss');

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);
const PREVIEW_PROTOCOLS = new Set(['http:', 'https:', 'data:', 'blob:']);
const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';
const OBSIDIAN_URI_SOFT_LIMIT = 120000;

const state = {
  rules: getDefaultRules(),
  debugMode: true,
  activeHost: '',
  notionToken: '',
  notionParentPageId: '',
  obsidianVault: '',
  obsidianFolder: '',
  obsidianWriteMode: 'uri',
  obsidianAttachmentFolder: 'images',
  notionWriteTargetType: 'page',
  notionLastPageId: '',
  notionLastDataSourceId: '',
  notionLastPageTitle: '',
  notionLastDataSourceTitle: '',
  notionTargetCandidates: [],
  lastGrabTabId: 0,
  lastGrabUrl: '',
  activeRuleId: '',
  previewBlocks: [],
  obsidianToastTimer: 0,
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
  if (!btn) return;
  btn.innerHTML = `${renderIcon(icon)}<span class="btn-text">${label}</span>`;
}

function setIconOnlyBtn(btn, icon, label = '') {
  if (!btn) return;
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
  state.previewBlocks = [];
  footer?.classList.remove('has-results');
  if (kind === 'error') setStatusChip('状态：失败', 'error');
  else if (kind === 'warn') setStatusChip('状态：提醒', 'warn');
  else setStatusChip('状态：就绪');
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

function setRuleEditorStatus(message, tone = '') {
  if (!ruleEditorStatus) return;
  ruleEditorStatus.textContent = message || '';
  ruleEditorStatus.style.color =
    tone === 'error' ? '#b91c1c' : tone === 'ok' ? '#15803d' : tone === 'warn' ? '#b45309' : '#64748b';
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

function refreshRuleEditorView() {
  if (!state.activeRuleId && state.rules[0]) state.activeRuleId = state.rules[0].id;
  renderRuleEditorOptions();
  fillRuleEditor(getRuleById(state.activeRuleId));
}

async function persistRules(reasonText = '规则已保存') {
  await chrome.storage.local.set({ [STORAGE_KEYS.siteRules]: state.rules });
  renderSiteBadges();
  refreshRuleEditorView();
  await highlightCurrentSiteBadge();
  setRuleEditorStatus(reasonText, 'ok');
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
  const renderedBlocks = [];
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
      img.addEventListener('error', () => {
        if (img.dataset.fallbackTried === '1') return;
        img.dataset.fallbackTried = '1';
        fetchImageBlob(src)
          .then(blob => blobToDataUrl(blob))
          .then(dataUrl => {
            if (!dataUrl) return;
            img.src = dataUrl;
          })
          .catch(err => {
            console.warn('Preview image fallback failed:', err);
          });
      });
      const copyImageBtn = document.createElement('button');
      copyImageBtn.type = 'button';
      copyImageBtn.className = 'copy-image-btn';
      copyImageBtn.textContent = '复制图片';
      copyImageBtn.dataset.copyImageBtn = '1';
      const copyLinkBtn = document.createElement('button');
      copyLinkBtn.type = 'button';
      copyLinkBtn.className = 'copy-link-btn';
      copyLinkBtn.textContent = '复制链接';
      copyLinkBtn.dataset.copyLinkBtn = '1';
      copyLinkBtn.dataset.copyLinkValue = src;

      card.appendChild(img);
      card.appendChild(copyLinkBtn);
      card.appendChild(copyImageBtn);
      frag.appendChild(card);
      renderedBlocks.push({ type: 'img', src });
      return;
    }
    if (block.type === 'video') {
      const src = normalizeHttpUrl(block.src || '');
      if (!src) return;
      const card = document.createElement('div');
      card.className = 'preview-image-card';
      const p = document.createElement('p');
      p.textContent = '视频链接：';
      const link = document.createElement('a');
      link.href = src;
      link.target = '_blank';
      link.rel = 'noopener noreferrer nofollow';
      link.textContent = src;
      p.appendChild(link);
      const copyLinkBtn = document.createElement('button');
      copyLinkBtn.type = 'button';
      copyLinkBtn.className = 'copy-link-btn';
      copyLinkBtn.textContent = '复制链接';
      copyLinkBtn.dataset.copyLinkBtn = '1';
      copyLinkBtn.dataset.copyLinkValue = src;
      card.appendChild(p);
      card.appendChild(copyLinkBtn);
      frag.appendChild(card);
      renderedBlocks.push({ type: 'video', src });
      return;
    }

    if (block.type === 'code') {
      const codeText = typeof block.content === 'string' ? block.content.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '') : '';
      if (!codeText.trim()) return;
      const language = normalizeCodeLanguage(block.language);
      const card = document.createElement('div');
      card.className = 'preview-code-card';
      card.dataset.blockType = 'code';
      card.dataset.codeLanguage = language;
      const langBadge = document.createElement('span');
      langBadge.className = 'preview-code-lang';
      langBadge.textContent = language;
      const pre = document.createElement('pre');
      pre.className = 'preview-code';
      pre.dataset.blockType = 'code';
      pre.dataset.codeLanguage = language;
      const code = document.createElement('code');
      code.textContent = codeText;
      pre.appendChild(code);
      card.appendChild(langBadge);
      card.appendChild(pre);
      frag.appendChild(card);
      renderedBlocks.push({ type: 'code', content: codeText, language });
      return;
    }

    const text = typeof block.content === 'string' ? block.content.trim() : '';
    if (!text) return;

    let tagName = '';
    if (block.type === 'h1') tagName = 'h1';
    else if (block.type === 'h2') tagName = 'h2';
    else if (block.type === 'h3') tagName = 'h3';
    else if (block.type === 'quote') tagName = 'blockquote';
    else if (block.type === 'p') tagName = 'p';
    else if (block.type === 'li') tagName = 'p';
    if (!tagName) return;

    const el = document.createElement(tagName);
    if (block.type === 'li') {
      el.classList.add('preview-list-item');
      const marker = typeof block.marker === 'string' && block.marker.trim() ? block.marker.trim() : block.listType === 'numbered' ? '1.' : '•';
      el.appendChild(document.createTextNode(`${marker} `));
    }
    const segments = normalizeInlineSegments(text, block.segments);
    if (segments.length) {
      segments.forEach(segment => {
        if (segment.type === 'link') {
          const anchor = document.createElement('a');
          anchor.href = segment.href;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer nofollow';
          anchor.textContent = segment.text;
          el.appendChild(anchor);
        } else {
          el.appendChild(document.createTextNode(segment.text));
        }
      });
    } else {
      el.textContent = text;
    }
    frag.appendChild(el);
    renderedBlocks.push({
      type: block.type,
      content: text,
      ...(block.type === 'li'
        ? {
            listType: block.listType === 'numbered' ? 'numbered' : 'bulleted',
            marker: typeof block.marker === 'string' ? block.marker : '',
          }
        : {}),
      ...(segments.length ? { segments } : {}),
    });
  });

  preview.replaceChildren(frag);
  state.previewBlocks = renderedBlocks;
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
  state.notionParentPageId =
    typeof stored[STORAGE_KEYS.notionParentPageId] === 'string' ? stored[STORAGE_KEYS.notionParentPageId].trim() : '';
  state.notionWriteTargetType = stored[STORAGE_KEYS.notionWriteTargetType] === 'database' ? 'database' : 'page';
  state.notionLastPageId =
    typeof stored[STORAGE_KEYS.notionLastPageId] === 'string' ? stored[STORAGE_KEYS.notionLastPageId].trim() : '';
  state.notionLastDataSourceId =
    typeof stored[STORAGE_KEYS.notionLastDataSourceId] === 'string'
      ? stored[STORAGE_KEYS.notionLastDataSourceId].trim()
      : '';
  state.notionLastPageTitle =
    typeof stored[STORAGE_KEYS.notionLastPageTitle] === 'string' ? stored[STORAGE_KEYS.notionLastPageTitle].trim() : '';
  state.notionLastDataSourceTitle =
    typeof stored[STORAGE_KEYS.notionLastDataSourceTitle] === 'string'
      ? stored[STORAGE_KEYS.notionLastDataSourceTitle].trim()
      : '';
  if (state.notionParentPageId) {
    if (state.notionWriteTargetType === 'database' && !state.notionLastDataSourceId) {
      state.notionLastDataSourceId = state.notionParentPageId;
    }
    if (state.notionWriteTargetType === 'page' && !state.notionLastPageId) {
      state.notionLastPageId = state.notionParentPageId;
    }
  }
  if (debugModeCheckbox) debugModeCheckbox.checked = state.debugMode;
  if (notionTokenInput) notionTokenInput.value = state.notionToken;
  if (notionParentPageInput) notionParentPageInput.value = state.notionParentPageId;
  if (notionTargetTypeSelect) notionTargetTypeSelect.value = state.notionWriteTargetType;
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
  applyNotionTargetCandidates(state.notionTargetCandidates);
  setNotionConfigStatus('');
  state.activeRuleId = state.rules[0]?.id || '';
  renderSiteBadges();
  refreshRuleEditorView();
  setStatusChip('状态：就绪');
  setCountChip(preview.children.length || 0);
  await highlightCurrentSiteBadge();
}

async function saveNotionConfig() {
  const notionToken = notionTokenInput?.value?.trim() || '';
  const notionParentPageId = notionParentPageInput?.value?.trim() || '';
  const notionWriteTargetType = notionTargetTypeSelect?.value === 'database' ? 'database' : 'page';
  const notionLastPageId = notionWriteTargetType === 'page' ? notionParentPageId : state.notionLastPageId;
  const notionLastDataSourceId = notionWriteTargetType === 'database' ? notionParentPageId : state.notionLastDataSourceId;
  const notionLastPageTitle = state.notionLastPageTitle;
  const notionLastDataSourceTitle = state.notionLastDataSourceTitle;
  state.notionToken = notionToken;
  state.notionParentPageId = notionParentPageId;
  state.notionWriteTargetType = notionWriteTargetType;
  state.notionLastPageId = notionLastPageId;
  state.notionLastDataSourceId = notionLastDataSourceId;
  state.notionLastPageTitle = notionLastPageTitle;
  state.notionLastDataSourceTitle = notionLastDataSourceTitle;
  await chrome.storage.local.set({
    [STORAGE_KEYS.notionToken]: notionToken,
    [STORAGE_KEYS.notionParentPageId]: notionParentPageId,
    [STORAGE_KEYS.notionWriteTargetType]: notionWriteTargetType,
    [STORAGE_KEYS.notionLastPageId]: notionLastPageId,
    [STORAGE_KEYS.notionLastDataSourceId]: notionLastDataSourceId,
    [STORAGE_KEYS.notionLastPageTitle]: notionLastPageTitle,
    [STORAGE_KEYS.notionLastDataSourceTitle]: notionLastDataSourceTitle,
    [STORAGE_KEYS.notionTargetCandidatesCache]: state.notionTargetCandidates,
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
  if (typeof database?.plain_text === 'string' && database.plain_text.trim()) {
    return database.plain_text.trim();
  }
  if (typeof database?.title === 'string' && database.title.trim()) {
    return database.title.trim();
  }
  if (typeof database?.name === 'string' && database.name.trim()) {
    return database.name.trim();
  }
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
    const title = target.title || 'Untitled';
    option.textContent = title;
    option.title = target.url || target.id;
    if (selectedValue && option.value === selectedValue) option.selected = true;
    frag.appendChild(option);
  });

  notionPageSelect.replaceChildren(frag);
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

function sanitizePathSegment(raw, fallback = 'Untitled') {
  const text = typeof raw === 'string' ? raw.trim() : '';
  const cleaned = text.replace(/[\\/:*?"<>|#[\]^]/g, ' ').replace(/\s+/g, ' ').replace(/^\.+|\.+$/g, '').trim();
  return cleaned || fallback;
}

function getObsidianTitleFromBlocks(blocks, fallbackTitle = '') {
  const heading = Array.isArray(blocks)
    ? blocks.find(block => block?.type === 'h1' && typeof block.content === 'string' && block.content.trim())
    : null;
  const title = heading?.content?.trim() || fallbackTitle || '未命名文章';
  return sanitizePathSegment(title, '未命名文章');
}

function buildObsidianNotePath(noteTitle) {
  const safeTitle = sanitizePathSegment(noteTitle, '未命名文章');
  const safeFolder = String(state.obsidianFolder || '')
    .split(/[\\/]+/)
    .map(segment => sanitizePathSegment(segment, ''))
    .filter(Boolean)
    .join('/');
  const basePath = safeFolder ? `${safeFolder}/${safeTitle}` : safeTitle;
  return basePath.endsWith('.md') ? basePath : `${basePath}.md`;
}

function buildObsidianUri(noteTitle, markdown) {
  const params = [['content', markdown], ['overwrite', 'true']];
  if (String(state.obsidianFolder || '').trim()) {
    params.unshift(['file', buildObsidianNotePath(noteTitle)]);
  } else {
    params.unshift(['name', sanitizePathSegment(noteTitle, '未命名文章')]);
  }
  if (state.obsidianVault) params.push(['vault', state.obsidianVault]);
  const query = params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  return `obsidian://new?${query}`;
}

async function openExternalUri(uri) {
  if (typeof uri !== 'string' || !uri) return false;
  if (chrome?.tabs?.create) {
    try {
      await chrome.tabs.create({ url: uri, active: true });
      return true;
    } catch (err) {
      console.warn('chrome.tabs.create failed for external uri:', err);
    }
  }
  try {
    const opened = window.open(uri, '_blank', 'noopener,noreferrer');
    if (opened) return true;
  } catch (err) {
    console.warn('window.open failed for external uri:', err);
  }
  try {
    window.location.href = uri;
    return true;
  } catch (err) {
    console.warn('location.href failed for external uri:', err);
  }
  return false;
}

function buildShortObsidianImportMarkdown() {
  return '完整正文已复制到剪贴板。\n\n请在当前笔记中全选后粘贴覆盖。';
}

function createObsidianError(code, message, extra = {}) {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
}

function hideObsidianToast() {
  if (state.obsidianToastTimer) {
    clearTimeout(state.obsidianToastTimer);
    state.obsidianToastTimer = 0;
  }
  if (!obsidianToast) return;
  obsidianToast.classList.remove('show', 'warn', 'error');
}

function showObsidianToast({ tone = '', title = '', detail = '', actionLabel = '', actionHandler = null, duration = 8000 } = {}) {
  if (!obsidianToast || !obsidianToastTitle || !obsidianToastDetail || !obsidianToastAction) return;
  hideObsidianToast();
  obsidianToastTitle.textContent = title || 'Obsidian 提示';
  obsidianToastDetail.textContent = detail || '';
  obsidianToast.classList.remove('warn', 'error');
  if (tone) obsidianToast.classList.add(tone);
  if (actionLabel && typeof actionHandler === 'function') {
    obsidianToastAction.hidden = false;
    obsidianToastAction.textContent = actionLabel;
    obsidianToastAction.onclick = () => {
      actionHandler();
      hideObsidianToast();
    };
  } else {
    obsidianToastAction.hidden = true;
    obsidianToastAction.textContent = '';
    obsidianToastAction.onclick = null;
  }
  obsidianToast.classList.add('show');
  if (duration > 0) {
    state.obsidianToastTimer = window.setTimeout(() => {
      hideObsidianToast();
    }, duration);
  }
}

function buildObsidianFeedbackTitle(reason, action, details = []) {
  return [reason, action ? `下一步：${action}` : '', ...details.filter(Boolean)].filter(Boolean).join('\n');
}

function getObsidianErrorFeedback(err, options = {}) {
  const code = typeof err?.code === 'string' ? err.code : '';
  const reason = typeof err?.message === 'string' && err.message.trim() ? err.message.trim() : '未知错误';
  const notePath = typeof err?.notePath === 'string' && err.notePath ? `笔记目标：${err.notePath}` : '';
  const attachmentPath = typeof err?.attachmentPath === 'string' && err.attachmentPath ? `附件目录：${err.attachmentPath}` : '';
  const fallbackMode = options.fallbackMode === 'uri-fallback-paste' ? 'paste' : options.fallbackMode === 'uri-direct' ? 'uri' : '';

  if (code === 'obsidian-vault-handle-missing') {
    return {
      buttonLabel: fallbackMode ? '已回退' : '待设置',
      statusText: fallbackMode ? '状态：已回退 URI，请先绑定库目录' : '状态：请先绑定库目录',
      tone: 'warn',
      title: buildObsidianFeedbackTitle(reason, '打开设置页 > Obsidian > 选择本地库目录，并保存配置。'),
      actionLabel: '打开设置',
      actionKind: 'open-settings',
    };
  }

  if (code === 'obsidian-vault-required') {
    return {
      buttonLabel: '待设置',
      statusText: '状态：请先填写 Vault',
      tone: 'warn',
      title: buildObsidianFeedbackTitle(reason, '打开设置页 > Obsidian，填写 Vault（必填）并保存。'),
      actionLabel: '打开设置',
      actionKind: 'open-settings',
    };
  }

  if (code === 'obsidian-vault-permission-denied') {
    return {
      buttonLabel: fallbackMode ? '已回退' : '待授权',
      statusText: fallbackMode ? '状态：已回退 URI，请重新授权目录' : '状态：请重新授权目录',
      tone: 'warn',
      title: buildObsidianFeedbackTitle(reason, '打开设置页 > Obsidian > 重新选择本地库目录授权。'),
      actionLabel: '打开设置',
      actionKind: 'open-settings',
    };
  }

  if (code === 'obsidian-uri-clipboard-unavailable') {
    return {
      buttonLabel: '发送失败',
      statusText: '状态：长文降级失败，无法写剪贴板',
      tone: 'error',
      title: buildObsidianFeedbackTitle(reason, '改用较短内容重试，或在支持剪贴板写入的环境中发送。'),
    };
  }

  if (code === 'obsidian-uri-open-failed') {
    return {
      buttonLabel: '发送失败',
      statusText: '状态：无法唤起 Obsidian',
      tone: 'error',
      title: buildObsidianFeedbackTitle(reason, '确认已安装 Obsidian，并允许浏览器打开 obsidian:// 链接。'),
      actionLabel: '打开设置',
      actionKind: 'open-settings',
    };
  }

  if (code === 'obsidian-local-empty-content' || code === 'obsidian-empty-content') {
    return {
      buttonLabel: '无内容',
      statusText: '状态：无可发送内容',
      tone: 'warn',
      title: buildObsidianFeedbackTitle(reason, '先执行抓取，确认预览区已有正文或图片内容。'),
    };
  }

  if (code === 'obsidian-local-note-write-failed') {
    return {
      buttonLabel: fallbackMode ? '已回退' : '发送失败',
      statusText: fallbackMode ? '状态：本地写入失败，已回退 URI' : '状态：本地写入失败',
      tone: fallbackMode ? 'warn' : 'error',
      title: buildObsidianFeedbackTitle(reason, '检查库目录是否仍可写、标题路径是否可创建，然后重试。', [notePath, attachmentPath]),
      actionLabel: '打开设置',
      actionKind: 'open-settings',
    };
  }

  return {
    buttonLabel: fallbackMode ? '已回退' : '发送失败',
    statusText: fallbackMode ? '状态：本地写入失败，已回退 URI' : '状态：Obsidian 发送失败',
    tone: fallbackMode ? 'warn' : 'error',
    title: buildObsidianFeedbackTitle(reason, fallbackMode ? '先在 Obsidian 中确认回退笔记已创建，再处理本地写入问题。' : '检查 Obsidian 配置和浏览器权限后重试。', [notePath, attachmentPath]),
  };
}

async function sendToObsidianByUri({ blocks, noteTitle, sourceUrl }) {
  const markdown = buildObsidianMarkdown(blocks, sourceUrl, noteTitle);
  if (!markdown) {
    throw createObsidianError('obsidian-empty-content', '当前没有可发送内容');
  }
  const uri = buildObsidianUri(noteTitle, markdown);
  if (uri.length > OBSIDIAN_URI_SOFT_LIMIT) {
    if (!navigator.clipboard?.writeText) {
      throw createObsidianError('obsidian-uri-clipboard-unavailable', '当前环境不支持写入剪贴板，无法执行长文降级流程');
    }
    await navigator.clipboard.writeText(markdown);
    const placeholderUri = buildObsidianUri(noteTitle, buildShortObsidianImportMarkdown());
    const dispatched = await openExternalUri(placeholderUri);
    if (!dispatched) throw createObsidianError('obsidian-uri-open-failed', '无法唤起 obsidian:// 链接');
    return { mode: 'uri-fallback-paste' };
  }
  const dispatched = await openExternalUri(uri);
  if (!dispatched) {
    throw createObsidianError('obsidian-uri-open-failed', '无法唤起 obsidian:// 链接');
  }
  return { mode: 'uri-direct' };
}

async function refreshObsidianSettingsFromStorage() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.obsidianVault,
    STORAGE_KEYS.obsidianFolder,
    STORAGE_KEYS.obsidianWriteMode,
    STORAGE_KEYS.obsidianAttachmentFolder,
  ]);
  state.obsidianVault = typeof stored[STORAGE_KEYS.obsidianVault] === 'string' ? stored[STORAGE_KEYS.obsidianVault].trim() : '';
  state.obsidianFolder = typeof stored[STORAGE_KEYS.obsidianFolder] === 'string' ? stored[STORAGE_KEYS.obsidianFolder].trim() : '';
  state.obsidianWriteMode = stored[STORAGE_KEYS.obsidianWriteMode] === 'local' ? 'local' : 'uri';
  state.obsidianAttachmentFolder =
    typeof stored[STORAGE_KEYS.obsidianAttachmentFolder] === 'string' && stored[STORAGE_KEYS.obsidianAttachmentFolder].trim()
      ? stored[STORAGE_KEYS.obsidianAttachmentFolder].trim()
      : 'images';
}

function ensureObsidianVaultConfigured() {
  if (!state.obsidianVault) {
    throw createObsidianError('obsidian-vault-required', 'Vault 尚未同步，请先到设置页选择本地库目录。');
  }
}

async function openObsidianWrittenNote(notePath) {
  const safePath = String(notePath || '').trim();
  if (!safePath) return false;
  const params = [['vault', state.obsidianVault], ['file', safePath]];
  const query = params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  return openExternalUri(`obsidian://open?${query}`);
}

async function ensureVaultWritePermissionForLocalMode() {
  const vaultRootHandle = await getVaultRootHandle();
  if (!vaultRootHandle) {
    throw createObsidianError('obsidian-vault-handle-missing', '未绑定本地库目录，请先到设置页点击“选择本地库目录”。');
  }
  const permission = await queryHandlePermission(vaultRootHandle, 'readwrite');
  if (permission !== 'granted') {
    throw createObsidianError('obsidian-vault-permission-denied', '本地库目录未授权写入。请到设置页重新选择目录并授权。');
  }
  return vaultRootHandle;
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

function collectPreviewBlocks() {
  if (Array.isArray(state.previewBlocks) && state.previewBlocks.length) {
    return state.previewBlocks.map(block => ({
      ...block,
      ...(Array.isArray(block.segments) ? { segments: block.segments.map(item => ({ ...item })) } : {}),
    }));
  }
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
    if (tag === 'BLOCKQUOTE' && text) {
      blocks.push({ type: 'quote', content: text });
      continue;
    }
    if (tag === 'P' && text) {
      blocks.push({ type: 'p', content: text });
      continue;
    }
    const codeNode = (() => {
      if (!(node instanceof Element)) return null;
      if (tag === 'PRE' && node.classList.contains('preview-code')) return node;
      if (node.classList.contains('preview-code-card')) return node.querySelector('pre.preview-code');
      return null;
    })();
    if (codeNode instanceof Element) {
      const codeText = codeNode.querySelector('code')?.textContent || codeNode.textContent || '';
      const normalizedCode = codeText.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
      if (!normalizedCode.trim()) continue;
      const language = normalizeCodeLanguage(codeNode.dataset.codeLanguage || node.dataset?.codeLanguage || '');
      blocks.push({ type: 'code', content: normalizedCode, language });
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
      const src = normalizePreviewUrl(imageNode.getAttribute('src') || imageNode.src || imageNode.currentSrc || '');
      if (!src) continue;
      blocks.push({ type: 'img', src });
      continue;
    }
    if (node instanceof Element && node.classList.contains('preview-image-card')) {
      const linkValue = node.querySelector('[data-copy-link-value]')?.getAttribute('data-copy-link-value') || '';
      const videoSrc = normalizeHttpUrl(linkValue);
      if (videoSrc) {
        blocks.push({ type: 'video', src: videoSrc });
      }
    }
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
    uniq.push({ ...page, type: 'page' });
  });

  cursor = '';
  for (let i = 0; i < 3; i += 1) {
    const payload = await notionRequest('/search', {
      method: 'POST',
      token,
      json: {
        query: '',
        filter: {
          property: 'object',
          value: 'data_source',
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
    for (const database of results) {
      const id = toNotionUuid(database?.id);
      if (!id) continue;
      const title = notionDatabaseTitleFromObject(database) || `Untitled DB (${id.slice(0, 8)})`;
      databases.push({
        id,
        title,
        url: typeof database?.url === 'string' ? database.url : '',
      });
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

async function getNotionDatabaseTitlePropertyName(token, databaseId) {
  const paths = [`/databases/${databaseId}`, `/data_sources/${databaseId}`];
  for (const path of paths) {
    try {
      const payload = await notionRequest(path, {
        method: 'GET',
        token,
      });
      const properties = payload?.properties && typeof payload.properties === 'object' ? payload.properties : {};
      for (const [key, value] of Object.entries(properties)) {
        if (value?.type === 'title') return key;
      }
    } catch {
      // try next endpoint
    }
  }
  return '';
}

async function createNotionWriteTargetPage({ token, targetType, targetId, pageTitle }) {
  if (targetType === 'database') {
    const titlePropertyName = await getNotionDatabaseTitlePropertyName(token, targetId);
    if (!titlePropertyName) {
      throw new Error('数据库缺少可写标题字段（title）');
    }
    const parentModes = [
      { type: 'database_id', database_id: targetId },
      { type: 'data_source_id', data_source_id: targetId },
    ];
    let lastError = null;
    for (const parent of parentModes) {
      try {
        return await notionRequest('/pages', {
          method: 'POST',
          token,
          json: {
            parent,
            properties: {
              [titlePropertyName]: {
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
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    throw new Error('写入数据库失败');
  }

  try {
    return await notionRequest('/pages', {
      method: 'POST',
      token,
      json: {
        parent: {
          type: 'page_id',
          page_id: targetId,
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
    const appended = await notionRequest(`/blocks/${targetId}/children`, {
      method: 'PATCH',
      token,
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
    return appended?.results?.[0] || null;
  }
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
  const rawSrc = typeof src === 'string' ? src.trim() : '';
  if (!rawSrc) throw new Error('Empty image source');

  if (rawSrc.startsWith('data:') || rawSrc.startsWith('blob:')) {
    const response = await fetch(rawSrc, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
    const blob = await response.blob();
    if (!blob || !blob.size) throw new Error('Empty image blob');
    return blob;
  }

  const httpSrc = normalizeHttpUrl(rawSrc);
  if (!httpSrc) throw new Error('Invalid image URL');

  const tabId = Number.isInteger(state.lastGrabTabId) && state.lastGrabTabId > 0 ? state.lastGrabTabId : 0;
  const referrerUrl = normalizeHttpUrl(state.lastGrabUrl || '');

  try {
    const init = { credentials: 'omit', cache: 'force-cache', mode: 'cors' };
    if (referrerUrl) {
      init.referrer = referrerUrl;
      init.referrerPolicy = 'strict-origin-when-cross-origin';
    }
    const response = await fetch(httpSrc, init);
    if (!response.ok) {
      throw new Error(`Image fetch failed: ${response.status}`);
    }
    const blob = await response.blob();
    if (!blob || !blob.size) {
      throw new Error('Empty image blob');
    }
    return blob;
  } catch (directErr) {
    if (!tabId) throw directErr;
    try {
      const injected = await chrome.scripting.executeScript({
        target: { tabId },
        func: async imageUrl => {
          try {
            const response = await fetch(imageUrl, { credentials: 'omit', cache: 'force-cache', mode: 'cors' });
            if (!response.ok) return { ok: false, error: `Image fetch failed: ${response.status}` };
            const blob = await response.blob();
            if (!blob || !blob.size) return { ok: false, error: 'Empty image blob' };
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.onerror = () => reject(new Error('Failed to read blob in page context'));
              reader.readAsDataURL(blob);
            });
            if (!dataUrl) return { ok: false, error: 'Failed to encode image in page context' };
            return { ok: true, dataUrl };
          } catch (err) {
            const message = typeof err?.message === 'string' ? err.message : String(err);
            return { ok: false, error: message || 'Unknown page-context image error' };
          }
        },
        args: [httpSrc],
      });
      const result = injected?.[0]?.result;
      if (!result?.ok || !result?.dataUrl) {
        throw new Error(result?.error || 'Image fetch failed in page context');
      }
      const dataResponse = await fetch(result.dataUrl);
      if (!dataResponse.ok) throw new Error(`Data URL decode failed: ${dataResponse.status}`);
      const blob = await dataResponse.blob();
      if (!blob || !blob.size) throw new Error('Empty image blob from page context');
      return blob;
    } catch (fallbackErr) {
      throw new Error(`Image fetch failed: ${fallbackErr?.message || directErr?.message || 'unknown error'}`);
    }
  }
}

async function localizePreviewImagesForWechat() {
  const host = state.activeHost || '';
  const shouldLocalize = host === 'mp.weixin.qq.com' || host === 'sspai.com';
  if (!shouldLocalize) return { total: 0, localized: 0 };
  const images = Array.from(preview.querySelectorAll('img'));
  if (!images.length) return { total: 0, localized: 0 };

  const outputs = await mapWithConcurrency(images, 4, async image => {
    const rawSrc = image.dataset.remoteSrc || image.getAttribute('src') || image.src || '';
    const normalizedPreview = normalizePreviewUrl(rawSrc);
    if (!normalizedPreview) return 0;
    if (normalizedPreview.startsWith('data:') || normalizedPreview.startsWith('blob:')) return 0;
    const src = normalizeHttpUrl(normalizedPreview);
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
  const blob = await fetchImageBlob(src);

  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Rich clipboard not supported');
  }
  const mimeType = typeof blob.type === 'string' && blob.type.startsWith('image/') ? blob.type : 'image/png';
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [mimeType]: blob,
      }),
    ]);
    return { mode: 'binary', mimeType };
  } catch (err) {
    if (mimeType === 'image/gif' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(src);
      return { mode: 'url', mimeType };
    }
    throw err;
  }
}

function inlineSegmentsToMarkdown(content, segments) {
  const normalized = normalizeInlineSegments(content, segments);
  if (!normalized.length) return String(content || '');
  return normalized
    .map(item => (item.type === 'link' ? `[${item.text}](${item.href})` : item.text))
    .join('');
}

function inlineSegmentsToHtml(content, segments) {
  const normalized = normalizeInlineSegments(content, segments);
  if (!normalized.length) return escapeHtml(String(content || ''));
  return normalized
    .map(item =>
      item.type === 'link'
        ? `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(item.text)}</a>`
        : escapeHtml(item.text)
    )
    .join('');
}

async function buildNotionExportZipBlob() {
  const files = [];
  const markdownLines = [];
  let imageIndex = 0;

  const blocks = collectPreviewBlocks();
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if ((block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'p' || block.type === 'quote') && block.content) {
      const text = inlineSegmentsToMarkdown(block.content, block.segments);
      if (!text.trim()) continue;
      if (block.type === 'h1') markdownLines.push(`# ${text}`);
      else if (block.type === 'h2') markdownLines.push(`## ${text}`);
      else if (block.type === 'h3') markdownLines.push(`### ${text}`);
      else if (block.type === 'quote') markdownLines.push(`> ${text}`);
      else markdownLines.push(text);
      continue;
    }
    if (block.type === 'li' && block.content) {
      const text = inlineSegmentsToMarkdown(block.content, block.segments);
      if (!text.trim()) continue;
      const marker = block.listType === 'numbered' ? '1.' : '-';
      markdownLines.push(`${marker} ${text}`);
      continue;
    }
    if (block.type === 'code') {
      const normalizedCode = String(block.content || '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
      if (!normalizedCode.trim()) continue;
      const language = normalizeCodeLanguage(block.language);
      markdownLines.push(`\`\`\`${language === 'plain text' ? '' : language}\n${normalizedCode}\n\`\`\``);
      continue;
    }
    if (block.type === 'video') {
      const src = normalizeHttpUrl(block.src || '');
      if (!src) continue;
      markdownLines.push(`[视频](${src})`);
      continue;
    }
    if (block.type !== 'img') continue;
    const src = normalizePreviewUrl(block.src || '');
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
  const targetRaw = state.notionParentPageId || notionParentPageInput?.value?.trim() || '';
  const targetId = toNotionUuid(targetRaw);
  const targetType = getCurrentNotionTargetType();
  if (!notionToken) {
    throw new Error('请先填写并保存 Notion Integration Token');
  }
  if (!targetId) {
    throw new Error(targetType === 'database' ? 'Database ID / URL 无效' : 'Parent Page ID / URL 无效');
  }

  const blocks = collectPreviewBlocks();
  if (!blocks.length) {
    throw new Error('当前没有可发送内容');
  }

  const tab = await getActiveTab();
  const titleFromBlocks = blocks.find(item => item.type === 'h1')?.content || '';
  const pageTitle = sanitizeFilename(titleFromBlocks || tab?.title || '剪藏文章', '剪藏文章').slice(0, 90);
  const blocksForChildren = (() => {
    const firstIndex = blocks.findIndex(item => item?.type === 'h1' && item?.content?.trim());
    if (firstIndex < 0) return blocks;
    const firstTitle = blocks[firstIndex].content.trim();
    if (!firstTitle || firstTitle !== titleFromBlocks.trim()) return blocks;
    return blocks.filter((_, idx) => idx !== firstIndex);
  })();

  const created = await createNotionWriteTargetPage({
    token: notionToken,
    targetType,
    targetId,
    pageTitle,
  });

  const pageId = created?.id;
  if (!pageId) {
    throw new Error('创建 Notion 页面失败：未返回页面 ID');
  }

  const totalImages = blocksForChildren.filter(item => item.type === 'img').length;
  let finishedImages = 0;
  let imageCount = 0;
  const mappedChildren = await mapWithConcurrency(blocksForChildren, 3, async (block, index) => {
    if (block.type !== 'img') {
      if (block.type === 'video') {
        const src = normalizeHttpUrl(block.src || '');
        if (src) {
          return [
            {
              object: 'block',
              type: 'embed',
              embed: { url: src },
            },
          ];
        }
        return textBlockToNotion('p', '[视频]');
      }
      if (block.type === 'code') {
        return codeBlockToNotion(block.content, block.language);
      }
      if (block.type === 'li') {
        return listBlockToNotion(block.content, block.segments, block.listType);
      }
      return textBlockToNotion(block.type, block.content, block.segments);
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
      const fallbackUrl = normalizeHttpUrl(block.src || '');
      if (fallbackUrl) {
        return [
          {
            object: 'block',
            type: 'image',
            image: {
              type: 'external',
              external: {
                url: fallbackUrl,
              },
            },
          },
        ];
      }
      return textBlockToNotion('p', `[图片上传失败] ${block.src}`);
    }
  });
  const notionChildren = mappedChildren.flat();

  if (!notionChildren.length) {
    return {
      pageId,
      pageUrl: created?.url || '',
      imageCount: 0,
      blockCount: 0,
    };
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

function buildObsidianMarkdown(blocks, sourceUrl = '', noteTitle = '') {
  const markdownLines = [];
  if (sourceUrl) {
    markdownLines.push('---');
    markdownLines.push(`source: ${JSON.stringify(sourceUrl || '')}`);
    markdownLines.push('---');
    markdownLines.push('');
  }
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if ((block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'p' || block.type === 'quote') && block.content) {
      const text = inlineSegmentsToMarkdown(block.content, block.segments);
      if (!text.trim()) continue;
      if (block.type === 'h1') {
        const normalizedTextTitle = sanitizePathSegment(text, '');
        const normalizedNoteTitle = sanitizePathSegment(noteTitle, '');
        if (normalizedNoteTitle && normalizedTextTitle === normalizedNoteTitle) {
          continue;
        }
        markdownLines.push(`# ${text}`);
      }
      else if (block.type === 'h2') markdownLines.push(`## ${text}`);
      else if (block.type === 'h3') markdownLines.push(`### ${text}`);
      else if (block.type === 'quote') markdownLines.push(`> ${text}`);
      else markdownLines.push(text);
      markdownLines.push('');
      continue;
    }
    if (block.type === 'li' && block.content) {
      const text = inlineSegmentsToMarkdown(block.content, block.segments);
      if (!text.trim()) continue;
      const marker = block.listType === 'numbered' ? '1.' : '-';
      markdownLines.push(`${marker} ${text}`);
      markdownLines.push('');
      continue;
    }
    if (block.type === 'code') {
      const normalizedCode = String(block.content || '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
      if (!normalizedCode.trim()) continue;
      const language = normalizeCodeLanguage(block.language);
      markdownLines.push(`\`\`\`${language === 'plain text' ? '' : language}`);
      markdownLines.push(normalizedCode);
      markdownLines.push('```');
      markdownLines.push('');
      continue;
    }
    if (block.type === 'video') {
      const src = normalizeHttpUrl(block.src || '');
      if (!src) continue;
      markdownLines.push(`[视频](${src})`);
      markdownLines.push('');
      continue;
    }
    if (block.type === 'img') {
      const src = normalizePreviewUrl(block.src || '');
      if (!src) continue;
      markdownLines.push(`![](${src})`);
      markdownLines.push('');
    }
  }
  return markdownLines.join('\n').trim();
}

function joinPathSegments(...parts) {
  return parts.flatMap(part => normalizePathSegments(part));
}

function getEffectiveAttachmentRoot(detectedRule, fallbackFolder, noteDirSegments) {
  const raw = String(detectedRule || '').trim();
  if (raw) {
    if (raw === '.') {
      return { pathSegments: [...noteDirSegments], source: 'obsidian', displayPath: '.' };
    }
    if (raw.startsWith('./')) {
      return {
        pathSegments: [...noteDirSegments, ...normalizePathSegments(raw.slice(2))],
        source: 'obsidian',
        displayPath: raw,
      };
    }
    if (raw === '/') {
      return { pathSegments: [], source: 'obsidian', displayPath: '/' };
    }
    const normalized = normalizePathSegments(raw);
    if (normalized.length) {
      return { pathSegments: normalized, source: 'obsidian', displayPath: normalized.join('/') };
    }
  }
  const fallback = normalizePathSegments(fallbackFolder || 'images');
  return {
    pathSegments: fallback.length ? fallback : ['images'],
    source: 'extension',
    displayPath: fallback.length ? fallback.join('/') : 'images',
  };
}

function toMarkdownLinkTarget(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  return `<${value}>`;
}

async function writeObsidianNoteLocal({ blocks, noteTitle, sourceUrl, vaultRootHandle }) {
  const detectedNewNoteFolder = !String(state.obsidianFolder || '').trim()
    ? await detectObsidianNewNoteFolder(vaultRootHandle)
    : '';
  const noteDirSegments = joinPathSegments(state.obsidianFolder || detectedNewNoteFolder);
  const detectedAttachmentFolder = await detectObsidianAttachmentFolder(vaultRootHandle);
  const attachmentRoot = getEffectiveAttachmentRoot(detectedAttachmentFolder, state.obsidianAttachmentFolder, noteDirSegments);
  const noteFileName = `${sanitizePathSegment(noteTitle, '未命名文章')}.md`;
  const requestedNotePathSegments = [...noteDirSegments, noteFileName];
  const notePathSegments = await resolveUniqueFilePath(vaultRootHandle, requestedNotePathSegments);
  const resolvedNoteFileName = notePathSegments[notePathSegments.length - 1] || noteFileName;
  const noteStem = resolvedNoteFileName.replace(/\.md$/i, '') || sanitizePathSegment(noteTitle, '未命名文章');
  const duplicated = resolvedNoteFileName !== noteFileName;
  const notePath = notePathSegments.join('/');
  const requestedNotePath = requestedNotePathSegments.join('/');
  const attachmentPath = attachmentRoot.displayPath;

  const markdownLines = [];
  if (sourceUrl) {
    markdownLines.push('---');
    markdownLines.push(`source: ${JSON.stringify(sourceUrl)}`);
    markdownLines.push('---');
    markdownLines.push('');
  }

  let imageIndex = 0;
  let failedImages = 0;
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if ((block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'p' || block.type === 'quote') && block.content) {
      const text = inlineSegmentsToMarkdown(block.content, block.segments);
      if (!text.trim()) continue;
      if (block.type === 'h1') {
        const normalizedTextTitle = sanitizePathSegment(text, '');
        const normalizedNoteTitle = sanitizePathSegment(noteTitle, '');
        if (normalizedNoteTitle && normalizedTextTitle === normalizedNoteTitle) continue;
        markdownLines.push(`# ${text}`);
      } else if (block.type === 'h2') markdownLines.push(`## ${text}`);
      else if (block.type === 'h3') markdownLines.push(`### ${text}`);
      else if (block.type === 'quote') markdownLines.push(`> ${text}`);
      else markdownLines.push(text);
      markdownLines.push('');
      continue;
    }
    if (block.type === 'li' && block.content) {
      const text = inlineSegmentsToMarkdown(block.content, block.segments);
      if (!text.trim()) continue;
      const marker = block.listType === 'numbered' ? '1.' : '-';
      markdownLines.push(`${marker} ${text}`);
      markdownLines.push('');
      continue;
    }
    if (block.type === 'code') {
      const normalizedCode = String(block.content || '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
      if (!normalizedCode.trim()) continue;
      const language = normalizeCodeLanguage(block.language);
      markdownLines.push(`\`\`\`${language === 'plain text' ? '' : language}`);
      markdownLines.push(normalizedCode);
      markdownLines.push('```');
      markdownLines.push('');
      continue;
    }
    if (block.type === 'video') {
      const src = normalizeHttpUrl(block.src || '');
      if (!src) continue;
      markdownLines.push(`[视频](${src})`);
      markdownLines.push('');
      continue;
    }
    if (block.type === 'img') {
      const src = normalizePreviewUrl(block.src || '');
      if (!src) continue;
      imageIndex += 1;
      try {
        const blob = await fetchImageBlob(src);
        const ext = getImageExt(blob, src);
        const imageFileName = `${noteStem}__${String(imageIndex).padStart(3, '0')}.${ext}`;
        const requestedImagePathSegments = [...attachmentRoot.pathSegments, imageFileName];
        const imagePathSegments = await resolveUniqueFilePath(vaultRootHandle, requestedImagePathSegments);
        await writeBlobFileByPath(vaultRootHandle, imagePathSegments, blob);
        const relative = buildRelativePath(noteDirSegments, imagePathSegments);
        markdownLines.push(`![](${toMarkdownLinkTarget(relative)})`);
      } catch (err) {
        failedImages += 1;
        const fallback = normalizeHttpUrl(src) || src;
        markdownLines.push(`![](${toMarkdownLinkTarget(fallback)})`);
      }
      markdownLines.push('');
    }
  }

  const markdown = markdownLines.join('\n').trim();
  if (!markdown) {
    throw createObsidianError('obsidian-local-empty-content', '当前没有可写入 Obsidian 的内容', {
      notePath,
      attachmentPath,
    });
  }
  try {
    await writeTextFileByPath(vaultRootHandle, notePathSegments, markdown);
  } catch (err) {
    throw createObsidianError('obsidian-local-note-write-failed', '写入本地笔记失败', {
      notePath,
      attachmentPath,
      cause: err,
    });
  }
  return {
    notePath,
    requestedNotePath,
    imageCount: imageIndex,
    failedImages,
    attachmentPath,
    attachmentSource: attachmentRoot.source,
    duplicated,
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
  const blocks = collectPreviewBlocks();
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if ((block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'p' || block.type === 'quote') && block.content) {
      const mdText = inlineSegmentsToMarkdown(block.content, block.segments);
      const htmlText = inlineSegmentsToHtml(block.content, block.segments);
      if (!mdText.trim()) continue;
      if (block.type === 'h1') {
        markdownLines.push(`# ${mdText}`);
        htmlLines.push(`<h1>${htmlText}</h1>`);
      } else if (block.type === 'h2') {
        markdownLines.push(`## ${mdText}`);
        htmlLines.push(`<h2>${htmlText}</h2>`);
      } else if (block.type === 'h3') {
        markdownLines.push(`### ${mdText}`);
        htmlLines.push(`<h3>${htmlText}</h3>`);
      } else if (block.type === 'quote') {
        markdownLines.push(`> ${mdText}`);
        htmlLines.push(`<blockquote>${htmlText}</blockquote>`);
      } else {
        markdownLines.push(mdText);
        htmlLines.push(`<p>${htmlText}</p>`);
      }
      continue;
    }
    if (block.type === 'li' && block.content) {
      const mdText = inlineSegmentsToMarkdown(block.content, block.segments);
      const htmlText = inlineSegmentsToHtml(block.content, block.segments);
      if (!mdText.trim()) continue;
      const marker = block.listType === 'numbered' ? '1.' : '-';
      markdownLines.push(`${marker} ${mdText}`);
      htmlLines.push(`<p>${escapeHtml(marker)} ${htmlText}</p>`);
      continue;
    }

    if (block.type === 'code') {
      const normalizedCode = String(block.content || '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
      if (!normalizedCode.trim()) continue;
      const language = normalizeCodeLanguage(block.language);
      markdownLines.push(`\`\`\`${language === 'plain text' ? '' : language}\n${normalizedCode}\n\`\`\``);
      htmlLines.push(`<pre data-language="${escapeHtml(language)}"><code>${escapeHtml(normalizedCode)}</code></pre>`);
      continue;
    }
    if (block.type === 'video') {
      const src = normalizeHttpUrl(block.src || '');
      if (!src) continue;
      markdownLines.push(`[视频](${src})`);
      htmlLines.push(`<p><a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer nofollow">视频链接</a></p>`);
      continue;
    }

    if (block.type !== 'img') continue;
    const src = normalizePreviewUrl(block.src || '');
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
  state.lastGrabTabId = tab.id;
  state.lastGrabUrl = tab.url || '';

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
    if (state.activeHost === 'mp.weixin.qq.com' || state.activeHost === 'sspai.com') {
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
  const copyLinkBtn = target.closest('[data-copy-link-btn]');
  if (copyLinkBtn instanceof HTMLButtonElement) {
    const value = copyLinkBtn.getAttribute('data-copy-link-value') || '';
    if (!value) return;
    const originalText = copyLinkBtn.textContent || '复制链接';
    copyLinkBtn.disabled = true;
    copyLinkBtn.textContent = '复制中...';
    try {
      await navigator.clipboard.writeText(value);
      copyLinkBtn.textContent = '已复制';
      setStatusChip('状态：链接已复制', 'ok');
    } catch (err) {
      console.error('Copy link failed:', err);
      copyLinkBtn.textContent = '复制失败';
      setStatusChip('状态：链接复制失败', 'error');
    } finally {
      setTimeout(() => {
        copyLinkBtn.disabled = false;
        copyLinkBtn.textContent = originalText;
      }, 1200);
    }
    return;
  }

  const btn = target.closest('[data-copy-image-btn]');
  if (!(btn instanceof HTMLButtonElement)) return;

  const image = btn.parentElement?.querySelector('img');
  if (!(image instanceof HTMLImageElement)) return;

  const originalText = btn.textContent || '复制图片';
  btn.disabled = true;
  btn.textContent = '复制中...';
  try {
    const copied = await copySinglePreviewImage(image);
    if (copied?.mode === 'url') {
      btn.textContent = '已复制链接';
      setStatusChip('状态：GIF已转为链接复制', 'warn');
    } else {
      btn.textContent = '已复制';
      setStatusChip('状态：单图已复制', 'ok');
    }
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

clipToObsidianBtn?.addEventListener('click', async () => {
  const original = clipToObsidianBtn.innerHTML;
  clipToObsidianBtn.disabled = true;
  setIconOnlyBtn(clipToObsidianBtn, 'send', '发送中...');
  hideObsidianToast();
  try {
    await refreshObsidianSettingsFromStorage();
    ensureObsidianVaultConfigured();
    const localVaultHandle = state.obsidianWriteMode === 'local' ? await ensureVaultWritePermissionForLocalMode() : null;
    const blocks = collectPreviewBlocks();
    if (!blocks.length) {
      setStatusChip('状态：无可发送内容', 'warn');
      setIconOnlyBtn(clipToObsidianBtn, 'circleX', '无内容');
      return;
    }
    const tab = await getActiveTab();
    const fallbackTitle = sanitizeFilename(tab?.title || '剪藏文章', '剪藏文章');
    const noteTitle = getObsidianTitleFromBlocks(blocks, fallbackTitle);
    const sourceUrl = normalizeHttpUrl(tab?.url || state.lastGrabUrl || '');
    if (state.obsidianWriteMode === 'local') {
      setStatusChip('状态：写入本地目录中', 'running');
      try {
        const result = await writeObsidianNoteLocal({
          blocks,
          noteTitle,
          sourceUrl,
          vaultRootHandle: localVaultHandle,
        });
        setIconOnlyBtn(clipToObsidianBtn, 'check', result.duplicated ? '已另存' : '已写入');
        if (result.duplicated) {
          setStatusChip('状态：同名已另存副本', 'warn');
        } else if (result.failedImages > 0) {
          setStatusChip(`状态：已写入（${result.failedImages} 图保留外链）`, 'warn');
        } else {
          setStatusChip(`状态：已写入 ${result.imageCount} 图`, 'ok');
        }
        if (statusChip) {
          const sourceLabel = result.attachmentSource === 'obsidian' ? 'Obsidian 规则' : '扩展配置';
          const duplicateHint = result.duplicated ? `同名冲突：${result.requestedNotePath} -> ${result.notePath}\n` : '';
          statusChip.title = `${duplicateHint}笔记：${result.notePath}\n附件目录：${result.attachmentPath}（${sourceLabel}）\n命名：${sanitizePathSegment(noteTitle, '未命名文章')}__001`;
        }
        const opened = await openObsidianWrittenNote(result.notePath);
        if (!opened) {
          showObsidianToast({
            tone: 'warn',
            title: '本地已写入，自动打开失败',
            detail: `已写入：${result.notePath}\n请确认 Obsidian 已安装并允许唤起 obsidian:// 链接。`,
            actionLabel: '打开设置',
            actionHandler: () => chrome.runtime.openOptionsPage(),
          });
        }
      } catch (localErr) {
        const uriResult = await sendToObsidianByUri({ blocks, noteTitle, sourceUrl });
        const feedback = getObsidianErrorFeedback(localErr, { fallbackMode: uriResult.mode });
        setIconOnlyBtn(clipToObsidianBtn, 'check', feedback.buttonLabel);
        if (uriResult.mode === 'uri-fallback-paste' && feedback.statusText === '状态：本地写入失败，已回退 URI') {
          setStatusChip('状态：本地写入失败，已回退 URI+粘贴', 'warn');
        } else {
          setStatusChip(feedback.statusText, feedback.tone);
        }
        if (statusChip) statusChip.title = feedback.title;
        showObsidianToast({
          tone: feedback.tone,
          title: feedback.statusText.replace(/^状态：/, ''),
          detail: feedback.title,
          actionLabel: feedback.actionLabel,
          actionHandler: feedback.actionKind === 'open-settings' ? () => chrome.runtime.openOptionsPage() : null,
        });
      }
    } else {
      const result = await sendToObsidianByUri({ blocks, noteTitle, sourceUrl });
      if (result.mode === 'uri-fallback-paste') {
        setIconOnlyBtn(clipToObsidianBtn, 'check', '已复制');
        setStatusChip('状态：Obsidian 长文已复制', 'warn');
        if (statusChip) statusChip.title = '内容超长，已创建占位笔记。请在 Obsidian 中全选后粘贴覆盖。';
      } else {
        setIconOnlyBtn(clipToObsidianBtn, 'check', '已发送');
        setStatusChip('状态：已唤起 Obsidian', 'ok');
        if (statusChip) statusChip.title = '';
      }
    }
  } catch (err) {
    console.error('Clip to obsidian failed:', err);
    const feedback = getObsidianErrorFeedback(err);
    setIconOnlyBtn(clipToObsidianBtn, 'circleX', feedback.buttonLabel);
    setStatusChip(feedback.statusText, feedback.tone);
    if (statusChip) statusChip.title = feedback.title;
    showObsidianToast({
      tone: feedback.tone,
      title: feedback.statusText.replace(/^状态：/, ''),
      detail: feedback.title,
      actionLabel: feedback.actionLabel,
      actionHandler: feedback.actionKind === 'open-settings' ? () => chrome.runtime.openOptionsPage() : null,
    });
  } finally {
    setTimeout(() => {
      clipToObsidianBtn.innerHTML = original;
    }, 1800);
    clipToObsidianBtn.disabled = false;
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
  setNotionConfigStatus('正在拉取可写目标（页面/数据库）...', 'warn');
  try {
    const targets = await discoverWritableNotionTargets(token);
    state.notionToken = token;
    state.notionTargetCandidates = targets;
    const currentType = getCurrentNotionTargetType();
    const currentId = toNotionUuid(state.notionParentPageId || notionParentPageInput?.value?.trim() || '');
    if (currentId) {
      const current = targets.find(item => item.id === currentId && item.type === currentType);
      if (current) {
        setLastTargetTitleByType(currentType, current.title || '');
      }
    }
    applyNotionTargetCandidates(targets);
    persistNotionTargetSelection().catch(err => {
      console.warn('Persist notion candidates cache failed:', err);
    });
    if (targets.length) {
      const pageCount = targets.filter(item => item.type === 'page').length;
      const databaseCount = targets.filter(item => item.type === 'database').length;
      setNotionConfigStatus(`发现 ${targets.length} 个可写目标（页面 ${pageCount} / 数据库 ${databaseCount}）`, 'ok');
      setStatusChip('状态：可写目标已加载', 'ok');
    } else {
      setNotionConfigStatus('未发现可写目标，请先在 Notion 中 Add connections', 'warn');
      setStatusChip('状态：未发现可写目标', 'warn');
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

siteBadges?.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('.site-badge[data-rule-id]') : null;
  if (!(target instanceof HTMLElement)) return;
  const ruleId = target.dataset.ruleId || '';
  if (!ruleId) return;
  state.activeRuleId = ruleId;
  refreshRuleEditorView();
  setRuleEditorStatus(`已加载标签：${target.textContent || ruleId}`, 'ok');
});

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
    if (exists) {
      throw new Error('规则 ID 已存在，请更换标签名或匹配值');
    }
    state.rules = normalizeRules([...state.rules, candidate]);
    state.activeRuleId = candidate.id;
    await persistRules(`已新增标签：${candidate.label}`);
    renderStatus('新增标签规则成功', 'warn');
  } catch (err) {
    const message = typeof err?.message === 'string' ? err.message : '新增失败';
    setRuleEditorStatus(`新增失败：${message}`, 'error');
  }
});

saveRuleEditorBtn?.addEventListener('click', async () => {
  if (!state.activeRuleId) {
    setRuleEditorStatus('请先选择一个规则', 'warn');
    return;
  }
  try {
    const index = state.rules.findIndex(rule => rule.id === state.activeRuleId);
    if (index < 0) {
      throw new Error('未找到当前规则');
    }
    const updated = buildRuleFromEditor(state.rules[index]);
    const nextRules = [...state.rules];
    nextRules[index] = updated;
    state.rules = normalizeRules(nextRules);
    await persistRules(`已保存标签：${updated.label}`);
    renderStatus('标签规则已保存', 'warn');
  } catch (err) {
    const message = typeof err?.message === 'string' ? err.message : '保存失败';
    setRuleEditorStatus(`保存失败：${message}`, 'error');
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
  renderStatus('标签规则已删除', 'warn');
});

debugModeCheckbox?.addEventListener('change', async () => {
  state.debugMode = Boolean(debugModeCheckbox.checked);
  await chrome.storage.local.set({ [STORAGE_KEYS.debugMode]: state.debugMode });
});

debugMockBtn?.addEventListener('click', () => {
  renderDebugMock();
});

openSettingsBtn?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

obsidianToastDismiss?.addEventListener('click', () => {
  hideObsidianToast();
});

setBtn(grabBtn, 'zap', '开始净化');
setBtn(copyBtn, 'copy', '复制 Markdown');
setIconOnlyBtn(exportNotionBtn, 'download', '导出 Notion 包');
setIconOnlyBtn(clipToObsidianBtn, 'send', '发送到 Obsidian');
setIconOnlyBtn(clipToNotionBtn, 'send', '发送到 Notion');
setIconOnlyBtn(debugMockBtn, 'flaskConical', '调试模式');

loadSettings().catch(err => {
  console.error('Load settings failed:', err);
  renderSiteBadges();
});

bindTabChangeListeners();

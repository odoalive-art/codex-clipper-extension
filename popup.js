import { extractPageContent } from './extractor.js';
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

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

const state = {
  rules: getDefaultRules(),
  debugMode: true,
};

const ICONS = {
  bolt:
    '<svg class="icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  rotateCw:
    '<svg class="icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1 2.13-9"></path></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  xCircle:
    '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
};

function setBtn(btn, icon, label) {
  btn.innerHTML = `${ICONS[icon] || ''}<span class="btn-text">${label}</span>`;
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

async function highlightCurrentSiteBadge() {
  const tab = await getActiveTab();
  if (!tab?.url) return;
  let host = '';
  try {
    host = new URL(tab.url).hostname;
  } catch {
    return;
  }

  document.querySelectorAll('.site-badge[data-rule-id]').forEach(badge => {
    const rule = state.rules.find(item => item.id === badge.dataset.ruleId);
    if (rule && hostMatchesRule(host, rule)) {
      badge.classList.add('active');
    }
  });
}

function renderToPreview(blocks) {
  const frag = document.createDocumentFragment();
  blocks.forEach(block => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'img') {
      const src = normalizeHttpUrl(block.src);
      if (!src) return;
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      frag.appendChild(img);
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
  const stored = await chrome.storage.local.get([STORAGE_KEYS.siteRules, STORAGE_KEYS.debugMode]);
  state.rules = normalizeRules(stored[STORAGE_KEYS.siteRules]);
  state.debugMode = stored[STORAGE_KEYS.debugMode] !== false;
  if (debugModeCheckbox) debugModeCheckbox.checked = state.debugMode;
  renderRulesJson();
  renderSiteBadges();
  setStatusChip('状态：就绪');
  setCountChip(preview.children.length || 0);
  await highlightCurrentSiteBadge();
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

grabBtn.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab?.id) {
    renderStatus('未找到可用标签页', 'error');
    return;
  }

  grabBtn.disabled = true;
  setBtn(grabBtn, 'rotateCw', '抓取中...');
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
    renderDebug(payload?.debug || null, blocks.length);
    setBtn(grabBtn, 'rotateCw', '重新抓取');
    copyBtn.style.display = 'flex';
  } catch (err) {
    console.error('Grabbing failed:', err);
    setCountChip(0);
    renderStatus('抓取失败，请刷新页面重试', 'error');
  } finally {
    grabBtn.disabled = false;
    if (!grabBtn.textContent?.includes('重新抓取')) {
      setBtn(grabBtn, 'bolt', '开始净化');
    }
  }
});

copyBtn.addEventListener('click', async () => {
  const lines = [];
  preview.childNodes.forEach(node => {
    const tag = node.nodeName;
    const text = node.textContent?.trim() || '';
    if (tag === 'H1' && text) lines.push(`# ${text}`);
    else if (tag === 'H2' && text) lines.push(`## ${text}`);
    else if (tag === 'H3' && text) lines.push(`### ${text}`);
    else if (tag === 'P' && text) lines.push(text);
    else if (tag === 'IMG') {
      const src = normalizeHttpUrl(node.getAttribute?.('src') || node.src || '');
      if (src) lines.push(`![](${src})`);
    }
  });

  const md = lines.join('\n\n').trim();
  if (!md) {
    setStatusChip('状态：无可复制内容', 'warn');
    renderStatus('当前没有可复制的内容', 'warn');
    return;
  }

  const orig = copyBtn.innerHTML;
  try {
    await navigator.clipboard.writeText(md);
    setBtn(copyBtn, 'check', '已存入剪贴板');
    setStatusChip('状态：已复制', 'ok');
  } catch (err) {
    console.error('Copy failed:', err);
    setBtn(copyBtn, 'xCircle', '复制失败');
    setStatusChip('状态：复制失败', 'error');
    renderStatus('复制失败，请重试', 'error');
  } finally {
    setTimeout(() => {
      copyBtn.innerHTML = orig;
    }, 2000);
  }
});

saveRulesBtn?.addEventListener('click', saveRulesFromInput);
resetRulesBtn?.addEventListener('click', resetRules);
copyRulesBtn?.addEventListener('click', copyRulesJson);
debugModeCheckbox?.addEventListener('change', async () => {
  state.debugMode = Boolean(debugModeCheckbox.checked);
  await chrome.storage.local.set({ [STORAGE_KEYS.debugMode]: state.debugMode });
});

loadSettings().catch(err => {
  console.error('Load settings failed:', err);
  renderSiteBadges();
});

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
const exportNotionBtn = document.getElementById('exportNotionBtn');

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

const state = {
  rules: getDefaultRules(),
  debugMode: true,
  activeHost: '',
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

function hostFromUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl) return '';
  try {
    return new URL(rawUrl).hostname || '';
  } catch {
    return '';
  }
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

  let localized = 0;
  for (const image of images) {
    const src = normalizeHttpUrl(image.getAttribute('src') || image.src || '');
    if (!src) continue;
    try {
      const blob = await fetchImageBlob(src);
      const dataUrl = await blobToDataUrl(blob);
      if (!dataUrl) continue;
      image.dataset.remoteSrc = src;
      image.src = dataUrl;
      localized += 1;
    } catch (err) {
      console.warn('Localize preview image failed:', err);
    }
  }

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
      const src = normalizeHttpUrl(imageNode.getAttribute('src') || imageNode.src || '');
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

grabBtn.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab?.id) {
    renderStatus('未找到可用标签页', 'error');
    return;
  }
  state.activeHost = hostFromUrl(tab.url);

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
    setBtn(grabBtn, 'rotateCw', '重新抓取');
    copyBtn.style.display = 'flex';
    if (exportNotionBtn) exportNotionBtn.style.display = 'flex';
  } catch (err) {
    console.error('Grabbing failed:', err);
    setCountChip(0);
    const message = typeof err?.message === 'string' ? err.message : '';
    if (message.includes('Cannot access contents of the page')) {
      renderStatus('抓取失败：缺少当前站点权限。请重载扩展后重试。', 'error');
    } else {
      renderStatus('抓取失败，请刷新页面重试', 'error');
    }
  } finally {
    grabBtn.disabled = false;
    if (!grabBtn.textContent?.includes('重新抓取')) {
      setBtn(grabBtn, 'bolt', '开始净化');
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
    setBtn(copyBtn, 'xCircle', '复制失败');
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

export const SUPPORTED_SITES = [
  { host: 'xiaobot.net', label: '小报童' },
  { host: 'mp.weixin.qq.com', label: '公众号' },
  { host: 'zcool.com.cn', label: '站酷' },
  { host: 'sspai.com', label: '少数派' },
];

export async function extractPageContent(options = {}) {
  const SAFE_PROTOCOLS = new Set(['http:', 'https:']);
  const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

  function toRegExp(value) {
    if (!value || typeof value !== 'string') return null;
    try {
      return new RegExp(value, 'i');
    } catch {
      return null;
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function toStringList(value, fallback) {
    if (!Array.isArray(value)) return fallback;
    const list = value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim());
    return list.length ? list : fallback;
  }

  function normalizeMatch(match) {
    if (!match || typeof match !== 'object') return null;
    const hostSuffix = typeof match.hostSuffix === 'string' ? match.hostSuffix.trim() : '';
    const hostEquals = typeof match.hostEquals === 'string' ? match.hostEquals.trim() : '';
    const hostRegex = typeof match.hostRegex === 'string' ? match.hostRegex.trim() : '';
    if (!hostSuffix && !hostEquals && !hostRegex) return null;
    return { hostSuffix, hostEquals, hostRegex };
  }

  function normalizeRule(rule) {
    if (!rule || typeof rule !== 'object') return null;
    const match = normalizeMatch(rule.match);
    if (!match) return null;

    return {
      id: typeof rule.id === 'string' && rule.id.trim() ? rule.id.trim() : 'custom-rule',
      label: typeof rule.label === 'string' && rule.label.trim() ? rule.label.trim() : '未命名规则',
      enabled: rule.enabled !== false,
      match,
      rootSelectors: toStringList(rule.rootSelectors, ['article', 'main', '[role="main"]', 'body']),
      titleSelectors: toStringList(rule.titleSelectors, ['h1']),
      contentSelectors: toStringList(rule.contentSelectors, ['h1', 'h2', 'h3', 'p', 'li', 'blockquote', 'pre', 'img', 'video']),
      exclude: {
        ancestorTags: toStringList(rule.exclude?.ancestorTags, ['NAV', 'HEADER', 'FOOTER', 'ASIDE']),
        ancestorClassRegex:
          typeof rule.exclude?.ancestorClassRegex === 'string'
            ? rule.exclude.ancestorClassRegex
            : '\\b(nav|header|footer|sidebar|menu|ad|advertisement|recommend|related|comment|copyright|share|toolbar|breadcrumb)\\b',
        textRegex:
          typeof rule.exclude?.textRegex === 'string'
            ? rule.exclude.textRegex
            : '^(收藏|关注|私信|点赞|评论|分享|举报|更多|展开|收起|查看|复制|下载|购买|加购|立即|确认|取消|返回|登录|注册)$',
      },
      image: {
        srcAttrs: toStringList(rule.image?.srcAttrs, ['data-original', 'data-origin', 'data-src', 'data-lazy-src', 'src']),
        minWidth: Number.isFinite(rule.image?.minWidth) ? Math.max(0, Number(rule.image.minWidth)) : 100,
        minHeight: Number.isFinite(rule.image?.minHeight) ? Math.max(0, Number(rule.image.minHeight)) : 100,
        rejectSrcRegex:
          typeof rule.image?.rejectSrcRegex === 'string'
            ? rule.image.rejectSrcRegex
            : '(avatar|icon|logo|emoji|badge|sprite|btn|button|arrow|loading|placeholder)',
      },
      text: {
        minLength: Number.isFinite(rule.text?.minLength) ? Math.max(0, Number(rule.text.minLength)) : 1,
        dedupe: rule.text?.dedupe !== false,
        skipIfHasDescendantSelector:
          typeof rule.text?.skipIfHasDescendantSelector === 'string' ? rule.text.skipIfHasDescendantSelector : '',
      },
      limits: {
        maxBlocks: Number.isFinite(rule.limits?.maxBlocks) ? Math.max(1, Number(rule.limits.maxBlocks)) : 400,
        maxChars: Number.isFinite(rule.limits?.maxChars) ? Math.max(1, Number(rule.limits.maxChars)) : 50000,
      },
    };
  }

  function normalizeRules(inputRules) {
    const list = Array.isArray(inputRules) ? inputRules : [];
    return list.map(normalizeRule).filter(Boolean);
  }

  function hostMatches(hostname, match) {
    if (!match) return false;
    if (match.hostEquals && hostname === match.hostEquals) return true;
    if (match.hostSuffix && (hostname === match.hostSuffix || hostname.endsWith(`.${match.hostSuffix}`))) return true;
    if (match.hostRegex) {
      const hostRe = toRegExp(match.hostRegex);
      if (hostRe?.test(hostname)) return true;
    }
    return false;
  }

  function findRoot(rule) {
    for (const selector of rule.rootSelectors) {
      const root = document.querySelector(selector);
      if (root) return { root, selector };
    }
    return { root: document.body, selector: 'body' };
  }

  function firstSrcFromSrcset(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    const first = value.split(',')[0]?.trim() || '';
    if (!first) return '';
    return first.split(/\s+/)[0] || '';
  }

  function resolveImageSrc(el, srcAttrs) {
    const candidates = [];
    srcAttrs.forEach(attr => {
      if (attr === 'src') candidates.push(el.src);
      else if (attr === 'srcset') candidates.push(firstSrcFromSrcset(el.getAttribute('srcset') || el.srcset || ''));
      else candidates.push(el.getAttribute(attr));
    });
    candidates.push(firstSrcFromSrcset(el.getAttribute('srcset') || el.srcset || ''));
    candidates.push(el.currentSrc);
    candidates.push(el.src);

    for (const raw of candidates) {
      if (!raw || typeof raw !== 'string') continue;
      if (raw.startsWith('data:') || raw.startsWith('blob:')) continue;
      try {
        const url = new URL(raw, location.href);
        if (SAFE_PROTOCOLS.has(url.protocol)) return url.href;
      } catch {
        continue;
      }
    }
    return '';
  }

  function resolveVideoSrc(el) {
    const candidates = [el.getAttribute('src'), el.currentSrc, el.src];
    const sourceEl = el.querySelector('source[src]');
    if (sourceEl) candidates.push(sourceEl.getAttribute('src'));
    for (const raw of candidates) {
      if (!raw || typeof raw !== 'string') continue;
      if (raw.startsWith('data:') || raw.startsWith('blob:')) continue;
      try {
        const url = new URL(raw, location.href);
        if (SAFE_PROTOCOLS.has(url.protocol)) return url.href;
      } catch {
        continue;
      }
    }
    return '';
  }

  function normalizeLinkHref(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return '';
    try {
      const url = new URL(raw, location.href);
      return SAFE_LINK_PROTOCOLS.has(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function extractInlineSegments(el, fullText) {
    if (!(el instanceof Element) || !fullText) return [];
    const anchors = Array.from(el.querySelectorAll('a[href]'));
    if (!anchors.length) return [];

    const links = anchors
      .map(anchor => {
        const text = (anchor.innerText || '').replace(/\s+/g, ' ').trim();
        const href = normalizeLinkHref(anchor.getAttribute('href') || anchor.href || '');
        if (!text || !href) return null;
        return { text, href };
      })
      .filter(Boolean);
    if (!links.length) return [];

    const segments = [];
    let cursor = 0;
    for (const link of links) {
      const hit = fullText.indexOf(link.text, cursor);
      if (hit < 0) continue;
      const before = fullText.slice(cursor, hit);
      if (before) segments.push({ type: 'text', text: before });
      segments.push({ type: 'link', text: link.text, href: link.href });
      cursor = hit + link.text.length;
    }
    if (cursor < fullText.length) {
      segments.push({ type: 'text', text: fullText.slice(cursor) });
    }

    const compact = [];
    for (const segment of segments) {
      const text = typeof segment?.text === 'string' ? segment.text : '';
      if (!text) continue;
      const prev = compact[compact.length - 1];
      if (prev && prev.type === segment.type && (segment.type !== 'link' || prev.href === segment.href)) {
        prev.text += text;
      } else {
        compact.push(segment.type === 'link' ? { type: 'link', text, href: segment.href } : { type: 'text', text });
      }
    }
    return compact;
  }

  function toRoman(num) {
    const value = Math.max(1, Number(num) || 1);
    const map = [
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ];
    let rest = value;
    let out = '';
    map.forEach(([n, s]) => {
      while (rest >= n) {
        out += s;
        rest -= n;
      }
    });
    return out;
  }

  function toAlpha(index, upper = false) {
    let n = Math.max(1, Number(index) || 1);
    let out = '';
    while (n > 0) {
      n -= 1;
      out = String.fromCharCode(97 + (n % 26)) + out;
      n = Math.floor(n / 26);
    }
    return upper ? out.toUpperCase() : out;
  }

  function listMetaForItem(el) {
    if (!(el instanceof Element) || el.tagName !== 'LI') return null;
    const parent = el.parentElement;
    if (!parent) return null;
    if (parent.tagName === 'UL') return { marker: '•', listType: 'bulleted' };
    if (parent.tagName !== 'OL') return null;

    const items = Array.from(parent.children).filter(child => child instanceof Element && child.tagName === 'LI');
    const idx = items.indexOf(el);
    const start = Number(parent.getAttribute('start') || '1');
    const order = (Number.isFinite(start) ? start : 1) + Math.max(0, idx);
    const rawType = (parent.getAttribute('type') || '').trim();
    const styleType = window.getComputedStyle(parent).listStyleType || '';
    const type = rawType || styleType;
    if (type === 'a' || type === 'lower-alpha' || type === 'lower-latin') {
      return { marker: `${toAlpha(order, false)}.`, listType: 'numbered' };
    }
    if (type === 'A' || type === 'upper-alpha' || type === 'upper-latin') {
      return { marker: `${toAlpha(order, true)}.`, listType: 'numbered' };
    }
    if (type === 'i' || type === 'lower-roman') {
      return { marker: `${toRoman(order).toLowerCase()}.`, listType: 'numbered' };
    }
    if (type === 'I' || type === 'upper-roman') {
      return { marker: `${toRoman(order)}.`, listType: 'numbered' };
    }
    return { marker: `${order}.`, listType: 'numbered' };
  }

  function isNoiseByAncestor(el, rule, classRe) {
    let cur = el;
    while (cur && cur !== document.body) {
      if (rule.exclude.ancestorTags.includes(cur.tagName)) return true;
      if (typeof cur.className === 'string' && classRe?.test(cur.className)) return true;
      const role = cur.getAttribute?.('role') || '';
      if (/navigation|banner|contentinfo/i.test(role)) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  function mapTagToType(tagName) {
    if (tagName === 'H1') return 'h1';
    if (tagName === 'H2') return 'h2';
    if (tagName === 'H3') return 'h3';
    if (tagName === 'LI') return 'li';
    if (tagName === 'BLOCKQUOTE') return 'quote';
    return 'p';
  }

  function parseQuoteLikeParagraph(tagName, text) {
    if (tagName !== 'P' || typeof text !== 'string') return { content: text, forceQuote: false };
    const normalized = text.replace(/\r\n?/g, '\n').trim();
    if (!normalized) return { content: text, forceQuote: false };

    const lines = normalized.split('\n');
    const quoteLineRe = /^\s*[>\uFF1E]\s?/;
    const allQuoted = lines.every(line => quoteLineRe.test(line));
    if (!allQuoted) return { content: text, forceQuote: false };

    const stripped = lines.map(line => line.replace(quoteLineRe, '')).join('\n').trim();
    if (!stripped) return { content: text, forceQuote: false };
    return { content: stripped, forceQuote: true };
  }

  function detectCodeLanguage(el) {
    if (!(el instanceof Element)) return '';
    const codeEl = el.tagName === 'CODE' ? el : el.querySelector('code');
    const classNames = [codeEl?.className, el.className]
      .filter(value => typeof value === 'string' && value.trim())
      .join(' ');
    const match = classNames.match(/(?:^|\s)(?:language|lang)-([a-z0-9_+-]+)\b/i);
    if (match?.[1]) {
      return match[1].toLowerCase().replaceAll('_', '-');
    }
    const attrLang = codeEl?.getAttribute?.('lang') || el.getAttribute?.('lang') || '';
    if (typeof attrLang === 'string' && attrLang.trim()) {
      return attrLang.trim().toLowerCase().replaceAll('_', '-');
    }
    return '';
  }

  function extractTextFromNode(el) {
    if (!(el instanceof Element)) return '';
    if (el.tagName === 'PRE') {
      const codeEl = el.querySelector('code');
      const codeText = codeEl?.innerText || '';
      const normalizedCode = codeText.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
      if (normalizedCode) return normalizedCode;
    }
    return el.innerText?.trim() || '';
  }

  async function preloadLazyContentIfNeeded(rule, debug) {
    const preloadEnabled = options?.preloadLazy !== false;
    if (!preloadEnabled) return;
    if (!rule || rule.id !== 'wechat-mp') return;

    const startY = window.scrollY || 0;
    const scroller = document.scrollingElement || document.documentElement;
    const maxSteps = Number.isFinite(options?.preloadMaxSteps) ? Math.max(3, Number(options.preloadMaxSteps)) : 24;
    const stepPx = Number.isFinite(options?.preloadStepPx) ? Math.max(200, Number(options.preloadStepPx)) : 900;
    const settleMs = Number.isFinite(options?.preloadSettleMs) ? Math.max(50, Number(options.preloadSettleMs)) : 120;

    let steps = 0;
    let lastHeight = 0;
    for (let i = 0; i < maxSteps; i += 1) {
      const targetY = Math.min(scroller.scrollHeight, i * stepPx);
      window.scrollTo(0, targetY);
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      await sleep(settleMs);
      steps += 1;

      const curHeight = scroller.scrollHeight;
      const nearBottom = window.innerHeight + window.scrollY >= curHeight - 4;
      const stable = curHeight === lastHeight;
      if (nearBottom && stable) break;
      lastHeight = curHeight;
    }

    // Let lazy-loaded images resolve after scroll stimulation.
    const images = Array.from(document.images || []);
    const imageWaiters = images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    });
    if (imageWaiters.length) {
      await Promise.race([Promise.allSettled(imageWaiters), sleep(1200)]);
    }

    window.scrollTo(0, startY);
    window.dispatchEvent(new Event('scroll'));

    if (debug) {
      debug.preload = {
        enabled: true,
        steps,
        imageCandidates: images.length,
      };
    }
  }

  function extractWithRule(rule) {
    const debug = {
      ruleId: rule.id,
      ruleLabel: rule.label,
      rootSelector: '',
      counters: {
        candidates: 0,
        kept: 0,
        skipNoiseAncestor: 0,
        skipNoiseText: 0,
        skipEmpty: 0,
        skipDuplicateText: 0,
        skipContainerText: 0,
        skipInvalidImageSrc: 0,
        skipDecorativeImage: 0,
        skipSmallImage: 0,
        skipDuplicateImage: 0,
        stopByMaxBlocks: 0,
        stopByMaxChars: 0,
      },
    };

    const blocks = [];
    const seenText = new Set();
    const seenImage = new Set();
    let totalChars = 0;

    const classRe = toRegExp(rule.exclude.ancestorClassRegex);
    const noiseTextRe = toRegExp(rule.exclude.textRegex);
    const rejectSrcRe = toRegExp(rule.image.rejectSrcRegex);

    const { root, selector } = findRoot(rule);
    debug.rootSelector = selector;

    const titleSelector = rule.titleSelectors.join(', ');
    const titleEl = titleSelector ? document.querySelector(titleSelector) : null;
    if (titleEl) {
      const title = titleEl.innerText?.trim() || '';
      if (title) {
        blocks.push({ type: 'h1', content: title });
        seenText.add(title);
        totalChars += title.length;
        debug.counters.kept += 1;
      }
    }

    const contentSelector = rule.contentSelectors.join(', ');
    const nodes = contentSelector ? root.querySelectorAll(contentSelector) : [];

    for (const el of nodes) {
      debug.counters.candidates += 1;

      if (isNoiseByAncestor(el, rule, classRe)) {
        debug.counters.skipNoiseAncestor += 1;
        continue;
      }

      if (blocks.length >= rule.limits.maxBlocks) {
        debug.counters.stopByMaxBlocks += 1;
        break;
      }
      if (totalChars >= rule.limits.maxChars) {
        debug.counters.stopByMaxChars += 1;
        break;
      }

      if (el.tagName === 'IMG') {
        const src = resolveImageSrc(el, rule.image.srcAttrs);
        if (!src) {
          debug.counters.skipInvalidImageSrc += 1;
          continue;
        }
        if (rejectSrcRe?.test(src)) {
          debug.counters.skipDecorativeImage += 1;
          continue;
        }
        if (seenImage.has(src)) {
          debug.counters.skipDuplicateImage += 1;
          continue;
        }

        const w = el.naturalWidth || el.clientWidth || 0;
        const h = el.naturalHeight || el.clientHeight || 0;
        if ((w > 0 && w < rule.image.minWidth) || (h > 0 && h < rule.image.minHeight)) {
          debug.counters.skipSmallImage += 1;
          continue;
        }

        seenImage.add(src);
        blocks.push({ type: 'img', src });
        debug.counters.kept += 1;
        continue;
      }
      if (el.tagName === 'VIDEO') {
        const src = resolveVideoSrc(el);
        if (!src) {
          debug.counters.skipInvalidImageSrc += 1;
          continue;
        }
        if (seenImage.has(src)) {
          debug.counters.skipDuplicateImage += 1;
          continue;
        }
        seenImage.add(src);
        blocks.push({ type: 'video', src });
        debug.counters.kept += 1;
        continue;
      }

      const text = extractTextFromNode(el);
      if (el.tagName === 'PRE') {
        if (!text) {
          debug.counters.skipEmpty += 1;
          continue;
        }
        if (rule.text.dedupe && seenText.has(text)) {
          debug.counters.skipDuplicateText += 1;
          continue;
        }
        const language = detectCodeLanguage(el);
        seenText.add(text);
        totalChars += text.length;
        blocks.push({
          type: 'code',
          content: text,
          ...(language ? { language } : {}),
        });
        debug.counters.kept += 1;
        continue;
      }

      if (el.tagName !== 'LI') {
        const parentLi = el.closest('li');
        if (parentLi && parentLi !== el) {
          debug.counters.skipContainerText += 1;
          continue;
        }
      }

      if (rule.text.skipIfHasDescendantSelector) {
        let hasDescendant = false;
        try {
          hasDescendant = Boolean(el.querySelector(rule.text.skipIfHasDescendantSelector));
        } catch {
          hasDescendant = false;
        }
        if (hasDescendant && el.tagName !== 'LI') {
          debug.counters.skipContainerText += 1;
          continue;
        }
      }

      if (!text) {
        debug.counters.skipEmpty += 1;
        continue;
      }
      if (text.length < rule.text.minLength) {
        debug.counters.skipEmpty += 1;
        continue;
      }
      if (noiseTextRe?.test(text)) {
        debug.counters.skipNoiseText += 1;
        continue;
      }
      const listMeta = listMetaForItem(el);
      const marker = listMeta?.marker || '';
      const quoteLike = parseQuoteLikeParagraph(el.tagName, text);
      const content = quoteLike.content;
      if (rule.text.dedupe && seenText.has(content)) {
        debug.counters.skipDuplicateText += 1;
        continue;
      }
      let segments = extractInlineSegments(el, text);
      if (!segments.length && content) segments = [{ type: 'text', text: content }];
      seenText.add(content);
      totalChars += content.length;
      blocks.push({
        type: quoteLike.forceQuote ? 'quote' : mapTagToType(el.tagName),
        content,
        ...(listMeta ? { listType: listMeta.listType, marker: listMeta.marker } : {}),
        ...(segments.length ? { segments } : {}),
      });
      debug.counters.kept += 1;
    }

    return { blocks, debug };
  }

  const debugEnabled = options?.debug === true;
  const rules = normalizeRules(options?.rules);
  const hostname = location.hostname;
  const activeRule = rules.find(rule => rule.enabled && hostMatches(hostname, rule.match));

  const fallbackRule = normalizeRule({
    id: 'fallback-generic',
    label: '通用规则',
    enabled: true,
    match: { hostRegex: '.*' },
    rootSelectors: ['article', '[role="main"]', '.article-content', '.post-content', 'main', 'body'],
    titleSelectors: ['h1'],
    contentSelectors: ['h1', 'h2', 'h3', 'p', 'li', 'blockquote', 'pre', 'img', 'video'],
  });

  const targetRule = activeRule || fallbackRule;
  const preloadDebug = {};
  await preloadLazyContentIfNeeded(targetRule, preloadDebug);
  const { blocks, debug } = extractWithRule(targetRule);
  const result = {
    blocks,
    debug: {
      host: hostname,
      matchedRuleId: activeRule?.id || fallbackRule.id,
      matchedRuleLabel: activeRule?.label || fallbackRule.label,
      preload: preloadDebug.preload || null,
      ...debug,
    },
  };

  return debugEnabled ? result : { blocks };
}

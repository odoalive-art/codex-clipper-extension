export const SUPPORTED_SITES = [{ host: 'xiaobot.net', label: '小报童' }];

export function extractPageContent(options = {}) {
  const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

  const DEFAULT_RULES = [
    {
      id: 'xiaobot',
      label: '小报童',
      enabled: true,
      match: { hostSuffix: 'xiaobot.net' },
      rootSelectors: ['.paper-content', '.post-content', 'article', 'main'],
      titleSelectors: ['h1'],
      contentSelectors: ['h1', 'h2', 'h3', 'p', 'img'],
      exclude: {
        ancestorTags: ['NAV', 'HEADER', 'FOOTER', 'ASIDE'],
        ancestorClassRegex:
          '\\b(nav|header|footer|sidebar|menu|ad|advertisement|recommend|related|comment|copyright|share|toolbar|breadcrumb)\\b',
        textRegex:
          '^(收藏|关注|私信|点赞|评论|分享|举报|更多|展开|收起|查看|复制|下载|购买|加购|立即|确认|取消|返回|登录|注册)$',
      },
      image: {
        srcAttrs: ['data-original', 'data-origin', 'data-src', 'data-lazy-src', 'src'],
        minWidth: 100,
        minHeight: 100,
        rejectSrcRegex: '(avatar|icon|logo|emoji|badge|sprite|btn|button|arrow|loading|placeholder)',
      },
      text: { minLength: 1, dedupe: true },
      limits: { maxBlocks: 400, maxChars: 50000 },
    },
  ];

  function toRegExp(value) {
    if (!value || typeof value !== 'string') return null;
    try {
      return new RegExp(value, 'i');
    } catch {
      return null;
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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
      contentSelectors: toStringList(rule.contentSelectors, ['h1', 'h2', 'h3', 'p', 'img']),
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
      },
      limits: {
        maxBlocks: Number.isFinite(rule.limits?.maxBlocks) ? Math.max(1, Number(rule.limits.maxBlocks)) : 400,
        maxChars: Number.isFinite(rule.limits?.maxChars) ? Math.max(1, Number(rule.limits.maxChars)) : 50000,
      },
    };
  }

  function normalizeRules(inputRules) {
    const list = Array.isArray(inputRules) ? inputRules : [];
    const normalized = list.map(normalizeRule).filter(Boolean);
    return normalized.length ? normalized : clone(DEFAULT_RULES);
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

  function resolveImageSrc(el, srcAttrs) {
    const candidates = [];
    srcAttrs.forEach(attr => {
      if (attr === 'src') candidates.push(el.src);
      else candidates.push(el.getAttribute(attr));
    });
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
    return 'p';
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
    if (titleEl && !root.contains(titleEl)) {
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

      const text = el.innerText?.trim() || '';
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
      if (rule.text.dedupe && seenText.has(text)) {
        debug.counters.skipDuplicateText += 1;
        continue;
      }

      seenText.add(text);
      totalChars += text.length;
      blocks.push({ type: mapTagToType(el.tagName), content: text });
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
    contentSelectors: ['h1', 'h2', 'h3', 'p', 'img'],
  });

  const { blocks, debug } = extractWithRule(activeRule || fallbackRule);
  const result = {
    blocks,
    debug: {
      host: hostname,
      matchedRuleId: activeRule?.id || fallbackRule.id,
      matchedRuleLabel: activeRule?.label || fallbackRule.label,
      ...debug,
    },
  };

  return debugEnabled ? result : { blocks };
}

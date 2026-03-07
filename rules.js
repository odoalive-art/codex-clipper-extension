export const STORAGE_KEYS = {
  siteRules: 'siteRules',
  debugMode: 'debugMode',
  notionToken: 'notionToken',
  notionParentPageId: 'notionParentPageId',
};

export const DEFAULT_SITE_RULES = [
  {
    id: 'xiaobot',
    label: '小报童',
    enabled: true,
    match: {
      hostSuffix: 'xiaobot.net',
    },
    rootSelectors: ['.paper-content', '.post-content', 'article', 'main'],
    titleSelectors: ['h1'],
    contentSelectors: ['h1', 'h2', 'h3', 'p', 'li', 'blockquote', 'pre', 'img'],
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
    text: {
      minLength: 1,
      dedupe: true,
      skipIfHasDescendantSelector: '',
    },
    limits: {
      maxBlocks: 400,
      maxChars: 50000,
    },
  },
  {
    id: 'wechat-mp',
    label: '公众号',
    enabled: true,
    match: {
      hostEquals: 'mp.weixin.qq.com',
    },
    rootSelectors: ['#js_content', '.rich_media_content', 'article', 'main'],
    titleSelectors: ['#activity-name .js_title_inner', '#activity-name', '.rich_media_title'],
    contentSelectors: ['h1', 'h2', 'h3', 'p', 'section', 'li', 'blockquote', 'pre', 'div', 'img'],
    exclude: {
      ancestorTags: ['NAV', 'HEADER', 'FOOTER', 'ASIDE'],
      ancestorClassRegex:
        '\\b(nav|header|footer|sidebar|menu|ad|advertisement|recommend|related|comment|copyright|share|toolbar|breadcrumb|qr_code|js_profile_qrcode|reward|wx_follow_card)\\b',
      textRegex:
        '^(收藏|关注|私信|点赞|评论|分享|举报|更多|展开|收起|查看|复制|下载|购买|加购|立即|确认|取消|返回|登录|注册|微信扫一扫关注该公众号)$',
    },
    image: {
      srcAttrs: ['data-src', 'data-original', 'data-origin', 'src'],
      minWidth: 0,
      minHeight: 0,
      rejectSrcRegex: '(avatar|icon|logo|emoji|badge|sprite|btn|button|arrow|loading|placeholder|qrcode)',
    },
    text: {
      minLength: 1,
      dedupe: true,
      skipIfHasDescendantSelector: 'p, h1, h2, h3, li, blockquote, pre, section, div',
    },
    limits: {
      maxBlocks: 500,
      maxChars: 80000,
    },
  },
];

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
    id: typeof rule.id === 'string' && rule.id.trim() ? rule.id.trim() : `rule-${Date.now()}`,
    label: typeof rule.label === 'string' && rule.label.trim() ? rule.label.trim() : '未命名规则',
    enabled: rule.enabled !== false,
    match,
    rootSelectors: toStringList(rule.rootSelectors, ['article', 'main', '[role="main"]', 'body']),
    titleSelectors: toStringList(rule.titleSelectors, ['h1']),
    contentSelectors: toStringList(rule.contentSelectors, ['h1', 'h2', 'h3', 'p', 'li', 'blockquote', 'pre', 'img']),
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

export function normalizeRules(inputRules) {
  const fromInput = Array.isArray(inputRules) ? inputRules : [];
  const normalized = fromInput.map(normalizeRule).filter(Boolean);
  return normalized.length ? normalized : clone(DEFAULT_SITE_RULES);
}

export function getDefaultRules() {
  return clone(DEFAULT_SITE_RULES);
}

export function ruleHostText(rule) {
  if (!rule?.match) return '';
  if (rule.match.hostEquals) return rule.match.hostEquals;
  if (rule.match.hostSuffix) return rule.match.hostSuffix;
  if (rule.match.hostRegex) return `/${rule.match.hostRegex}/`;
  return '';
}

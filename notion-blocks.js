const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const NOTION_CODE_LANGUAGES = new Set([
  'plain text',
  'abap',
  'arduino',
  'bash',
  'c',
  'c#',
  'c++',
  'clojure',
  'coffeescript',
  'css',
  'dart',
  'diff',
  'docker',
  'elixir',
  'elm',
  'erlang',
  'flow',
  'fortran',
  'f#',
  'gherkin',
  'glsl',
  'go',
  'graphql',
  'groovy',
  'haskell',
  'html',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'latex',
  'less',
  'lisp',
  'livescript',
  'lua',
  'makefile',
  'markdown',
  'markup',
  'matlab',
  'mermaid',
  'nix',
  'objective-c',
  'ocaml',
  'pascal',
  'perl',
  'php',
  'plain tex',
  'powershell',
  'prolog',
  'protobuf',
  'python',
  'r',
  'reason',
  'ruby',
  'rust',
  'sass',
  'scala',
  'scheme',
  'scss',
  'shell',
  'solidity',
  'sql',
  'swift',
  'toml',
  'typescript',
  'vb.net',
  'verilog',
  'vhdl',
  'visual basic',
  'webassembly',
  'xml',
  'yaml',
]);

export function normalizeLinkUrl(raw, baseHref = globalThis.location?.href || 'https://example.com/') {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const url = new URL(raw, baseHref);
    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function normalizeCodeLanguage(raw) {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
    .replaceAll('_', '-');
  if (!value) return 'plain text';
  if (value === 'text' || value === 'txt' || value === 'plaintext') return 'plain text';
  return value;
}

export function normalizeInlineSegments(content, segments, baseHref = globalThis.location?.href || 'https://example.com/') {
  const text = String(content || '');
  if (!Array.isArray(segments) || !segments.length) return [];
  const normalized = [];
  for (const segment of segments) {
    const rawText = typeof segment?.text === 'string' ? segment.text : '';
    if (!rawText) continue;
    if (segment?.type === 'link') {
      const href = normalizeLinkUrl(segment.href || '', baseHref);
      if (href) normalized.push({ type: 'link', text: rawText, href });
      else normalized.push({ type: 'text', text: rawText });
    } else {
      normalized.push({ type: 'text', text: rawText });
    }
  }
  if (!normalized.length) return [];
  const plain = normalized.map(item => item.text).join('');
  if (plain !== text) return [];
  return normalized;
}

export function splitTextForNotion(raw, chunkSize = 1800) {
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

export function splitCodeForNotion(raw, chunkSize = 1800) {
  const code = String(raw || '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
  if (!code.trim()) return [];
  if (code.length <= chunkSize) return [code];

  const chunks = [];
  let start = 0;
  while (start < code.length) {
    const maxEnd = Math.min(code.length, start + chunkSize);
    let end = maxEnd;
    if (maxEnd < code.length) {
      const breakAt = code.lastIndexOf('\n', maxEnd);
      if (breakAt > start + Math.floor(chunkSize * 0.35)) {
        end = breakAt;
      }
    }
    const part = code.slice(start, end).replace(/^\n+|\n+$/g, '');
    if (part) chunks.push(part);
    start = end;
  }
  return chunks;
}

export function splitSegmentsForNotion(segments, chunkSize = 1800, baseHref = globalThis.location?.href || 'https://example.com/') {
  const input = Array.isArray(segments) ? segments : [];
  if (!input.length) return [];
  const chunks = [];
  let current = [];
  let currentLen = 0;

  for (const segment of input) {
    let text = String(segment?.text || '');
    if (!text) continue;
    const type = segment?.type === 'link' && normalizeLinkUrl(segment?.href || '', baseHref) ? 'link' : 'text';
    const href = type === 'link' ? normalizeLinkUrl(segment.href, baseHref) : '';
    while (text.length) {
      const room = chunkSize - currentLen;
      if (room <= 0) {
        if (current.length) chunks.push(current);
        current = [];
        currentLen = 0;
        continue;
      }
      const piece = text.slice(0, room);
      text = text.slice(piece.length);
      current.push(type === 'link' ? { type, text: piece, href } : { type, text: piece });
      currentLen += piece.length;
      if (currentLen >= chunkSize) {
        chunks.push(current);
        current = [];
        currentLen = 0;
      }
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function toNotionCodeLanguage(raw) {
  const normalized = normalizeCodeLanguage(raw);
  if (normalized === 'js') return 'javascript';
  if (normalized === 'ts') return 'typescript';
  if (normalized === 'sh' || normalized === 'zsh') return 'shell';
  if (normalized === 'yml') return 'yaml';
  if (normalized === 'md') return 'markdown';
  if (normalized === 'rb') return 'ruby';
  if (normalized === 'py') return 'python';
  if (normalized === 'csharp' || normalized === 'cs') return 'c#';
  if (normalized === 'cpp' || normalized === 'cc' || normalized === 'cxx') return 'c++';
  if (normalized === 'objectivec' || normalized === 'objc') return 'objective-c';
  if (normalized === 'ps1') return 'powershell';
  return NOTION_CODE_LANGUAGES.has(normalized) ? normalized : 'plain text';
}

export function textBlockToNotion(blockType, content, segments = [], baseHref = globalThis.location?.href || 'https://example.com/') {
  const normalizedSegments = normalizeInlineSegments(content, segments, baseHref);
  const richTextChunks = normalizedSegments.length
    ? splitSegmentsForNotion(normalizedSegments, 1800, baseHref).map(chunk =>
        chunk.map(item => ({
          type: 'text',
          text: {
            content: item.text,
            ...(item.type === 'link' ? { link: { url: item.href } } : {}),
          },
        }))
      )
    : splitTextForNotion(content).map(part => [
        {
          type: 'text',
          text: {
            content: part,
          },
        },
      ]);
  if (!richTextChunks.length) return [];
  const blockName =
    blockType === 'h1' ? 'heading_1' : blockType === 'h2' ? 'heading_2' : blockType === 'h3' ? 'heading_3' : 'paragraph';

  return richTextChunks.map(richText => ({
    object: 'block',
    type: blockName,
    [blockName]: {
      rich_text: richText,
    },
  }));
}

export function listBlockToNotion(content, segments = [], listType = 'bulleted', baseHref = globalThis.location?.href || 'https://example.com/') {
  const normalizedSegments = normalizeInlineSegments(content, segments, baseHref);
  const richTextChunks = normalizedSegments.length
    ? splitSegmentsForNotion(normalizedSegments, 1800, baseHref).map(chunk =>
        chunk.map(item => ({
          type: 'text',
          text: {
            content: item.text,
            ...(item.type === 'link' ? { link: { url: item.href } } : {}),
          },
        }))
      )
    : splitTextForNotion(content).map(part => [
        {
          type: 'text',
          text: {
            content: part,
          },
        },
      ]);
  if (!richTextChunks.length) return [];
  const blockName = listType === 'numbered' ? 'numbered_list_item' : 'bulleted_list_item';
  return richTextChunks.map(richText => ({
    object: 'block',
    type: blockName,
    [blockName]: {
      rich_text: richText,
    },
  }));
}

export function codeBlockToNotion(content, language) {
  const parts = splitCodeForNotion(content);
  if (!parts.length) return [];
  const notionLanguage = toNotionCodeLanguage(language);
  return parts.map(part => ({
    object: 'block',
    type: 'code',
    code: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: part,
          },
        },
      ],
      language: notionLanguage,
    },
  }));
}

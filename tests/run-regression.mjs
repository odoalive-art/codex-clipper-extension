import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { extractPageContent } from '../extractor.js';
import { codeBlockToNotion, listBlockToNotion, textBlockToNotion } from '../notion-blocks.js';
import { getDefaultRules } from '../rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRules = getDefaultRules();

const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function withDom(html, url, run) {
  const dom = new JSDOM(html, {
    url,
    pretendToBeVisual: true,
  });

  dom.window.scrollTo = () => {};
  if (!('innerText' in dom.window.HTMLElement.prototype)) {
    Object.defineProperty(dom.window.HTMLElement.prototype, 'innerText', {
      get() {
        return this.textContent || '';
      },
      set(value) {
        this.textContent = String(value ?? '');
      },
      configurable: true,
    });
  }

  const prev = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    Element: globalThis.Element,
    Node: globalThis.Node,
    Event: globalThis.Event,
    HTMLImageElement: globalThis.HTMLImageElement,
  };

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.location = dom.window.location;
  globalThis.Element = dom.window.Element;
  globalThis.Node = dom.window.Node;
  globalThis.Event = dom.window.Event;
  globalThis.HTMLImageElement = dom.window.HTMLImageElement;

  try {
    return await run();
  } finally {
    dom.window.close();
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
}

async function runCase(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

async function loadFixture(name) {
  const fp = path.join(__dirname, 'fixtures', name);
  return readFile(fp, 'utf8');
}

await runCase('extractor/xiaobot/code-list-link', async () => {
  const html = await loadFixture('xiaobot-code-list-link.html');
  const payload = await withDom(html, 'https://foo.xiaobot.net/post/1', () =>
    extractPageContent({ rules: defaultRules, debug: true })
  );

  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  assert(blocks.length > 0, 'blocks should not be empty');

  const code = blocks.find(item => item.type === 'code');
  assert(code, 'code block not found');
  assert(!String(code.content || '').includes('复制代码'), 'code block contains copy-button text');
  assert(code.language === 'asciidoc', `expected code language asciidoc, got ${code.language}`);

  const paragraph = blocks.find(item => item.type === 'p' && String(item.content || '').includes('请查看'));
  assert(paragraph, 'paragraph with inline link not found');
  assert(Array.isArray(paragraph.segments) && paragraph.segments.some(seg => seg.type === 'link'), 'inline link segments missing');
  const linkSeg = paragraph.segments.find(seg => seg.type === 'link');
  assert(linkSeg.href === 'https://foo.xiaobot.net/repo', `unexpected link href: ${linkSeg.href}`);

  const listItems = blocks.filter(item => item.type === 'li');
  assert(listItems.length >= 3, `expected >=3 li blocks, got ${listItems.length}`);
  assert(listItems[0].listType === 'bulleted' && listItems[0].marker === '•', 'first li should be bulleted with marker •');
  assert(listItems.some(item => item.marker === 'b.' && item.listType === 'numbered'), 'expected alphabetic ordered marker b.');

  const duplicatedText = '用 git 管理代码修改版本';
  const duplicateHits = blocks.filter(item => typeof item.content === 'string' && item.content === duplicatedText);
  assert(duplicateHits.length === 1, `list content duplicated, got ${duplicateHits.length}`);
});

await runCase('extractor/fallback-generic', async () => {
  const html = await loadFixture('fallback-generic.html');
  const payload = await withDom(html, 'https://example.org/post/1', () =>
    extractPageContent({ rules: defaultRules, debug: true })
  );
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  assert(blocks.some(item => item.type === 'h1' && item.content === 'Fallback 标题'), 'fallback h1 missing');
  assert(blocks.some(item => item.type === 'p' && String(item.content || '').includes('Fallback 正文段落')), 'fallback paragraph missing');
  assert(blocks.some(item => item.type === 'img' && String(item.src || '').includes('image.jpg')), 'fallback image missing');
});

await runCase('extractor/wechat-basic', async () => {
  const html = await loadFixture('wechat-basic.html');
  const payload = await withDom(html, 'https://mp.weixin.qq.com/s/demo', () =>
    extractPageContent({ rules: defaultRules, debug: true })
  );
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  assert(payload?.debug?.matchedRuleId === 'wechat-mp', `expected wechat-mp rule, got ${payload?.debug?.matchedRuleId}`);
  assert(blocks.some(item => item.type === 'h1' && item.content === '公众号标题'), 'wechat title missing');
  assert(blocks.some(item => item.type === 'p' && String(item.content || '').includes('正文第一段')), 'wechat paragraph missing');
  assert(blocks.some(item => item.type === 'img' && String(item.src || '').includes('mmbiz.qpic.cn')), 'wechat image missing');
});

await runCase('extractor/xiaohongshu-note', async () => {
  const html = await loadFixture('xiaohongshu-note.html');
  const payload = await withDom(html, 'https://www.xiaohongshu.com/explore/66bbccddeeff001122334455', () =>
    extractPageContent({ rules: defaultRules, debug: true })
  );
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  assert(payload?.debug?.matchedRuleId === 'xiaohongshu-note', `expected xiaohongshu-note rule, got ${payload?.debug?.matchedRuleId}`);
  assert(blocks.some(item => item.type === 'h1' && item.content === '周末把书桌重新布置了一遍'), 'xiaohongshu title missing');
  assert(blocks.some(item => item.type === 'p' && String(item.content || '').includes('显示器抬高一点')), 'xiaohongshu paragraph missing');
  assert(blocks.some(item => item.type === 'p' && Array.isArray(item.segments) && item.segments.some(seg => seg.type === 'link')), 'xiaohongshu link segments missing');
  const images = blocks.filter(item => item.type === 'img');
  assert(images.length === 2, `expected 2 xiaohongshu images, got ${images.length}`);
  assert(images[0]?.src?.includes('note-cover-1.jpg'), `expected first image to be note-cover-1.jpg, got ${images[0]?.src}`);
  assert(images[1]?.src?.includes('note-cover-2.jpg'), `expected second image to be note-cover-2.jpg, got ${images[1]?.src}`);
  assert(!blocks.some(item => String(item.content || '').includes('评论区内容')), 'comment noise should be filtered');
  assert(!blocks.some(item => String(item.content || '').includes('相关推荐')), 'recommend noise should be filtered');
});

await runCase('notion-mapping/list-link-code', async () => {
  const listBlocks = listBlockToNotion('用 git 管理代码修改版本', [], 'bulleted');
  assert(Array.isArray(listBlocks) && listBlocks[0]?.type === 'bulleted_list_item', 'bulleted list mapping failed');

  const numberedBlocks = listBlockToNotion('第二条', [], 'numbered');
  assert(numberedBlocks[0]?.type === 'numbered_list_item', 'numbered list mapping failed');

  const textBlocks = textBlockToNotion(
    'p',
    '查看项目仓库',
    [
      { type: 'text', text: '查看' },
      { type: 'link', text: '项目仓库', href: 'https://github.com/example/repo' },
    ],
    'https://example.org/'
  );
  const richText = textBlocks[0]?.paragraph?.rich_text || [];
  const linkPart = richText.find(item => item?.text?.link?.url);
  assert(linkPart?.text?.link?.url === 'https://github.com/example/repo', 'rich_text link mapping failed');

  const codeBlocks = codeBlockToNotion('console.log(1);', 'js');
  assert(codeBlocks[0]?.code?.language === 'javascript', 'code language mapping failed');
});

const failed = results.filter(item => !item.ok);
results.forEach(item => {
  if (item.ok) console.log(`PASS  ${item.name}`);
  else console.log(`FAIL  ${item.name}\n      ${item.error}`);
});

if (failed.length) {
  process.exitCode = 1;
  console.error(`\n${failed.length} case(s) failed.`);
} else {
  console.log(`\nAll ${results.length} regression cases passed.`);
}

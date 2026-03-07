# Minimal Regression Cases

目标：用最小样例覆盖近期优化点，避免回归。
范围：`extractor.js` 抓取链路 + `sidepanel.js` 发送 Notion 映射。

## 执行方式
1. 打开目标文章页面，点击扩展图标进入 Side Panel。
2. 点击“开始净化”。
3. 观察预览区结果与调试信息（建议开启调试模式）。
4. 如该用例包含 Notion 验证，点击“发送到 Notion”并核对页面内容。

## Case 1: 代码块识别（小报童）
- Preconditions:
  - 页面包含 `pre > code`，且 `pre` 内有“复制代码”按钮。
- Steps:
  1. 抓取文章。
- Expected:
  - 预览区出现代码样式块（非普通段落）。
  - 代码内容不包含“复制代码”按钮文案。
  - 若 `code` class 含 `language-*`，语言标签显示对应值（未知值可回退）。

## Case 2: 列表项不重复（li + p 嵌套）
- Preconditions:
  - 页面存在结构：`<li><p>文本A</p></li>`。
- Steps:
  1. 抓取文章。
- Expected:
  - 预览中“文本A”只出现一次。
  - 列表项前有标记（例如 `•` 或 `1.`）。

## Case 3: 文本链接保留
- Preconditions:
  - 正文段落中包含 `a[href]` 行内链接。
- Steps:
  1. 抓取文章。
  2. 点击预览中的链接。
  3. 发送到 Notion。
- Expected:
  - 预览中链接可点击并新开标签。
  - Notion 中对应文本保留链接（不是纯文本）。

## Case 4: Notion 列表块映射
- Preconditions:
  - 抓取结果包含至少 1 个无序列表项、1 个有序列表项。
- Steps:
  1. 发送到 Notion。
- Expected:
  - 无序项在 Notion 中为 `bulleted_list_item`。
  - 有序项在 Notion 中为 `numbered_list_item`。
  - 不应出现仅以“• 文本”形式的普通 paragraph 代替列表。

## Case 5: Notion 标题去重
- Preconditions:
  - 抓取结果首块含 `h1`。
- Steps:
  1. 发送到 Notion。
- Expected:
  - 页面标题来自 `h1`。
  - 页面正文中不重复出现同一条首个 `h1`。

## Case 6: 回归防线（通用规则）
- Preconditions:
  - 任意非小报童/非公众号站点文章页。
- Steps:
  1. 抓取文章。
- Expected:
  - 仍可抓取基本文本/图片。
  - 不因新增 `code/link/list` 处理导致空结果或异常报错。

## 记录模板
- URL:
- 日期:
- Case:
- Result: pass / fail
- Notes:

# Project Architecture

## Directory Structure

- `manifest.json`：扩展入口与权限
- `sidepanel.html`：Side Panel 页面
- `sidepanel.js`：Side Panel 脚本主控层
- `icons.js`：本地 Lucide 风格 SVG 图标资源
- `background.js`：扩展后台脚本（配置点击图标打开 Side Panel）
- `rules.js`：规则定义与归一化模块
- `extractor.js`：注入页面执行的内容提取模块
- `notion-blocks.js`：Notion block 映射纯函数模块（文本/链接/列表/代码）
- `tests/run-regression.mjs`：最小自动回归脚本（Node + jsdom）
- `tests/fixtures/*`：回归用静态 HTML 样例
- `docs/`：协作与项目文档
  - `docs/regression-cases.md`：最小手动回归案例清单

## Modules

- Side Panel Controller (`sidepanel.js`)
  - 管理抓取按钮、复制按钮、规则编辑区域与调试面板
  - 管理导出按钮，生成 Notion 导入包（zip）
  - 管理 Notion 直连配置（Token、Parent Page），支持连接验证与可写页面自动发现
  - 调用 Notion API 创建页面/上传图片并写入 block
  - 发送 Notion 时对正文首个 `h1` 与页面标题做去重，避免标题重复
  - 发送 Notion 时支持将代码块写入 `code` block，并做语言映射兜底
  - 预览区代码块采用自动换行展示，取消横向滚动
  - 文本块支持链接分段渲染，并映射到 Notion `rich_text.link`
  - 列表项文本会在提取时补齐标记符号（`•`/数字/字母/罗马序号）
  - 列表项发送 Notion 时映射为 `bulleted_list_item` / `numbered_list_item`
  - 复用 `notion-blocks.js` 纯函数，保证运行逻辑与回归测试逻辑一致
  - 对公众号预览图片本地化与 Notion 上传采用限流并发，降低多图场景等待时间
  - 管理 Footer 结果态交互布局（抓取后显示复制、导出、发送 Notion）
  - 抓取前校验标签页 URL 协议，拦截不可注入页面（如 `chrome://`）
  - 提供悬浮调试入口，渲染本地虚拟 blocks 与 debug 数据用于 UI 调整
  - 通过 `icons.js` 注入本地 Lucide 风格图标，统一按钮与状态图标来源
  - 管理顶部状态芯片（抓取状态、提取块数）与按钮加载态反馈
  - 监听标签页激活/更新，实时刷新站点识别徽标（site badges）
  - 为预览图片提供单图复制（二进制剪贴板）交互
  - 读取/保存 `chrome.storage.local` 中的规则与调试开关
  - 通过 `chrome.scripting.executeScript` 调用页面内提取函数
- Background (`background.js`)
  - 设置 `openPanelOnActionClick`，点击扩展图标直接打开 Side Panel
- Rule Engine (`rules.js`)
  - 提供默认站点规则（小报童、微信公众号）
  - 对用户输入规则做合法化与兜底归一化
  - 提供规则匹配文本展示工具
- Extraction Engine (`extractor.js`)
  - 基于域名选择命中规则，未命中则回退通用规则
  - 根据选择器扫描候选节点并执行噪声过滤
  - 对 `pre > code` 代码块做专门文本提取，避免混入“复制代码”等按钮文案
  - 输出 `code` 类型 block（包含可选 language），供预览层与 Notion 映射使用
  - 输出文本 `segments`（普通文本 + 链接片段），用于预览与 Notion 保留链接
  - 对 `li` 自动生成列表前缀标记，避免列表结构被扁平化后丢失层次
  - 跳过 `li` 内部嵌套文本节点（如 `li > p`），避免同一列表项重复抓取
  - 去重文本与图片，控制最大块数与最大字符数
  - 输出结构化 blocks 和可选 debug 数据

## Data Flow

1. 用户点击扩展图标打开 Side Panel，并点击“开始净化”
2. `sidepanel.js` 读取当前激活标签页并注入 `extractPageContent`
3. `extractor.js` 在页面上下文中按规则提取 `{ blocks, debug }`
4. `sidepanel.js` 将 blocks 渲染为预览 DOM
5. 用户可选择复制内容，或逐图复制图片二进制
6. 用户可导出 `article.md + images/*` 的 zip 包并在 Notion 中 Import
7. 用户可直接发送到 Notion：创建子页面、写入文本块、上传图片并插入 `image.file_upload` 块

## External Dependencies

- Chrome Extension APIs
  - `chrome.tabs`
  - `chrome.scripting`
  - `chrome.storage.local`
  - `chrome.sidePanel`
- Manifest Host Permissions
  - `http://*/*`
  - `https://*/*`
- 无第三方 npm 依赖（当前为原生 JS 模块实现）
- Notion API（`/pages`、`/blocks/{id}/children`、`/file_uploads`）

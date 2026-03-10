# Project Architecture

## Directory Structure

- `manifest.json`：扩展入口与权限
- `sidepanel.html`：Side Panel 页面
- `sidepanel.js`：Side Panel 脚本主控层
- `settings.html`：扩展设置页（Options Page）UI
- `settings.js`：设置页脚本（规则管理/调试开关/Notion/Obsidian 配置）
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
  - 管理抓取按钮、复制按钮、导出按钮与发送 Notion/Obsidian 按钮
  - 作为“内容抓取工作台”负责抓取、预览、复制、导出与发送主链路
  - 提供“设置”入口并跳转独立设置页（`chrome.runtime.openOptionsPage`）
  - 文本块支持 `blockquote` 语义输出，预览/复制/Notion 写入保持引用结构
  - 管理导出按钮，生成 Notion 导入包（zip）
  - 支持 Obsidian URI 导入：构建 Markdown 后通过 `obsidian://new` 创建/覆盖笔记
  - Obsidian `Vault` 由设置页“选择本地库目录”自动同步；发送前先校验，缺失时直接提示并引导打开设置页
  - Obsidian Markdown frontmatter 仅写入 `source` 字段（按需求移除 `published`）
  - URI 模式在未设置目录时使用 `name` 参数，遵循 Obsidian 默认新建笔记位置
  - Obsidian 长文自动降级：复制全文到剪贴板 + 创建占位笔记提示手动粘贴
  - 支持 Obsidian 本地直写：直接写入 `Vault` 目录中的 markdown 与图片文件
  - 本地直写成功后会尝试通过 `obsidian://open` 自动打开对应笔记
  - 本地直写时图片命名为 `<笔记名>__<序号>`，统一存放于附件根目录并按相对路径回写 markdown 图片链接
  - 本地直写同名笔记永不覆盖，自动追加后缀另存（`(2)/(3)`）
  - 本地直写在未设置扩展目录时会优先读取 Obsidian 新建笔记目录规则（`newFileLocation/newFileFolderPath`）
  - 本地直写时优先读取 Obsidian `.obsidian/app.json` 的 `attachmentFolderPath`
  - 本地直写容错：图片落盘失败回退外链；整篇落盘失败自动回退 URI 发送
  - 本地直写权限获取由设置页完成（侧栏仅检查权限状态，失效时提示回设置页重授权）
  - Obsidian 失败反馈按错误类型分级，给出下一步动作、笔记目标路径与附件目录等定位信息
  - 侧栏内置 Obsidian 错误 toast，可直接跳转设置页处理配置/授权问题
  - 读取 Notion 直连配置（Token、写入目标 ID、目标类型）并执行写入
  - 调用 Notion API 创建页面/数据库记录、上传图片并写入 block
  - 媒体写入支持降级：视频 URL 写入 `embed`，图片上传失败回退为 `image.external`
  - 发送 Notion 时对正文首个 `h1` 与页面标题做去重，避免标题重复
  - 发送 Notion 时支持将代码块写入 `code` block，并做语言映射兜底
  - 预览区代码块采用自动换行展示，取消横向滚动
  - 文本块支持链接分段渲染，并映射到 Notion `rich_text.link`
  - 列表项文本会在提取时补齐标记符号（`•`/数字/字母/罗马序号）
  - 列表项发送 Notion 时映射为 `bulleted_list_item` / `numbered_list_item`
  - 复用 `notion-blocks.js` 纯函数，保证运行逻辑与回归测试逻辑一致
  - 对公众号预览图片本地化与 Notion 上传采用限流并发，降低多图场景等待时间
  - 管理 Footer 结果态交互布局（抓取后显示复制、导出、发送 Notion）
  - Footer 结果态采用“3 个圆形图标次级操作 + 1 个主文案发送按钮”的层级
  - 抓取前校验标签页 URL 协议，拦截不可注入页面（如 `chrome://`）
  - 通过 `icons.js` 注入本地 Lucide 风格图标，统一按钮与状态图标来源
  - 管理顶部状态芯片（抓取状态、提取块数）与按钮加载态反馈
  - 监听标签页激活/更新，实时刷新站点识别徽标（site badges）
  - 为预览图片提供单图复制（二进制剪贴板）交互
  - GIF 复制失败自动降级为链接复制，媒体卡片支持一键复制链接
  - 图片读取支持双通道：先走扩展上下文抓取，失败后回退到原页面上下文读取（用于防盗链图片）
  - 读取/保存 `chrome.storage.local` 中的规则与调试开关
  - 通过 `chrome.scripting.executeScript` 调用页面内提取函数
- Settings Controller (`settings.js`)
  - 承接站点标签管理（规则选择、编辑、新增、删除）
  - 管理调试开关（`debugMode`）并持久化到 `chrome.storage.local`
  - 管理 Obsidian 配置（Vault 自动同步、Folder 可选）并持久化到 `chrome.storage.local`
  - 管理 Obsidian 写入模式（URI/本地直写）与附件目录兜底配置
  - 支持绑定本地 Vault 目录并检测 Obsidian 附件目录规则
  - 可视化展示 Obsidian 依赖状态（Vault、目录授权、规则检测、URI 可用性）
  - 管理 Notion 配置（Token、目标类型、目标 ID）与保存动作
  - 支持 Notion 连接验证与可写目标自动发现（页面/数据库）
  - 支持按目标类型过滤下拉候选，并持久化最近选择与候选缓存
- Background (`background.js`)
  - 设置 `openPanelOnActionClick`，点击扩展图标直接打开 Side Panel
- Rule Engine (`rules.js`)
  - 提供默认站点规则（小报童、微信公众号、站酷、少数派）
  - 作为默认站点规则的唯一数据源，供 Side Panel、设置页与回归测试共用
  - 对用户输入规则做合法化与兜底归一化
  - 归一化时会自动并入缺失的内置规则，避免升级后新增站点标签缺失
  - 内置规则与本地同 ID 规则会做字段并集合并，保证新增 selector/属性可自动补齐
  - 提供规则匹配文本展示工具
- Extraction Engine (`extractor.js`)
  - 消费调用方传入的已归一化规则列表，未命中站点时回退通用规则
  - 基于域名选择命中规则，未命中则回退通用规则
  - 根据选择器扫描候选节点并执行噪声过滤
  - 标题提取优先按 `titleSelectors` 输出首个标题块，并通过去重避免重复标题
  - 对 `pre > code` 代码块做专门文本提取，避免混入“复制代码”等按钮文案
  - 支持将 `p` 中整段以 `>` 开头的文本识别为 `quote`，兼容非 `blockquote` 的站点实现
  - 支持提取 `video` 元素并输出为 `video` 链接块
  - 输出 `code` 类型 block（包含可选 language），供预览层与 Notion 映射使用
  - 输出文本 `segments`（普通文本 + 链接片段），用于预览与 Notion 保留链接
  - 对 `li` 自动生成列表前缀标记，避免列表结构被扁平化后丢失层次
  - 跳过 `li` 内部嵌套文本节点（如 `li > p`），避免同一列表项重复抓取
  - 去重文本与图片，控制最大块数与最大字符数
  - 输出结构化 blocks 和可选 debug 数据

## Data Flow

1. 用户点击扩展图标打开 Side Panel，并点击“开始净化”
2. `sidepanel.js` 读取当前激活标签页，将 `rules.js` 归一化后的规则一并传给 `extractPageContent`
3. `extractor.js` 在页面上下文中按传入规则提取 `{ blocks, debug }`
4. `sidepanel.js` 将 blocks 渲染为预览 DOM
5. 用户可选择复制内容，或逐图复制图片二进制
6. 用户可导出 `article.md + images/*` 的 zip 包并在 Notion 中 Import
7. 用户可发送到 Obsidian（URI 模式）：通过 `obsidian://new` 创建/覆盖笔记；超长内容降级为“占位笔记 + 剪贴板粘贴”
8. 用户可发送到 Obsidian（本地直写模式）：直接写入本地 Vault 的 markdown 与附件图片
9. 用户可直接发送到 Notion：按目标类型创建子页面或数据库记录，再写入文本块与 `image.file_upload` 块

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
- Obsidian URI（`obsidian://new`）
- Browser File System Access API（`showDirectoryPicker` / File System Handles）
- IndexedDB（持久化本地 Vault 目录句柄）
- Notion API（`/search`、`/pages`、`/databases/{id}`、`/data_sources/{id}`、`/blocks/{id}/children`、`/file_uploads`）

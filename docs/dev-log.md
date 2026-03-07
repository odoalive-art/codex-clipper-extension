# Development Log

记录每次开发的重要变更。

## Entry

Date:

Changes:

Files Modified:

Notes:

---

## Entries

### 2026-03-05 00:00 (Asia/Shanghai)
- Author: Codex
- Summary: 建立 AI 协作开发基础文档，并按当前仓库实现补全上下文/架构/待办。
- Changes:
  - 新增 `AGENTS.md`
  - 新增 `PROJECT_RULES.md`
  - 新增 `README.md`
  - 新增并更新 `docs/ai-context.md`
  - 新增并更新 `docs/architecture.md`
  - 新增并更新 `docs/todo.md`
  - 新增并更新 `docs/dev-log.md`
- Files Modified:
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 仅更新文档文件，未修改任何代码文件。

### 2026-03-05 16:43 (Asia/Shanghai)
- Author: Codex
- Summary: 完成会话收尾，补齐指令模板库与 Git 工作流文档，并更新交接信息。
- Changes:
  - 新增 `AI_COMMANDS.md`
  - 更新 `AGENTS.md`，增加 `执行【命令名称】` 的模板调用规则
  - 新增 `docs/git-workflow.md`
  - 更新 `docs/ai-context.md`，增加下一会话建议
  - 更新 `docs/todo.md`，同步已完成事项
  - 更新 `docs/dev-log.md`，追加会话记录
- Files Modified:
  - `AI_COMMANDS.md`
  - `AGENTS.md`
  - `docs/git-workflow.md`
  - `docs/ai-context.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 本轮为文档与协作流程增强，无代码逻辑改动。

### 2026-03-05 18:29 (Asia/Shanghai)
- Author: Codex
- Summary: 创建 UI 优化分支并升级弹窗界面状态反馈与视觉层级。
- Changes:
  - 创建分支 `codex/ui-optimization-popup`
  - 更新 `popup.html` 样式，增加顶部状态区（状态与块数）与滚动可读性优化
  - 更新 `popup.js`，接入抓取中/成功/失败/复制状态反馈与块数统计
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `popup.html`
  - `popup.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 尝试执行 `node --check popup.js`，当前环境缺少 `node` 命令，未完成自动语法校验。

### 2026-03-05 18:42 (Asia/Shanghai)
- Author: Codex
- Summary: 按新方向将扩展入口从 Popup 切换为 Side Panel。
- Changes:
  - 新增 `sidepanel.html` 与 `sidepanel.js`，迁移原有 UI 与抓取逻辑到 Side Panel
  - 更新 `manifest.json`，移除 `default_popup`，启用 `side_panel.default_path`
  - 新增 `background.js`，设置点击扩展图标自动打开 Side Panel
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `manifest.json`
  - `background.js`
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 原 `popup.html` / `popup.js` 仍保留，当前不再作为扩展入口。

### 2026-03-05 18:48 (Asia/Shanghai)
- Author: Codex
- Summary: 修复 Side Panel 抓取失败（缺少页面访问权限）。
- Changes:
  - 更新 `manifest.json`，增加 `host_permissions`：`http://*/*`、`https://*/*`
  - 更新 `sidepanel.js`，对权限错误给出明确提示（提示重载扩展）
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `manifest.json`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 需在 `chrome://extensions` 重新加载扩展后生效。

### 2026-03-05 18:53 (Asia/Shanghai)
- Author: Codex
- Summary: 登记 Side Panel 站点识别标签不随标签页切换更新的 bug。
- Changes:
  - 在 `docs/todo.md` 增加 bug 待办项（中优先级）
- Files Modified:
  - `docs/todo.md`
- Notes:
  - 现象：Side Panel 打开状态下切换网页，`site badges` 高亮未自动刷新。

### 2026-03-05 18:55 (Asia/Shanghai)
- Author: Codex
- Summary: 执行“结束会话”收尾，更新下一会话优先级。
- Changes:
  - 更新 `docs/ai-context.md`：状态改为 side panel 迁移中，并将 `site badges` 刷新 bug 提升为下一会话优先项
  - 复核 `docs/todo.md`：待办状态保持最新
  - 追加本条会话收尾记录
- Files Modified:
  - `docs/ai-context.md`
  - `docs/dev-log.md`
- Notes:
  - 当前分支：`codex/ui-optimization-popup`

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 修复图片复制回归并新增 Notion 导入包导出能力。
- Changes:
  - 修复 `sidepanel.js` 图片复制漏拷问题（适配 `preview-image-card` 结构）
  - 新增预览区“复制图片”按钮，支持单图二进制写入剪贴板
  - 新增“导出 Notion 包”按钮，导出 zip（`article.md + images/*`）
  - 在前端实现无依赖 zip 打包（store 模式）与下载
  - 更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - `node --check sidepanel.js` 语法检查通过。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 执行会话收尾，确认“图床方案”为后续最高优先级。
- Changes:
  - 更新 `docs/ai-context.md`：状态改为“Notion 体验待优化”，下一会话明确图床方案为首要任务
  - 更新 `docs/todo.md`：新增高优先级任务“图床上传并替换链接”
  - 追加本次收尾记录
- Files Modified:
  - `docs/ai-context.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 用户反馈：当前“本地导入/混合复制”能力可用但体验不佳，后续以图床路径为主。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 修复 Side Panel 在切换标签页后 `site badges` 高亮不刷新的问题。
- Changes:
  - 更新 `sidepanel.js`：`highlightCurrentSiteBadge` 每次刷新先清空旧高亮，再按当前激活标签页重算
  - 更新 `sidepanel.js`：新增 tab 事件监听（`onActivated`、`onUpdated`、`onRemoved`）与 `visibilitychange` 回补刷新
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 本地环境缺少 `node` 命令，未执行 `node --check sidepanel.js`。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 按模块化方案重整 Side Panel UI，优化整体框架与底部交互区。
- Changes:
  - 更新 `sidepanel.html`：Header 去除品牌，仅保留 `site badges + 状态 chips`
  - 更新 `sidepanel.html`：Footer 改为 `2+1` 布局（`重新抓取`、`复制 Markdown`、导出图标按钮 + hover 提示）
  - 更新 `sidepanel.html`：预览图片区按钮改为浮层样式，工具区视觉降级并限制输入/调试区域高度
  - 更新 `sidepanel.js`：抓取结果驱动 Footer `has-results` 状态，统一控制次级操作按钮显示
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 本地环境缺少 `node` 命令，未执行 `node --check sidepanel.js`。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 修复抓取 `chrome://` 页面时报错，改为前置拦截与友好提示。
- Changes:
  - 更新 `sidepanel.js`：新增 URL 协议校验，仅对 `http/https` 页面执行抓取注入
  - 更新 `sidepanel.js`：在异常分支兼容 `Cannot access a chrome:// URL`，统一提示切换到普通网页
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 本地环境缺少 `node` 命令，未执行 `node --check sidepanel.js`。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 新增悬浮调试模式按钮，支持注入虚拟内容与占位图用于 UI 调试。
- Changes:
  - 更新 `sidepanel.html`：新增悬浮 `调试模式` 按钮并放置在内容区右下方
  - 更新 `sidepanel.js`：新增本地虚拟 blocks、占位 SVG 图片和调试数据
  - 更新 `sidepanel.js`：点击悬浮按钮后直接渲染样例内容并激活底部操作区
  - 更新 `sidepanel.js`：新增 `normalizePreviewUrl`，允许 `data:` 图片在调试场景中渲染与复制
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 本地环境缺少 `node` 命令，未执行 `node --check sidepanel.js`。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 统一 Side Panel 图标来源，改为本地 Lucide 风格 SVG 集合。
- Changes:
  - 新增 `icons.js`：维护本地 Lucide 风格 SVG 图标资源
  - 更新 `sidepanel.js`：按钮图标从 `icons.js` 注入，业务逻辑不再内嵌图标模板
  - 更新 `sidepanel.html`：移除静态内联 SVG，统一由脚本注入按钮图标
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `icons.js`
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 未引入远程 CDN 或第三方依赖，保持扩展离线可用。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 按用户指定的 Lucide SVG 调整 Side Panel 按钮图标，并将下一步聚焦更新为公众号图片抓取问题。
- Changes:
  - 更新 `icons.js`：替换 `开始净化`、`重新抓取`、`复制`、`复制成功`、`复制失败`、`导出`、`调试模式` 的图标为用户指定版本
  - 更新 `sidepanel.js`：复制按钮初始图标切换为 `copy`
  - 更新 `docs/ai-context.md`：将下一步聚焦明确为公众号图片抓取问题
- Files Modified:
  - `icons.js`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/dev-log.md`
- Notes:
  - 本轮未执行自动化测试；当前环境缺少 `node`。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 将 UI 工作分支更名并清理旧远端分支。
- Changes:
  - 将当前分支从 `codex/ui-optimization-popup` 更名为 `codex/sidepanel-ui-tuning`
  - 提交并推送当前 UI 调整到 `origin/codex/sidepanel-ui-tuning`
  - 删除旧远端分支 `origin/codex/ui-optimization-popup`
- Files Modified:
  - `docs/dev-log.md`
- Notes:
  - 当前后续开发基线分支为 `codex/sidepanel-ui-tuning`。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 执行会话收尾，确认下一步转向公众号图片抓取问题。
- Changes:
  - 更新 `docs/ai-context.md`：当前状态明确为 UI 调整已落地，下一步聚焦公众号图片抓取与图片导入可靠性
  - 复核 `docs/todo.md`：任务状态保持最新，无需额外调整
  - 追加本条会话收尾记录
- Files Modified:
  - `docs/ai-context.md`
  - `docs/dev-log.md`
- Notes:
  - 下次启动建议从公众号图片抓取失败场景复现开始，先区分提取问题与图片读取问题。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 新增 Notion 直连剪藏能力，可从 Side Panel 直接创建页面并上传图片。
- Changes:
  - 更新 `sidepanel.html`：新增 `Notion 直连` 配置区（Token + Parent Page ID）与 `发送到 Notion` 按钮
  - 更新 `sidepanel.js`：新增 Notion 配置持久化、页面创建、块写入、图片上传（`file_uploads`）流程
  - 更新 `rules.js`：新增 Notion 配置相关 storage key
  - 更新 `icons.js`：新增 `send` 图标
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `rules.js`
  - `icons.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - Notion 直连依赖用户提供 Integration Token，并确保目标父页面已授权给该 Integration。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 简化 Notion 配置流程，新增连接验证与可写页面自动发现。
- Changes:
  - 更新 `sidepanel.html`：在 `Notion 直连` 区域增加 `验证连接`、`自动发现页面`、可写页面下拉选择与内联状态提示
  - 更新 `sidepanel.js`：新增 `users/me` 验证、`search` 自动发现页面、选择页面自动回填 Parent Page
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前仍为前端直连，Token 存储在 `chrome.storage.local`，后续可考虑改为后端托管或短时会话凭证。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 优化多图场景速度，降低公众号本地化与 Notion 发送等待时间。
- Changes:
  - 更新 `sidepanel.js`：新增通用并发工具 `mapWithConcurrency`
  - 更新 `sidepanel.js`：微信公众号图片本地化由串行改为并发（limit=4）
  - 更新 `sidepanel.js`：Notion 图片上传由串行改为限流并发（limit=3），并显示图片上传进度
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 并发优化保持原文块顺序，避免图片与段落错位。

### 2026-03-06 (Asia/Shanghai)
- Author: Codex
- Summary: 回滚 Notion 极速模式，恢复图文顺序优先的发送逻辑。
- Changes:
  - 更新 `sidepanel.html`：移除 `极速模式` 开关
  - 更新 `rules.js`：移除 `notionFastMode` 存储键
  - 更新 `sidepanel.js`：恢复按原块顺序写入 Notion（保留并发上传但不后台拆阶段）
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `rules.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 保留“并发上传”优化，不再启用“正文先写、图片后台追加”模式，避免图文乱序。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 优化抓取体验，修复小报童代码块漏抓与 Notion 标题重复。
- Changes:
  - 更新 `extractor.js`：小报童规则新增 `li`/`blockquote`/`pre` 提取，新增 `pre > code` 优先文本提取
  - 更新 `rules.js`：同步小报童默认规则，支持代码块与更多文本块
  - 更新 `sidepanel.js`：Notion 发送时跳过与页面标题重复的首个 `h1`，避免重复标题
  - 更新协作文档 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `extractor.js`
  - `rules.js`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 未引入新依赖；建议下一步补充 `extractor.js` 的回归测试样例覆盖该场景。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 代码块体验优化，打通预览样式与 Notion code block 写入。
- Changes:
  - 更新 `extractor.js`：`pre` 抽取改为输出 `type=code`，并识别可选语言
  - 更新 `sidepanel.html`：新增代码块样式（等宽字体/背景/语言标签/横向滚动）
  - 更新 `sidepanel.js`：预览渲染支持 `code`，收集/导出/复制链路支持代码块
  - 更新 `sidepanel.js`：发送 Notion 时将代码映射为 `code` block，并做语言白名单与兜底
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `extractor.js`
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 未引入新依赖；建议后续补充回归样例覆盖 `language-asciidoc` 等语言映射。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 调整预览代码块横向滚动条尺寸为 4px。
- Changes:
  - 更新 `sidepanel.html`：`.preview-code::-webkit-scrollbar` 高度调整为 `4px`
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 仅样式微调，不影响抓取与 Notion 写入逻辑。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 预览代码块取消横向滚动，改为自动换行。
- Changes:
  - 更新 `sidepanel.html`：`.preview-code` 调整为 `white-space: pre-wrap` + `overflow-wrap: anywhere` + `overflow-x: hidden`
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 该改动仅影响预览显示，不影响 Notion 发送结构。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 增加文本链接保留能力（预览与 Notion 同步）。
- Changes:
  - 更新 `extractor.js`：文本块新增 `segments` 输出（普通文本 + 链接片段）
  - 更新 `sidepanel.js`：预览渲染支持可点击链接；Notion 发送时写入 `rich_text.link`
  - 更新 `sidepanel.js`：复制/导出链路保留 Markdown/HTML 链接
  - 更新 `sidepanel.html`：新增预览链接样式
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `extractor.js`
  - `sidepanel.js`
  - `sidepanel.html`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前仅覆盖行内超链接（`a[href]`），复杂富文本样式后续可再扩展。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 增加列表标记符号保留（无序/有序/字母/罗马序号）。
- Changes:
  - 更新 `extractor.js`：对 `li` 自动补齐列表前缀（`•`、`1.`、`a.`、`i.` 等）
  - 更新 `extractor.js`：列表项去重改为按“带标记文本”判断，避免同文案条目被误去重
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `extractor.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 列表被提取为扁平文本时仍保留阅读顺序和层次提示。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 修复列表重复抓取，并改为 Notion 原生列表块写入。
- Changes:
  - 更新 `extractor.js`：列表项输出独立 `li` 类型与列表元信息（`listType`/`marker`）
  - 更新 `extractor.js`：跳过 `li` 内嵌文本节点（如 `li > p`），避免重复抓取
  - 更新 `sidepanel.js`：发送 Notion 时将 `li` 映射为 `bulleted_list_item`/`numbered_list_item`
  - 更新 `sidepanel.js`：预览/复制/导出链路支持 `li`，不再仅依赖“• 文本”段落
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `extractor.js`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 该修复同时解决“列表变纯符号段落”和“列表文本重复”两个问题。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 新增最小手动回归案例文档，覆盖近期优化点。
- Changes:
  - 新增 `docs/regression-cases.md`（代码块、列表去重、链接保留、Notion 列表映射、标题去重、通用回归）
  - 更新 `docs/ai-context.md`：下一会话建议引用回归案例文档
  - 更新 `docs/architecture.md`：补充回归案例文档索引
  - 更新 `docs/todo.md`：登记“最小手动回归案例文档”完成项
- Files Modified:
  - `docs/regression-cases.md`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前为手动回归基线，后续可逐步演进为自动化测试。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 建立最小自动回归测试（extractor + Notion 映射）。
- Changes:
  - 新增 `package.json` / `package-lock.json` 与 `jsdom` 测试依赖
  - 新增 `notion-blocks.js`，抽取 Notion 映射纯函数并在 `sidepanel.js` 复用
  - 新增 `tests/run-regression.mjs` 与 fixtures（小报童、公众号、通用回退）
  - 新增自动回归命令：`npm run test:regression`
  - 更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `package.json`
  - `package-lock.json`
  - `notion-blocks.js`
  - `sidepanel.js`
  - `tests/run-regression.mjs`
  - `tests/fixtures/xiaobot-code-list-link.html`
  - `tests/fixtures/wechat-basic.html`
  - `tests/fixtures/fallback-generic.html`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前自动回归已通过：4 个 case（extractor 3 + Notion 映射 1）。

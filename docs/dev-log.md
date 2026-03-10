# Development Log

记录每次开发的重要变更。

## Entry

Date:

Changes:

Files Modified:

Notes:

---

## Entries

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 基于真实页面反馈收敛小红书图文抓取，并完成验收收尾。
- Changes:
  - 更新 `extractor.js`，为小红书增加 `#detail-desc` 正文兜底提取
  - 更新 `extractor.js`，收窄标题识别，规避无标题帖子被“温馨提示”误识别
  - 更新 `extractor.js`，按 `swiper` 索引重排最终图片块，修复克隆 slide 导致的首图错乱
  - 更新 `tests/fixtures/xiaohongshu-note.html`，模拟 `#detail-desc + swiper-slide` 真实结构与克隆图场景
  - 更新 `tests/run-regression.mjs`，补充小红书图片顺序断言
  - 更新 `docs/ai-context.md`、`docs/todo.md`，同步验收状态与下一步重点
- Files Modified:
  - `extractor.js`
  - `tests/fixtures/xiaohongshu-note.html`
  - `tests/run-regression.mjs`
  - `docs/ai-context.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 用户已确认小红书图文抓取验收通过；回归命令 `npm run test:regression` 通过。

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 新增小红书图文抓取支持，并补齐最小回归样例与文档同步。
- Changes:
  - 更新 `rules.js`，新增小红书默认规则，覆盖标题、正文、多图、正文内链接与噪声过滤
  - 更新 `extractor.js`，将预滚动/图片等待扩展到小红书惰性加载场景，并补充装饰图过滤
  - 新增 `tests/fixtures/xiaohongshu-note.html`
  - 更新 `tests/run-regression.mjs`，增加小红书图文抓取回归用例
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `rules.js`
  - `extractor.js`
  - `tests/fixtures/xiaohongshu-note.html`
  - `tests/run-regression.mjs`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前实现以公开可访问的图文笔记为目标，未扩展到评论、商品卡与视频笔记深度适配。

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

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: Notion 直连新增数据库写入目标（页面/数据库二选一）。
- Changes:
  - 更新 `sidepanel.html`：Notion 配置区新增“写入目标类型”选择，并将“自动发现页面”升级为“自动发现目标”
  - 更新 `sidepanel.js`：自动发现合并页面与数据库结果，下拉选项区分 `[页面]`/`[数据库]`
  - 更新 `sidepanel.js`：发送 Notion 时按目标类型分流
    - 页面模式：沿用 page parent 创建子页面
    - 数据库模式：自动读取数据库标题属性并创建记录（兼容 `database_id` / `data_source_id`）
  - 更新 `rules.js`：新增 `notionWriteTargetType` 存储键
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
  - 本次先完成“数据库写入目标选择”；“重启后自动保留已选目标并免重复选择”下一步继续。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 优化 Notion 可写目标选择体验（按类型过滤 + 分类型记忆）。
- Changes:
  - 更新 `sidepanel.js`：可写目标下拉按当前“写入目标类型”过滤（页面模式仅显示页面，数据库模式仅显示数据库）
  - 更新 `sidepanel.js`：新增分类型最近选择持久化（`notionLastPageId`、`notionLastDataSourceId`）
  - 更新 `sidepanel.js`：切换写入类型时自动回填该类型最近目标，并同步更新输入框与本地存储
  - 更新 `rules.js`：新增上述两个存储键
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `rules.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 该优化与“重启后保留已选目标”目标一致，切换模式时无需重复查找目标。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 完成 Notion 目标选择重启恢复（免重复发现/选择）。
- Changes:
  - 更新 `sidepanel.js`：新增可写目标缓存恢复（`notionTargetCandidatesCache`）
  - 更新 `sidepanel.js`：新增最近目标名称持久化（`notionLastPageTitle`、`notionLastDataSourceTitle`）
  - 更新 `sidepanel.js`：启动时优先恢复缓存目标下拉；缓存缺失时显示“最近选择”占位项
  - 更新 `rules.js`：新增上述存储键
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `rules.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 重启插件后，若 Token/目标未变化，通常无需再次点击“自动发现目标”即可直接发送。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 新增站点标签可视化规则配置（替代纯 JSON 手改）。
- Changes:
  - 更新 `sidepanel.html`：规则配置区新增可视化编辑表单（规则选择、标签名、匹配类型与匹配值、核心选择器、启用开关）
  - 更新 `sidepanel.js`：新增规则可视化编辑逻辑（新增/保存/删除规则），并与 JSON 文本双向同步
  - 更新 `sidepanel.js`：支持点击顶部 `site badges` 直接载入对应规则到编辑器
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 可视化编辑优先覆盖常用字段，复杂字段仍可通过 JSON 直接维护。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 规则区进一步简化为“站点标签管理”模式。
- Changes:
  - 更新 `sidepanel.html`：移除匹配类型/匹配值/selectors 等底层字段输入，仅保留“标签 + 规则(JSON)”维护
  - 更新 `sidepanel.js`：规则编辑逻辑改为“单标签规则 JSON 编辑”，保存时自动归并并做结构校验
  - 更新 `sidepanel.js`：保留站点标签选择、新增、保存、删除，并支持点击顶部标签快速载入
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前不引入 DSL 与 AI 自动生成，规则模板仅作为文案参考，用户手动填写 JSON。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 增加站酷（ZCOOL）默认抓取规则。
- Changes:
  - 更新 `rules.js`：新增 `zcool.com.cn` 默认规则（root/content/exclude/image/text/limits）
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `rules.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 该规则按已验证场景配置，后续可根据真实页面样本继续微调选择器。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 修复站酷标签缺失并增强站酷抓取命中。
- Changes:
  - 更新 `rules.js`：`normalizeRules` 增加“缺失内置规则自动补齐”逻辑（保留用户自定义规则）
  - 更新 `rules.js`：站酷规则选择器改为贴合实际结构（`titleBox/contentTitle` + `sc-1n8zbuv-0` + `paragraph`）
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `rules.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 该修复可让已有本地规则配置用户也自动看到“站酷”标签，并提升正文抓取准确性。

### 2026-03-07 (Asia/Shanghai)
- Author: Codex
- Summary: 增强媒体处理：GIF 复制降级 + 视频链接支持。
- Changes:
  - 更新 `sidepanel.js`：单图复制失败时对 GIF 自动降级为“复制链接”
  - 更新 `sidepanel.js`：媒体卡片新增“复制链接”按钮
  - 更新 `sidepanel.js`：`video` 块在预览/复制/导出/Notion 发送中按链接处理
  - 更新 `extractor.js`：支持提取 `video` 元素（含 `source[src]`）为 `video` 块
  - 更新 `rules.js`：默认 `contentSelectors` 扩展包含 `video`
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `extractor.js`
  - `rules.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前视频以链接方式保留，不做二进制复制或上传。

### 2026-03-08 (Asia/Shanghai)
- Author: Codex
- Summary: 修复 Notion 直连媒体降级策略（避免仅文本链接）。
- Changes:
  - 更新 `sidepanel.js`：视频块发送 Notion 改为 `embed` block（不再写成纯文本）
  - 更新 `sidepanel.js`：图片上传失败时优先回退为 `image.external` block
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 在目标站点允许外链访问时，Notion 内会直接渲染嵌入；否则仍可能回退为链接文本。

### 2026-03-08 (Asia/Shanghai)
- Author: Codex
- Summary: 新增少数派（SSPAI）默认抓取规则。
- Changes:
  - 更新 `rules.js`：新增 `sspai.com` 默认规则（title/root/content/exclude/image/text/limits）
  - 更新 `extractor.js`：补充少数派兜底规则与 `SUPPORTED_SITES` 清单
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `rules.js`
  - `extractor.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 规则会通过内置补齐机制自动出现在已有用户配置中。

### 2026-03-08 (Asia/Shanghai)
- Author: Codex
- Summary: 修复少数派抓取细节并增强引用语义保留。
- Changes:
  - 更新 `rules.js` / `extractor.js`：少数派规则补强标题选择器与图片源属性（含 `srcset`/`data-original-src`）
  - 更新 `extractor.js`：`blockquote` 输出类型从普通段落升级为 `quote`
  - 更新 `sidepanel.js` / `notion-blocks.js`：预览、复制、导出、Notion 写入链路支持 `quote` 语义
  - 更新 `sidepanel.js`：图片预览增加 `referrerPolicy=no-referrer`，缓解部分外链防盗链场景
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `rules.js`
  - `extractor.js`
  - `sidepanel.js`
  - `notion-blocks.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - `blockquote::after` 这类伪元素样式不会被提取；改为保留引用语义块来稳定跨站表现。

### 2026-03-08 (Asia/Shanghai)
- Author: Codex
- Summary: 修复少数派文章图片与标题提取稳定性。
- Changes:
  - 更新 `sidepanel.js`：图片抓取改为双通道（扩展上下文直连失败时，回退到页面上下文读取）
  - 更新 `sidepanel.js`：记录最近抓取标签页信息，用于后续图片回退读取
  - 更新 `sidepanel.js`：单图复制复用统一图片抓取逻辑，兼容 `data:`/`blob:`
  - 更新 `rules.js` / `extractor.js`：少数派规则补充 `#article-title` 与更精确 root 选择器
  - 更新 `rules.js` / `extractor.js`：内置规则与同 ID 本地规则改为字段并集合并，避免旧配置缺失新字段
  - 更新 `extractor.js`：标题提取不再要求“必须在 root 外部”，统一先提取再去重
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `rules.js`
  - `extractor.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已本地验证少数派样例 `https://sspai.com/post/106372`：图片节点可提取（16 张），标题可提取为 `h1`。
  - 回归测试 `npm run test:regression` 全通过。

### 2026-03-08 (Asia/Shanghai)
- Author: Codex
- Summary: 增强引用识别，兼容少数派 `>` 段落写法。
- Changes:
  - 更新 `extractor.js`：新增“quote-like paragraph”识别，将整段以 `>` 开头的 `p` 转为 `quote`
  - 保持现有 `blockquote` 语义输出不变，与预览/复制/Notion 链路兼容
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `extractor.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 回归测试 `npm run test:regression` 全通过。

### 2026-03-08 (Asia/Shanghai)
- Author: Codex
- Summary: 调整 Footer 按钮层级与交互样式。
- Changes:
  - 更新 `sidepanel.html`：结果态下“重新抓取/复制 Markdown/导出 Notion 包”统一为圆形图标按钮
  - 更新 `sidepanel.html`：上述圆形按钮仅在 hover/focus 时于上方显示功能文案
  - 更新 `sidepanel.html`：`发送到 Notion` 改为结果态主文案按钮（保留图标 + 文案）
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - JS 逻辑无需改动，按钮状态更新函数可直接复用。

### 2026-03-08 (Asia/Shanghai)
- Author: Codex
- Summary: 会话收尾：撤销临时图标替换并完成交接文档更新。
- Changes:
  - 回退 `发送到 Notion` 的临时自定义图标，恢复默认 `send` 图标
  - 按“结束会话”更新 `docs/ai-context.md` 的状态、开发重点与下一会话建议
  - 追加本条会话收尾记录
- Files Modified:
  - `icons.js`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/dev-log.md`
- Notes:
  - 当前线程已完成少数派抓取修复、Footer 按钮层级调整与文档同步，可进入下一轮规则扩展/Notion 稳定性优化。

### 2026-03-08 17:29 (CST)
- Author: Codex
- Summary: 侧栏聚焦内容抓取，设置能力迁移到独立 Options Page。
- Changes:
  - 更新 `manifest.json`：新增 `options_ui`，注册独立设置页 `settings.html`
  - 更新 `sidepanel.html`：移除侧栏内规则/调试/Notion 配置区，仅保留抓取预览主流程并增加“设置”入口
  - 更新 `sidepanel.js`：新增打开设置页事件，补充按钮渲染空值保护
  - 新增 `settings.html` / `settings.js`：承接规则管理、调试开关、Notion 配置、连接验证与目标自动发现
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `manifest.json`
  - `sidepanel.html`
  - `sidepanel.js`
  - `settings.html`
  - `settings.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `npm run test:regression`，4/4 case 通过。

### 2026-03-09 10:31 (CST)
- Author: Codex
- Summary: 收敛默认站点规则定义，移除 `extractor.js` 内嵌默认规则。
- Changes:
  - 更新 `extractor.js`：删除内嵌默认站点规则，改为仅消费调用方传入规则并保留通用回退
  - 更新 `tests/run-regression.mjs`：回归测试改为显式注入 `rules.js` 的默认规则，确保测试与运行时同源
  - 更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`：同步记录规则单一来源与任务完成状态
- Files Modified:
  - `extractor.js`
  - `tests/run-regression.mjs`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 预期收益：新增或调整默认站点规则时，只需修改 `rules.js` 一处。

### 2026-03-09 20:47 (CST)
- Author: Codex
- Summary: 安装 Node/npm，整理当前改动并切出 Obsidian 方案分支。
- Changes:
  - 通过用户目录安装 `node v25.8.0` / `npm 11.11.0`，并写入 `~/.zprofile`
  - 执行 `npm run test:regression`，4/4 case 通过
  - 清理并停止跟踪 `.DS_Store`
  - 提交当前设置页迁移与默认规则去重改动：`c981099 feat: move settings to options page and dedupe default rules`
  - 新建分支 `codex/obsidian-send`
  - 与用户确认 Obsidian 集成约束：要求一键写入、图片本地化、标题作为文件名；同时明确浏览器插件单独无法实现“安装即用”的本地写入体验
  - 更新 `docs/ai-context.md`、`docs/todo.md`、`docs/dev-log.md`，将 Obsidian 方案评估列入下一会话优先项
- Files Modified:
  - `docs/ai-context.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 下一会话应先拍板 Obsidian 的最终集成形态：浏览器扩展 + Obsidian 插件，或浏览器扩展 + 本地桥接服务。

### 2026-03-09 22:10 (CST)
- Author: Codex
- Summary: 落地 Obsidian 第一阶段单篇导入（URI 方案），并将配置迁移到独立设置页。
- Changes:
  - 更新 `rules.js`：新增 Obsidian 存储键（`obsidianVault`、`obsidianFolder`）
  - 更新 `settings.html` / `settings.js`：新增 Obsidian 配置区（Vault、Folder）与保存逻辑
  - 更新 `sidepanel.html`：结果态 Footer 新增“发送到 Obsidian”图标按钮，并调整为 `4` 个次级图标按钮 + `1` 个 Notion 主按钮
  - 更新 `sidepanel.js`：新增 Obsidian 导入链路
    - 将当前预览块构建为 Markdown
    - 通过 `obsidian://new` 创建/覆盖目标笔记
    - URI 超长时自动降级为“复制全文 + 创建占位笔记”
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `rules.js`
  - `settings.html`
  - `settings.js`
  - `sidepanel.html`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js`、`node --check settings.js` 与 `npm run test:regression`，均通过。
  - 当前仍是 Obsidian URI 方案；本地目录直写与图片本地化为下一阶段。

### 2026-03-09 22:28 (CST)
- Author: Codex
- Summary: 按用户需求调整 Obsidian 导入内容结构（仅保留来源属性并修复标题重复）。
- Changes:
  - 更新 `sidepanel.js`：Obsidian Markdown frontmatter 改为仅写 `source`（移除 `published`）
  - 更新 `sidepanel.js`：Obsidian 导入时跳过与笔记标题同名的首个 `h1`，避免正文重复标题
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js` 与 `npm run test:regression`，均通过。

### 2026-03-09 23:05 (CST)
- Author: Codex
- Summary: 实现 Obsidian 本地直写模式，支持优先读取用户附件规则与“标题/序号”图片命名。
- Changes:
  - 新增 `obsidian-local.js`：封装本地目录句柄持久化（IndexedDB）、权限检测、文件写入、相对路径计算、附件规则读取
  - 更新 `rules.js`：新增 Obsidian 本地直写配置键（`obsidianWriteMode`、`obsidianAttachmentFolder`）
  - 更新 `settings.html` / `settings.js`：
    - 新增 Obsidian 写入模式（URI / 本地直写）
    - 新增附件目录兜底配置
    - 新增“选择本地库目录/清除授权”
    - 新增附件规则检测状态展示（优先使用 Obsidian 规则）
  - 更新 `sidepanel.js`：
    - 发送到 Obsidian 时按模式分流（URI 或本地直写）
    - 本地直写优先读取 `.obsidian/app.json` 的 `attachmentFolderPath`
    - 图片路径与命名改为 `<附件目录>/<标题>/<序号>.<ext>`
    - Markdown 图片链接按笔记目录计算相对路径
- Files Modified:
  - `obsidian-local.js`
  - `rules.js`
  - `settings.html`
  - `settings.js`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check settings.js`、`node --check sidepanel.js`、`node --check obsidian-local.js` 与 `npm run test:regression`，均通过。

### 2026-03-09 23:22 (CST)
- Author: Codex
- Summary: 修复 Obsidian 本地直写失败时的可用性问题，增强失败容错与回退策略。
- Changes:
  - 更新 `sidepanel.js`：本地直写时单张图片写入失败不再中断，改为保留远程外链
  - 更新 `sidepanel.js`：本地直写整体失败时自动回退 URI 发送，避免直接失败
  - 更新 `sidepanel.js`：状态提示补充回退原因与生效路径信息
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js` 与 `npm run test:regression`，均通过。

### 2026-03-09 23:36 (CST)
- Author: Codex
- Summary: 修正本地直写权限检查时机，避免侧栏发送阶段频繁回退 URI。
- Changes:
  - 更新 `sidepanel.js`：本地直写改为仅检查“已授权目录句柄”，不在发送阶段二次请求目录权限
  - 更新 `sidepanel.js`：若权限失效，明确提示回设置页重新选择目录授权
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js` 与 `npm run test:regression`，均通过。

### 2026-03-09 23:52 (CST)
- Author: Codex
- Summary: 修复本地直写图片链接解析问题，并记录本轮用户反馈待办后执行会话收尾。
- Changes:
  - 更新 `sidepanel.js`：本地直写图片链接改为 `![](<path>)`，避免路径含空格/中文时 Obsidian 解析截断
  - 更新 `docs/todo.md`：新增两项高优任务
    - Obsidian 本地直写失败反馈优化（可定位、可执行）
    - 重复导入冲突策略（避免误覆盖人工笔记）
  - 更新 `docs/ai-context.md`：同步当前重点与下一会话建议（反馈优化 + 冲突策略优先）
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 用户验证“本地写入与图片命名已生效”；当前剩余问题已登记为下一会话优先项。

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 优化 Obsidian 本地直写失败反馈，按错误类型给出可执行修复路径。
- Changes:
  - 更新 `sidepanel.js`：为 Obsidian 发送链路增加统一错误编码与分级反馈映射
  - 更新 `sidepanel.js`：未绑定目录、授权失效、URI 无法唤起、长文降级失败、本地落盘失败等场景改为输出具体下一步动作
  - 更新 `sidepanel.js`：本地落盘失败时在提示中附带笔记目标路径与附件目录，回退 URI 成功时保留明确原因说明
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js` 与 `npm run test:regression`，均通过。

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 收敛 Obsidian 配置约束并增强发送闭环（Vault 必填 + 本地写入后自动打开）。
- Changes:
  - 更新 `sidepanel.html`：新增 Obsidian 发送错误 toast（详情 + 一键打开设置）
  - 更新 `sidepanel.js`：
    - `obsidian://` 唤起改为优先 `chrome.tabs.create`，提升唤起稳定性
    - 增加 Vault 必填校验，缺失时阻断发送并给出可执行提示
    - URI 模式目录留空时改用 `name` 参数，遵循 Obsidian 默认新建笔记位置
    - 本地直写目录留空时读取 `.obsidian/app.json` 的新建笔记规则
    - 本地直写成功后调用 `obsidian://open` 自动打开刚写入笔记
  - 更新 `obsidian-local.js`：新增 Obsidian 新建笔记规则读取能力（`newFileLocation/newFileFolderPath`）
  - 更新 `settings.html` / `settings.js`：
    - Vault 标签改为必填
    - 新增 Obsidian 依赖状态面板（Vault、目录授权、规则检测、URI 可用性）
    - 保存 Obsidian 配置时加入 Vault 必填校验
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `sidepanel.html`
  - `sidepanel.js`
  - `obsidian-local.js`
  - `settings.html`
  - `settings.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js`、`node --check settings.js`、`node --check obsidian-local.js` 与 `npm run test:regression`，均通过。

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 按用户反馈简化 Obsidian 配置入口，Vault 改为目录选择自动同步。
- Changes:
  - 更新 `settings.html`：Vault 输入改为只读显示，提示通过“选择本地库目录”自动同步
  - 更新 `settings.js`：
    - 保存 Obsidian 配置时不再允许手填 Vault，必须先完成目录选择
    - 选择目录后自动同步 `obsidianVault`，清除授权时同步清空
    - 新增并完善 Obsidian 依赖状态面板刷新（Vault/授权/规则/URI）
  - 更新 `sidepanel.js`：Vault 缺失错误文案改为引导“先选择本地库目录”
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`
- Files Modified:
  - `settings.html`
  - `settings.js`
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check settings.js`、`node --check sidepanel.js` 与 `npm run test:regression`，均通过。

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 实现 Obsidian 同名笔记保护策略，禁止覆盖并自动后缀另存。
- Changes:
  - 更新 `obsidian-local.js`：新增唯一文件名解析工具 `resolveUniqueFilePath`，同名自动生成 ` (2)/(3)...` 后缀
  - 更新 `sidepanel.js`：本地直写前先解析唯一目标路径，不再覆盖任何同名 `.md`
  - 更新 `sidepanel.js`：同名另存时同步调整图片目录命名，避免覆盖历史附件
  - 更新 `sidepanel.js`：状态反馈新增“同名已另存副本”，并展示原目标与最终目标路径
  - 同步更新 `docs/todo.md` 与 `docs/dev-log.md`
- Files Modified:
  - `obsidian-local.js`
  - `sidepanel.js`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js`、`node --check obsidian-local.js` 与 `npm run test:regression`，均通过。

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 按用户要求切换附件策略为“统一目录 + 唯一文件名”，消除同名文件夹残留问题。
- Changes:
  - 更新 `sidepanel.js`：附件从“同名子目录”改为“附件根目录统一存放”
  - 更新 `sidepanel.js`：附件命名改为 `<笔记名>__<序号>.<ext>`，并在冲突时自动后缀避让
  - 更新 `sidepanel.js`：同名笔记另存时状态提示展示原目标与最终路径
  - 同步更新 `docs/ai-context.md`、`docs/architecture.md`、`docs/todo.md`、`docs/dev-log.md`
- Files Modified:
  - `sidepanel.js`
  - `docs/ai-context.md`
  - `docs/architecture.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 已执行 `node --check sidepanel.js` 与 `npm run test:regression`，均通过。

### 2026-03-10 (Asia/Shanghai)
- Author: Codex
- Summary: 执行会话收尾，同步当前阶段目标并准备提交推送。
- Changes:
  - 更新 `docs/ai-context.md`：移除已完成的“重复导入冲突策略”下一步，改为回归验证与稳定性项
  - 更新 `docs/todo.md`：将附件命名完成项更新为当前实现 `笔记名__序号` 规则
  - 复核本轮代码变更范围并准备 Git 提交
- Files Modified:
  - `docs/ai-context.md`
  - `docs/todo.md`
  - `docs/dev-log.md`
- Notes:
  - 当前终端环境缺少 `node/npm` 命令，无法在本地复跑语法检查与回归测试。

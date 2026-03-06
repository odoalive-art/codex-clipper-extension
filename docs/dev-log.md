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

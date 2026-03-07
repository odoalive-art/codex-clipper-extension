# AI Context

## Project Overview
该文件用于帮助 AI 在不同设备或会话中恢复项目上下文。

## Project Goal
构建一个 Chrome 扩展，从网页中提取正文与图片并净化为可复制的 Markdown 内容，支持通过规则按站点定制提取逻辑。

## Current Status
development (direct clip to Notion landed; next focus is Notion reliability and extractor regression tests)

## Current Features

列出当前已经实现的主要功能。

- 支持在 Side Panel 中抓取当前标签页内容并预览（点击扩展图标打开）
- 支持复制净化后的 Markdown（标题/段落/图片）到剪贴板
- 支持基于站点规则提取内容（当前内置小报童、微信公众号）
- 支持规则 JSON 可视化编辑、保存、重置与复制
- 支持调试模式，展示命中规则、候选数量、过滤统计等信息
- 支持针对微信公众号的惰性加载预滚动与图片等待策略
- Side Panel UI 已升级状态反馈：显示抓取状态与提取块数，并优化可读性与滚动视觉
- 已补充 `http/https` host 权限，保证 Side Panel 抓取可访问页面内容
- 支持预览区“逐张复制图片”（二进制写入剪贴板）以提升公众号图片可用性
- 支持导出 Notion 导入包（zip）：`article.md + images/*` 本地相对路径
- 支持 Notion 直连剪藏：Side Panel 内配置 Integration Token 与 Parent Page，直接创建页面并写入文字与图片
- 支持 Notion 连接辅助：可在 Side Panel 内验证连接并自动发现可写目标（页面/数据库），点选后自动填充 ID
- Notion 写入目标支持页面/数据库二选一；数据库模式会自动识别标题字段后创建记录
- 可写目标列表已按“写入目标类型”联动过滤（页面模式仅显示页面，数据库模式仅显示数据库）
- 已支持分类型记忆最近选择（页面/数据库各自记忆，上下切换自动回填）
- 插件重启后会恢复上次可写目标选择：缓存目标列表并保留最近目标名称，避免重复发现/重复选择
- 已优化多图性能：公众号图片本地化改为并发处理，Notion 图片上传改为限流并发并展示进度
- 已修复 Side Panel 打开后切换标签页时 `site badges` 高亮不刷新的问题（监听 tab 激活/更新）
- Side Panel UI 模块已重整：Header 去品牌、Footer 改为结果态多操作交互（重新抓取/复制 Markdown/导出/发送 Notion）
- 抓取前会拦截 `chrome://` 等不可注入页面，提示切换到普通网页（http/https）
- 新增悬浮 `调试模式` 按钮，可注入虚拟标题、正文与占位图，便于在任意页面调试 UI
- Side Panel 交互图标已统一到本地 `icons.js` 的 Lucide 风格 SVG 集合，避免混用零散图标
- 小报童规则已补充代码块提取（`pre`）与列表/引用提取，避免代码段漏抓
- Notion 直连已避免标题重复写入（页面标题与正文首个 `h1` 去重）
- 预览区已支持代码块样式渲染（等宽字体/背景/自动换行/语言标签）
- 发送至 Notion 时，代码块会写入 `code` block（自动语言映射，未知语言回退 plain text）
- 文本内超链接已支持保留：预览可点击，发送 Notion 时写入 `rich_text.link`
- 列表项已支持标记符号保留（如 `•`、`1.`、`a.`、`i.`），预览与 Notion 保持一致
- 已修复列表重复抓取（避免 `li` 与其内部 `p` 重复入库），并改为 Notion 原生列表块写入
- 已新增最小自动回归脚本：`npm run test:regression`（覆盖小报童/公众号/通用回退 + Notion 映射）

## Development Focus

当前开发重点。

1. 继续处理公众号图片抓取问题（抓取稳定性、图片可用性与后续导入路径）
2. 完善 Notion 直连流程（错误提示、配置体验、失败重试与批量稳定性；已修复标题重复，并支持数据库写入）
3. 补充回归测试与样例页面验证流程

## Next Session

下一会话建议按以下顺序继续：

1. 先执行 `执行【上下文同步】`，确认当前分支与任务边界
2. 按 `docs/regression-cases.md` 执行最小回归案例（重点 Case 2/3/4/5）
3. 用真实 Notion 直连验证“页面模式/数据库模式”写入行为（含标题字段自动识别）
4. 下一高优先级：增强 Notion 目标选择体验（可选“显示全部”、搜索过滤、分组计数）

## Key Files

记录关键文件或模块。

- `manifest.json`：Chrome 扩展清单与权限声明
- `sidepanel.html`：Side Panel UI 结构与样式
- `sidepanel.js`：Side Panel 交互、规则管理、抓取触发、复制/导出/Notion 直连逻辑
- `background.js`：配置点击扩展图标时打开 Side Panel
- `rules.js`：规则默认值、规范化、存储键与规则展示辅助
- `extractor.js`：核心提取逻辑（节点过滤、图片处理、调试统计、回退规则）
- `docs/regression-cases.md`：最小手动回归案例（代码块/链接/列表/Notion 映射）

# AI Context

## Project Overview
该文件用于帮助 AI 在不同设备或会话中恢复项目上下文。

## Project Goal
构建一个 Chrome 扩展，从网页中提取正文与图片并净化为可复制的 Markdown 内容，支持通过规则按站点定制提取逻辑。

## Current Status
development (image copy/import path available, but UX for Notion is still unsatisfactory)

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
- 已修复 Side Panel 打开后切换标签页时 `site badges` 高亮不刷新的问题（监听 tab 激活/更新）
- Side Panel UI 模块已重整：Header 去品牌、Footer 改为 `2+1` 交互（重新抓取/复制 Markdown/导出图标）
- 抓取前会拦截 `chrome://` 等不可注入页面，提示切换到普通网页（http/https）
- 新增悬浮 `调试模式` 按钮，可注入虚拟标题、正文与占位图，便于在任意页面调试 UI
- Side Panel 交互图标已统一到本地 `icons.js` 的 Lucide 风格 SVG 集合，避免混用零散图标

## Development Focus

当前开发重点。

1. 继续处理公众号图片抓取问题（抓取稳定性、图片可用性与后续导入路径）
2. 设计并落地图床上传方案（作为公众号图片进入 Notion 的主路径）
3. 补充回归测试与样例页面验证流程

## Next Session

下一会话建议按以下顺序继续：

1. 先执行 `执行【上下文同步】`，确认当前分支与任务边界
2. 优先继续公众号图片抓取问题：确认当前失败场景、定位是提取阶段还是图片读取阶段
3. 高优先级开始图床方案：确定上传目标（S3/兼容对象存储）、签名/鉴权方式、URL 替换策略
4. 开始高优先级任务：为 `extractor.js` 建立最小回归测试样例

## Key Files

记录关键文件或模块。

- `manifest.json`：Chrome 扩展清单与权限声明
- `sidepanel.html`：Side Panel UI 结构与样式
- `sidepanel.js`：Side Panel 交互、规则管理、抓取触发、复制逻辑
- `background.js`：配置点击扩展图标时打开 Side Panel
- `rules.js`：规则默认值、规范化、存储键与规则展示辅助
- `extractor.js`：核心提取逻辑（节点过滤、图片处理、调试统计、回退规则）

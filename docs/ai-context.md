# AI Context

## Project Overview
该文件用于帮助 AI 在不同设备或会话中恢复项目上下文。

## Project Goal
构建一个 Chrome 扩展，从网页中提取正文与图片并净化为可复制的 Markdown 内容，支持通过规则按站点定制提取逻辑。

## Current Status
development

## Current Features

列出当前已经实现的主要功能。

- 支持在弹窗中一键抓取当前标签页内容并预览
- 支持复制净化后的 Markdown（标题/段落/图片）到剪贴板
- 支持基于站点规则提取内容（当前内置小报童、微信公众号）
- 支持规则 JSON 可视化编辑、保存、重置与复制
- 支持调试模式，展示命中规则、候选数量、过滤统计等信息
- 支持针对微信公众号的惰性加载预滚动与图片等待策略

## Development Focus

当前开发重点。

1. 提升跨站点提取鲁棒性（更多站点规则与通用回退策略）
2. 补充回归测试与样例页面验证流程
3. 完善文档与 AI 交接流程，确保跨设备会话可恢复

## Next Session

下一会话建议按以下顺序继续：

1. 先执行 `执行【上下文同步】`，确认当前分支与任务边界
2. 开始高优先级任务：为 `extractor.js` 建立最小回归测试样例
3. 评估并实施 `extractor.js` / `rules.js` 规则配置去重方案

## Key Files

记录关键文件或模块。

- `manifest.json`：Chrome 扩展清单与权限声明
- `popup.html`：弹窗 UI 结构与样式
- `popup.js`：UI 交互、规则管理、抓取触发、复制逻辑
- `rules.js`：规则默认值、规范化、存储键与规则展示辅助
- `extractor.js`：核心提取逻辑（节点过滤、图片处理、调试统计、回退规则）

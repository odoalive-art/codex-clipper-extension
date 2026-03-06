# Development Tasks

## High Priority
高优先级。

- [ ] 设计并实现图床上传方案（公众号图片上传后替换链接，作为 Notion 主路径）
- [ ] 为 `extractor.js` 增加可重复执行的测试样例（至少覆盖小报童、公众号、通用回退）
- [ ] 抽取 `extractor.js` 与 `rules.js` 的重复规则定义，避免双份维护

## Medium Priority
中优先级。

- [ ] 在 `sidepanel.js` 增加规则 JSON 校验错误定位（指出具体字段）
- [ ] 增加更多站点规则模板与规则导入示例
- [ ] 优化“导出 Notion 包”交互（导出进度、失败图片提示、文件命名策略）

## Low Priority
低优先级。

- [ ] 优化 Side Panel 长文本预览性能（大文章渲染与滚动体验）
- [ ] 增强复制格式（可选是否保留图片）

## Completed
已完成。

- [x] 将扩展入口从 Popup 切换为 Side Panel（点击图标打开）
- [x] 修复 Side Panel 抓取权限问题（补充 host_permissions）
- [x] 优化弹窗 UI 状态反馈（抓取状态/块数可视化、按钮加载态与视觉层级）
- [x] 建立跨设备 AI 协作文档体系（`AGENTS.md`、`PROJECT_RULES.md`、`docs/*`）
- [x] 新版 `docs/ai-context.md` 模板切换为中文协作格式
- [x] 新增 `AI_COMMANDS.md`（AI 指令模板库）并定义 `执行【命令名称】` 调用约定
- [x] 在 `AGENTS.md` 增加命令触发规则，优先按 `AI_COMMANDS.md` 执行模板
- [x] 新增 `docs/git-workflow.md` 并加入 `执行【Git工作流】` 指令模板
- [x] 预览区支持逐张复制图片（二进制剪贴板）
- [x] 新增 Notion 导入包导出（zip: `article.md + images/*`）
- [x] 修复 Side Panel 打开后切换标签页时 `site badges` 不更新的问题
- [x] 重整 Side Panel UI 模块结构（Header 去品牌、Footer `2+1` 交互）
- [x] 抓取时拦截 `chrome://` 等不可注入页面并给出友好提示
- [x] 新增悬浮调试模式按钮，可填充虚拟文本与占位图用于 UI 调整
- [x] 统一 Side Panel 图标为本地 `icons.js` 中的 Lucide 风格 SVG 集合

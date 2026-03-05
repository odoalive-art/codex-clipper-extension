# Development Tasks

## High Priority
高优先级。

- [ ] 为 `extractor.js` 增加可重复执行的测试样例（至少覆盖小报童、公众号、通用回退）
- [ ] 抽取 `extractor.js` 与 `rules.js` 的重复规则定义，避免双份维护

## Medium Priority
中优先级。

- [ ] 在 `popup.js` 增加规则 JSON 校验错误定位（指出具体字段）
- [ ] 增加更多站点规则模板与规则导入示例

## Low Priority
低优先级。

- [ ] 优化弹窗长文本预览性能（大文章渲染与滚动体验）
- [ ] 增强复制格式（可选是否保留图片）

## Completed
已完成。

- [x] 建立跨设备 AI 协作文档体系（`AGENTS.md`、`PROJECT_RULES.md`、`docs/*`）
- [x] 新版 `docs/ai-context.md` 模板切换为中文协作格式
- [x] 新增 `AI_COMMANDS.md`（AI 指令模板库）并定义 `执行【命令名称】` 调用约定
- [x] 在 `AGENTS.md` 增加命令触发规则，优先按 `AI_COMMANDS.md` 执行模板
- [x] 新增 `docs/git-workflow.md` 并加入 `执行【Git工作流】` 指令模板

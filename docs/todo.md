# Development Tasks

## High Priority
高优先级。

- [ ] 完善 Notion 直连剪藏稳定性（图片上传重试、失败统计、token 安全存储）
- [x] 插件重启后保留已选 Notion 可写目标（页面/数据库，免重复选择）
- [x] 为 `extractor.js` 增加可重复执行的测试样例（至少覆盖小报童、公众号、通用回退）
- [x] 抽取 `extractor.js` 与 `rules.js` 的重复规则定义，避免双份维护

## Medium Priority
中优先级。

- [ ] 在 `sidepanel.js` 增加规则 JSON 校验错误定位（指出具体字段）
- [ ] 增加更多站点规则模板与规则导入示例
- [ ] 优化“导出 Notion 包”交互（导出进度、失败图片提示、文件命名策略）
- [ ] 在设置页优化 Notion 配置表单（默认走自动发现+下拉，`Parent Page ID / URL` 收起到高级入口）

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
- [x] 新增 Notion 直连剪藏（创建页面、写入文本、上传图片）
- [x] 多图场景性能优化（公众号图片本地化并发 + Notion 上传并发）
- [x] 修复 Side Panel 打开后切换标签页时 `site badges` 不更新的问题
- [x] 重整 Side Panel UI 模块结构（Header 去品牌、Footer `2+1` 交互）
- [x] 抓取时拦截 `chrome://` 等不可注入页面并给出友好提示
- [x] 新增悬浮调试模式按钮，可填充虚拟文本与占位图用于 UI 调整
- [x] 统一 Side Panel 图标为本地 `icons.js` 中的 Lucide 风格 SVG 集合
- [x] 修复小报童代码块漏抓（支持 `pre` 代码段提取并规避复制按钮文案污染）
- [x] 修复 Notion 直连标题重复（页面标题与正文首个 `h1` 去重）
- [x] 代码块体验优化（预览窗口代码样式 + Notion `code` block 写入与语言映射）
- [x] 代码块预览取消横向滚动（改为自动换行展示）
- [x] 文本链接保留（预览可点击 + Notion rich_text 链接写入）
- [x] 列表标记保留（`•`、`1.`、`a.`、`i.` 等）
- [x] 列表去重与 Notion 原生列表块（修复 `li`/`p` 重复 + 映射 list_item）
- [x] 新增最小手动回归案例文档（`docs/regression-cases.md`）
- [x] Notion 可写目标支持数据库选择（页面/数据库二选一写入）
- [x] Notion 可写目标按写入类型过滤展示，并分类型记忆最近选择
- [x] Notion 可写目标缓存恢复（重启后保留下拉候选与最近选择名称）
- [x] 新增站点标签可视化规则配置（新增/编辑/删除 + 与 JSON 同步）
- [x] 规则区简化为“站点标签管理”：仅保留标签名与规则 JSON 内容维护
- [x] 默认站点规则收敛到 `rules.js` 单一来源，`extractor.js` 改为消费外部传入规则
- [x] 补充默认站点规则：站酷（ZCOOL）
- [x] 内置规则自动补齐机制（已有本地规则时也可补齐新增站点标签）
- [x] GIF 复制失败自动降级为链接复制，并支持视频资源链接提取
- [x] Notion 媒体写入优化：视频改为 embed，图片上传失败回退 external image
- [x] 补充默认站点规则：少数派（SSPAI）
- [x] 引用块语义支持：`blockquote` 在预览/复制/Notion 保持为引用结构
- [x] 修复少数派兼容性：标题支持 `#article-title`，防盗链图片增加页面上下文抓取回退
- [x] 引用兼容增强：`p` 内以 `>` 开头的内容自动识别为引用块
- [x] Footer 按钮层级优化：3 个次级圆形图标按钮 + 发送到 Notion 主文案按钮
- [x] 少数派规则收敛：正文 root 优先定位 `.article_main__content.wangEditor-txt`
- [x] 侧栏聚焦抓取主流程：设置能力迁移到独立 Options Page（新增 `settings.html/settings.js`）

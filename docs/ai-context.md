# AI Context

## Project Overview
该文件用于帮助 AI 在不同设备或会话中恢复项目上下文。

## Project Goal
构建一个 Chrome 扩展，从网页中提取正文与图片并净化为可复制的 Markdown 内容，支持通过规则按站点定制提取逻辑。

## Current Status
development (side panel focused on content capture; settings migrated to dedicated options page; Notion page/database flow stable; Obsidian URI + local-write dual mode delivered)

## Current Features

列出当前已经实现的主要功能。

- 支持在 Side Panel 中抓取当前标签页内容并预览（点击扩展图标打开）
- Side Panel 已精简为“内容抓取工作台”：仅保留状态、预览、抓取/复制/导出/发送操作
- Side Panel 提供【设置】入口，点击后跳转独立设置页（Chrome Options Page）
- 支持复制净化后的 Markdown（标题/段落/图片）到剪贴板
- 支持基于站点规则提取内容（当前内置小报童、微信公众号、站酷、少数派）
- 已支持内置规则自动补齐：已有本地规则的用户也会自动获得新增内置站点标签（如站酷）
- 支持规则 JSON 可视化编辑、保存、重置与复制
- 支持“站点标签管理”模式：用户仅维护标签名称与该标签对应的规则 JSON 内容（增删改）
- 引用内容已按真实 `blockquote` 语义块处理（不依赖 CSS 伪元素）
- 已支持将以 `>` 开头的段落（如少数派常见引用写法）识别为引用块
- 支持调试模式，展示命中规则、候选数量、过滤统计等信息
- 支持针对微信公众号的惰性加载预滚动与图片等待策略
- Side Panel UI 已升级状态反馈：显示抓取状态与提取块数，并优化可读性与滚动视觉
- 已补充 `http/https` host 权限，保证 Side Panel 抓取可访问页面内容
- 支持预览区“逐张复制图片”（二进制写入剪贴板）以提升公众号图片可用性
- GIF 单图复制失败时会自动降级为“复制链接”，并支持预览区一键复制媒体链接
- 支持提取 `video` 资源为链接块（预览/复制/导出/Notion 发送均保留视频链接）
- 发送 Notion 时：视频链接会写入 `embed` block；图片上传失败会回退为 `image.external`
- 独立设置页支持规则管理、调试开关、Notion Token 与写入目标配置（复用原 `chrome.storage.local`）
- 独立设置页支持 Obsidian 导入配置（Vault、Folder）并持久化到 `chrome.storage.local`
- Obsidian 的 Vault 不再手填，改为通过“选择本地库目录”自动同步；发送前仍会做必填校验
- Obsidian 新增写入模式切换：URI 直连 / 本地直写
- 本地直写模式支持选择并授权 Vault 本地目录（IndexedDB 持久化目录句柄）
- 本地直写时优先读取 Obsidian `.obsidian/app.json` 的附件目录规则；未命中时回退扩展配置
- 本地直写图片命名规则：`<附件目录>/<笔记名>__<序号>.<ext>`（例如 `Assets/文章标题__001.jpg`）
- 本地直写同名保护：禁止覆盖任何同名笔记，自动另存为 `标题 (2).md`、`标题 (3).md` 等后缀文件
- 本地直写新增容错：单张图片失败时保留外链不中断整篇；整篇本地写入失败时自动回退 URI 模式
- 本地直写权限策略：侧栏发送前仅检查已授权句柄；若失效需回到设置页重新选择目录授权
- Obsidian 失败反馈已按错误类型分级：未绑定目录、授权失效、URI 无法唤起、本地落盘失败都会给出下一步指引与关键路径
- 侧栏已新增 Obsidian 错误 toast（含一键打开设置），不再只依赖设置页深层状态文案
- 设置页已新增 Obsidian 依赖状态面板（Vault、目录授权、规则检测、URI 可用性）便于集中排障
- 图片抓取支持“页面上下文回退”：当扩展上下文直连被防盗链拦截（如少数派 CDN 403）时，自动回退到原页面上下文读取
- 支持导出 Notion 导入包（zip）：`article.md + images/*` 本地相对路径
- 支持 Notion 直连剪藏：Side Panel 内配置 Integration Token 与 Parent Page，直接创建页面并写入文字与图片
- 支持 Notion 连接辅助：可在 Side Panel 内验证连接并自动发现可写目标（页面/数据库），点选后自动填充 ID
- Notion 写入目标支持页面/数据库二选一；数据库模式会自动识别标题字段后创建记录
- 可写目标列表已按“写入目标类型”联动过滤（页面模式仅显示页面，数据库模式仅显示数据库）
- 已支持分类型记忆最近选择（页面/数据库各自记忆，上下切换自动回填）
- 插件重启后会恢复上次可写目标选择：缓存目标列表并保留最近目标名称，避免重复发现/重复选择
- 支持一键发送到 Obsidian（`obsidian://new`）：笔记名默认取正文首个 `h1`，可指定 Vault/Folder
- URI 模式未填写目录时会遵循 Obsidian 默认新建笔记位置（扩展不再强制默认目录）
- 当 Obsidian URI 超长时，自动降级为“复制全文到剪贴板 + 创建占位笔记”流程
- 本地直写成功后会自动唤起 Obsidian 并尝试打开刚写入的目标笔记
- Obsidian 导入生成的 frontmatter 现仅保留 `source`（不再写入 `published`）
- 已优化多图性能：公众号图片本地化改为并发处理，Notion 图片上传改为限流并发并展示进度
- 已修复 Side Panel 打开后切换标签页时 `site badges` 高亮不刷新的问题（监听 tab 激活/更新）
- Side Panel UI 模块已重整：Header 去品牌、Footer 改为结果态多操作交互（重新抓取/复制 Markdown/导出/发送 Notion）
- Footer 结果态按钮层级已调整：重新抓取/复制 Markdown/导出 Notion 包统一为圆形图标按钮（hover 显示文案），发送到 Notion 保持主文案按钮
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
- 已修复少数派标题提取：支持 `#article-title`，并允许标题位于内容 root 内部
- 已新增最小自动回归脚本：`npm run test:regression`（覆盖小报童/公众号/通用回退 + Notion 映射）

## Development Focus

当前开发重点。

1. 完善 Notion 直连稳定性（上传重试、失败统计、token 安全存储）
2. 补一组 Obsidian 本地直写专项回归（权限失效、重名、多图、长文）
3. 在设置页补充规则 JSON 校验错误定位，降低自定义规则维护成本
4. 补充 Obsidian 写入链路的端到端验收清单（目录授权、URI 唤起、附件命名）

## Next Session

下一会话建议按以下顺序继续：

1. 先执行 `执行【上下文同步】`，确认当前分支与任务边界
2. 补一组 Obsidian 本地直写回归/手测清单（权限失效、重名、多图、长文）
3. 处理 Notion 上传稳定性（重试、失败统计、token 存储安全）
4. 实现设置页规则 JSON 校验错误定位（字段级提示）

## Key Files

记录关键文件或模块。

- `manifest.json`：Chrome 扩展清单与权限声明
- `sidepanel.html`：Side Panel UI 结构与样式
- `sidepanel.js`：Side Panel 抓取与预览主控（抓取、复制、导出、发送 Notion/Obsidian、打开设置页）
- `settings.html`：独立设置页（Options Page）UI
- `settings.js`：设置页交互与持久化逻辑（规则管理、调试开关、Notion/Obsidian 配置）
- `background.js`：配置点击扩展图标时打开 Side Panel
- `rules.js`：默认站点规则唯一数据源、规则规范化、存储键与规则展示辅助
- `extractor.js`：核心提取逻辑（节点过滤、图片处理、调试统计、消费外部传入规则并保留通用回退）
- `docs/todo.md`：当前已新增 Obsidian 方案评估与实现待办
- `docs/regression-cases.md`：最小手动回归案例（代码块/链接/列表/Notion 映射）

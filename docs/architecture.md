# Project Architecture

## Directory Structure

- `manifest.json`：扩展入口与权限
- `sidepanel.html`：Side Panel 页面
- `sidepanel.js`：Side Panel 脚本主控层
- `icons.js`：本地 Lucide 风格 SVG 图标资源
- `background.js`：扩展后台脚本（配置点击图标打开 Side Panel）
- `rules.js`：规则定义与归一化模块
- `extractor.js`：注入页面执行的内容提取模块
- `docs/`：协作与项目文档

## Modules

- Side Panel Controller (`sidepanel.js`)
  - 管理抓取按钮、复制按钮、规则编辑区域与调试面板
  - 管理导出按钮，生成 Notion 导入包（zip）
  - 管理 Footer `2+1` 交互布局状态（抓取后显示复制与导出图标按钮）
  - 抓取前校验标签页 URL 协议，拦截不可注入页面（如 `chrome://`）
  - 提供悬浮调试入口，渲染本地虚拟 blocks 与 debug 数据用于 UI 调整
  - 通过 `icons.js` 注入本地 Lucide 风格图标，统一按钮与状态图标来源
  - 管理顶部状态芯片（抓取状态、提取块数）与按钮加载态反馈
  - 监听标签页激活/更新，实时刷新站点识别徽标（site badges）
  - 为预览图片提供单图复制（二进制剪贴板）交互
  - 读取/保存 `chrome.storage.local` 中的规则与调试开关
  - 通过 `chrome.scripting.executeScript` 调用页面内提取函数
- Background (`background.js`)
  - 设置 `openPanelOnActionClick`，点击扩展图标直接打开 Side Panel
- Rule Engine (`rules.js`)
  - 提供默认站点规则（小报童、微信公众号）
  - 对用户输入规则做合法化与兜底归一化
  - 提供规则匹配文本展示工具
- Extraction Engine (`extractor.js`)
  - 基于域名选择命中规则，未命中则回退通用规则
  - 根据选择器扫描候选节点并执行噪声过滤
  - 去重文本与图片，控制最大块数与最大字符数
  - 输出结构化 blocks 和可选 debug 数据

## Data Flow

1. 用户点击扩展图标打开 Side Panel，并点击“开始净化”
2. `sidepanel.js` 读取当前激活标签页并注入 `extractPageContent`
3. `extractor.js` 在页面上下文中按规则提取 `{ blocks, debug }`
4. `sidepanel.js` 将 blocks 渲染为预览 DOM
5. 用户可选择复制内容，或逐图复制图片二进制
6. 用户可导出 `article.md + images/*` 的 zip 包并在 Notion 中 Import

## External Dependencies

- Chrome Extension APIs
  - `chrome.tabs`
  - `chrome.scripting`
  - `chrome.storage.local`
  - `chrome.sidePanel`
- Manifest Host Permissions
  - `http://*/*`
  - `https://*/*`
- 无第三方 npm 依赖（当前为原生 JS 模块实现）

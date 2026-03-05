# Project Architecture

## Directory Structure

- `manifest.json`：扩展入口与权限
- `popup.html`：弹窗页面
- `popup.js`：弹窗脚本主控层
- `rules.js`：规则定义与归一化模块
- `extractor.js`：注入页面执行的内容提取模块
- `docs/`：协作与项目文档

## Modules

- Popup Controller (`popup.js`)
  - 管理抓取按钮、复制按钮、规则编辑区域与调试面板
  - 读取/保存 `chrome.storage.local` 中的规则与调试开关
  - 通过 `chrome.scripting.executeScript` 调用页面内提取函数
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

1. 用户在扩展弹窗点击“开始净化”
2. `popup.js` 读取当前激活标签页并注入 `extractPageContent`
3. `extractor.js` 在页面上下文中按规则提取 `{ blocks, debug }`
4. `popup.js` 将 blocks 渲染为预览 DOM
5. 用户点击复制后转换为 Markdown 写入剪贴板

## External Dependencies

- Chrome Extension APIs
  - `chrome.tabs`
  - `chrome.scripting`
  - `chrome.storage.local`
- 无第三方 npm 依赖（当前为原生 JS 模块实现）

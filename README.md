# 静页 · STILLPAGE

一个本地运行、无网络依赖的 Chrome 新标签页扩展。基于 React、TypeScript、Vite 与 Manifest V3。

## 已完成（Phase 0–1）

- Manifest V3 与 `chrome_url_overrides.newtab`
- 本地内置背景、全屏氛围层与响应式构图
- 品牌、时间、日期、Hero 文案、搜索框静态视觉
- Today 3 静态布局、快捷 Dock、专注预览、设置入口
- 1440×900、1920×1080、1366×768 的适配与 reduced-motion 样式
- 搜索与网址直达（Google / Bing / DuckDuckGo 可选）
- 任务勾选、添加与本地保存
- 快捷链接跳转与新增入口
- 快捷链接 Hover 操作菜单、编辑、删除确认与本地持久化
- 设置面板、背景亮度与布局开关
- 可切换浅色 / 深色文字，并单独调节文字不透明度
- 25 分钟专注计时器（开始 / 暂停）
- 独立的 Schedule：Daily / Weekly Agenda、日历侧栏、日程新增/编辑/删除
- 本地时区日期处理与 `chrome.storage.local` 持久化（本地预览自动回退至 `localStorage`）

## 尚未实现

命令面板、每日任务自动 rollover、便签、完整专注模式、Zen Mode、背景上传、日程提醒/重复规则，以及外部日历同步仍未实现。

## 本地存储结构

生产扩展通过 `chrome.storage.local` 保存以下数据（开发预览使用浏览器 `localStorage` 回退）：

- `stillpage.quickLinks`: `QuickLink[]`，每项包括 `id`、`title`、`url`、`icon?`、`order`
- `stillpage.schedules`: `ScheduleItem[]`，每项包括 `id`、`title`、`date`、`startTime?`、`endTime?`、`allDay`、`notes?`、`createdAt`、`updatedAt`
- `stillpage.settings`: 外观、搜索、布局与 `schedule.viewMode` 偏好
- `stillpage.tasks`: Today 3 的本地任务

## 开发与构建

要求 Node.js 18 或更新版本：

```bash
npm install
npm run dev
npm run build
```

构建完成后，Chrome 要加载的是 `dist/` 目录，而不是项目根目录。

## 在 Chrome 导入（加载已解压的扩展程序）

1. 在本项目根目录运行 `npm install`，再运行 `npm run build`。
2. 在 Chrome 地址栏输入 `chrome://extensions` 并打开。
3. 打开右上角的“开发者模式”。
4. 点击左上角“加载已解压的扩展程序”。
5. 选择本项目里的 `dist` 文件夹。
6. 新建一个标签页，应该就会显示静页 · STILLPAGE 页面。

若修改了源代码，重新运行 `npm run build` 后，回到 `chrome://extensions` 点击该扩展的刷新按钮，再新建标签页即可看到变化。

## 隐私与权限

页面资源完全在本地加载；任务、链接和设置仅保存在浏览器本地。扩展仅声明 `storage` 权限，不发送网络请求；点击快捷链接或搜索时才会打开对应网站。

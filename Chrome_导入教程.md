# 在 Google Chrome 导入静页 · STILLPAGE（中文教程）

静页 · STILLPAGE 是“已解压的扩展程序”，不需要上传到 Chrome 应用商店，也不需要登录账号。

## 直接导入已构建版本

当前交付已包含可直接导入的 `dist` 文件夹。请按下面操作：

1. 打开 Google Chrome。
2. 在地址栏粘贴并打开 `chrome://extensions`。
3. 打开页面右上角的“开发者模式”。
4. 点击左上角“加载已解压的扩展程序”。
5. 选择本项目中的 `dist` 文件夹：

   ```text
   STILLPAGE/dist
   ```

6. Chrome 显示“静页 · STILLPAGE”扩展卡片后，新建一个标签页，即可看到新的新标签页页面。

## 如果修改过源码

在 STILLPAGE 项目根目录执行：

```bash
npm install
npm run build
```

然后回到 `chrome://extensions`，点击静页 · STILLPAGE 卡片上的刷新图标，再新建一个标签页查看更新。

## 常见问题

### 找不到“加载已解压的扩展程序”

先确认 `chrome://extensions` 页面右上角的“开发者模式”已经开启。

### 选文件夹时加载失败

必须选择 `dist` 文件夹；该文件夹内应直接包含 `manifest.json`，不要选择它的上一级文件夹，也不要选择压缩包。

### 新标签页没有变化

确认扩展卡片处于已启用状态；关闭原有新标签页后，再打开一个全新的标签页。若仍未变化，点击扩展卡片的刷新图标。

### 想停用或移除

在 `chrome://extensions` 找到静页 · STILLPAGE，关闭开关即可暂时停用；点击“移除”可彻底移除扩展。

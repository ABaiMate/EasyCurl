# EasyCurl

[English](./README.md) | [简体中文](./README.zh-CN.md)

EasyCurl 是一个轻量级 Chrome/Edge 扩展，可以把复制来的 `curl` 命令转换成可编辑的 API 请求。它适合临时调试接口时使用：导入 curl，修改 Headers、Query、Body，发送请求，查看响应，再复制结果。

<img width="1280" height="860" alt="image" src="https://github.com/user-attachments/assets/a35b73fd-b16b-4d58-ad9a-195fa7569655" />


## 为什么做 EasyCurl

Apifox、Postman 和各种 API 文档工具都很强，但当你只是想快速重放一个请求时，它们有时会显得太重。EasyCurl 把流程压到最短：

1. 复制一段 `curl` 命令。
2. 用 `Ctrl+E` 或工具栏图标打开 EasyCurl。
3. 点击 `Import curl`。
4. 从剪贴板读取，或手动粘贴 curl。
5. 修改请求并点击 `Send`。

不需要账号，不需要云同步，也不需要先创建工作区。

## 功能

- 将常见 `curl` 命令导入为可编辑请求。
- 编辑 Method、URL、Query、Headers、Body 和 Basic Auth。
- Headers 和 Query 使用表格式编辑器。
- 直接从扩展中发送 HTTP/HTTPS 请求。
- 查看状态码、耗时、响应头和响应体。
- 格式化 JSON 请求体。
- 将当前请求复制为 curl。
- 复制响应体，或复制完整请求/响应报告。
- 本地请求历史，默认脱敏敏感字段。
- 以独立大窗口打开，避免浏览器工具栏小弹窗空间不足。

## 隐私

EasyCurl 是本地优先的调试工具。

- 请求历史保存在浏览器本地。
- 默认会脱敏 `Authorization`、`Cookie`、`Set-Cookie`、`X-API-Key` 和 Basic Auth 密码。
- 只有勾选 `Save sensitive values in history` 时，才会保存敏感值。
- EasyCurl 不需要账号。
- EasyCurl 不提供云同步。

完整隐私说明见 [PRIVACY.zh-CN.md](./PRIVACY.zh-CN.md)。英文版见 [PRIVACY.md](./PRIVACY.md)。

## 本地安装

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启 `Developer mode / 开发者模式`。
3. 点击 `Load unpacked / 加载已解压的扩展程序`。
4. 选择本仓库里的 `extension/` 文件夹。
5. 如需快速打开，可以把 EasyCurl 固定到浏览器工具栏。

## 快捷键

扩展默认建议使用 `Ctrl+E` 打开 EasyCurl。如果 Chrome/Edge 拦截或覆盖了这个快捷键，打开：

```text
chrome://extensions/shortcuts
```

然后手动给 EasyCurl 绑定你想用的快捷键。

## 开发

本项目刻意不使用构建流程。扩展由原生 Manifest V3 HTML/CSS/JavaScript 实现。

```bash
npm test
```

主要路径：

- `extension/manifest.json` - 扩展元信息、权限、图标、快捷键。
- `extension/popup.html` - 主界面。
- `extension/popup.js` - UI 状态和交互逻辑。
- `extension/lib/curlParser.js` - curl 解析和请求序列化。
- `extension/lib/httpClient.js` - 请求发送。
- `extension/lib/privacy.js` - 脱敏和历史记录生成。

## 打包发布

当前可上传的扩展包是：

```text
dist/easycurl-extension-0.1.0.zip
```

手动重新打包：

```bash
cd extension
zip -r ../dist/easycurl-extension-0.1.0.zip .
```

发布新版本前，需要先更新 `extension/manifest.json` 里的 `version`。

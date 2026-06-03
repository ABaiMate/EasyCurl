# 隐私政策

[English](./PRIVACY.md) | [简体中文](./PRIVACY.zh-CN.md)

EasyCurl 是一个本地优先的 Chrome/Edge 扩展，用于从复制的 `curl` 命令导入、编辑和发送 HTTP 请求。

## 数据收集

EasyCurl 不收集个人数据、分析数据、遥测数据或使用指标。

## 数据存储

EasyCurl 会使用浏览器扩展存储，在本地保存请求历史。

默认情况下，敏感请求值会在保存前被脱敏，包括：

- `Authorization`
- `Cookie`
- `Set-Cookie`
- `X-API-Key`
- `API-Key`
- `Proxy-Authorization`
- Basic Auth 密码

只有当你主动启用 `Save sensitive values in history` 时，EasyCurl 才会保存敏感值。

## 数据共享

EasyCurl 不会把你的请求历史、Token、Cookie 或设置发送到任何 EasyCurl 服务器。EasyCurl 不运行后端服务。

当你点击 `Send` 时，请求会直接发送到你输入或导入的目标 URL。请求数据只会传输给该目标接口。

## 权限说明

EasyCurl 请求以下浏览器权限：

- `clipboardRead` - 当你点击导入动作时，用于读取复制的 `curl` 命令。
- `storage` - 用于保存本地请求历史。
- `contextMenus` - 用于提供右键导入入口。
- `http://*/*` 和 `https://*/*` host permissions - 用于向用户提供的 URL 发送 API 请求。

## 联系方式

如有隐私或安全问题，请在 GitHub 仓库中提交 issue。


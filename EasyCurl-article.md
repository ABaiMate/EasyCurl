# 我为什么做 EasyCurl：一个能把 curl 直接变成请求的浏览器插件

作者：TDW

有时候让人烦的不是接口本身，而是“我明明已经有 curl 了，为什么还要等一个网页工具转半天”。

我遇到的问题很具体：在 Apifox 或接口文档页面里复制了一段 `curl`，只是想快速发一下请求，看返回结果，顺手改几个 Header、Query 或 Body。结果页面一直转，工具很完整，但流程对这个场景来说太重。越急越卡，越卡越想找一个更直接的办法。

我找过一些插件和在线页面，但大多不是我想要的：有的只能格式化 curl，有的只能生成代码，有的需要进入完整工作区，有的能发请求但编辑体验很别扭。最后我想要的其实很简单：

复制 curl，打开一个轻量窗口，导入，改一下，发送，看结果。

这就是 EasyCurl 的出发点。

<!-- IMAGE: 在这里插入 EasyCurl 主界面截图 -->
![EasyCurl 主界面截图](./images/easycurl-main-placeholder.png)

## 这个问题为什么值得单独做一个工具

Apifox、Postman 这类工具当然很强，它们适合长期维护接口集合、团队协作、环境变量、自动化测试和文档管理。

但日常开发里还有另一种高频场景：临时调试。

比如：

- 后端同事发来一段 curl，让你复现问题。
- 接口文档里有一个 curl 示例，你只想改几个参数试一下。
- 浏览器 Network 里复制了请求，想快速重放。
- Apifox 页面卡住了，但你不想为了一个请求打开完整工具链。
- 你要把返回结果复制给别人，不想截图，也不想整理半天。

这个时候，完整 API 客户端反而有点像“拿重型工具拧一颗小螺丝”。功能很多，但眼前的事情只是：把这个 curl 发出去。

EasyCurl 做的就是把这条路径压短。

## EasyCurl 的设计目标

我给 EasyCurl 定了几个很克制的目标。

第一，它必须快。

打开插件以后，不应该要求登录、同步、初始化项目或创建集合。用户已经有 curl 了，工具只需要把 curl 变成一个可编辑请求。

第二，它必须能改。

很多工具可以“识别 curl”，但识别后不方便调整。实际调试时，最常改的是 URL、Method、Query 参数、Headers、Body 和 Auth。所以 EasyCurl 把这些都放到一个清晰的编辑界面里。

第三，它必须方便复制结果。

调试接口通常不是只给自己看。很多时候你需要把响应体、状态码、耗时、请求信息一起发给别人。因此 EasyCurl 支持复制响应，也支持复制完整请求/响应报告。

第四，它应该尽量本地化。

请求历史保存在浏览器本地，敏感字段默认脱敏，比如 `Authorization`、`Cookie`、`X-API-Key`。它不需要账号，不做云同步，也不把你的请求内容上传到第三方服务。

## 核心使用流程

EasyCurl 的理想流程是这样的：

1. 从 Apifox、接口文档、浏览器 Network 或聊天窗口里复制一段 `curl`。
2. 按快捷键 `Ctrl+E` 打开 EasyCurl，或者点击浏览器工具栏里的插件图标。
3. 点击 `Import curl`。
4. 从剪贴板读取 curl，或者手动粘贴 curl。
5. EasyCurl 自动解析 Method、URL、Headers、Query、Body 和 Auth。
6. 你修改请求内容。
7. 点击 `Send`。
8. 查看状态码、耗时、响应头和响应体。
9. 按需复制响应或报告。

<!-- IMAGE: 在这里插入导入 curl 的截图 -->
![导入 curl 截图](./images/easycurl-import-placeholder.png)

这个流程没有工作区概念，也不强绑定 Apifox。只要你能复制到 curl，就可以用。

## 请求编辑：重点是“直接能改”

最开始我只是想做一个 curl 输入框，但很快发现这不够。

因为 curl 只是入口，真正的使用场景是修改请求。

EasyCurl 把请求拆成几个区域：

- `Method`：GET、POST、PUT、PATCH、DELETE 等常见方法。
- `URL`：请求地址，可以直接改。
- `Query`：表格形式编辑参数名和参数值。
- `Headers`：表格形式编辑 Header 名和值。
- `Body`：支持 JSON、x-www-form-urlencoded、form-data 和 raw。
- `Auth`：支持 Basic Auth。

Headers 和 Query 没有继续用纯文本编辑，是因为参数多的时候，表格更适合检查和修改。你可以一行一行看，也可以快速增加、删除参数。

<!-- IMAGE: 在这里插入 Query/Header 表格编辑截图 -->
![Query 和 Header 表格编辑截图](./images/easycurl-table-editor-placeholder.png)

Body 区域额外加了 JSON 格式化按钮。很多 curl 复制出来的 JSON 是一整行，不方便看。点击格式化后，如果 JSON 合法，就会自动缩进；如果格式失败，就给出提示，不会破坏原来的内容。

<!-- IMAGE: 在这里插入 JSON 格式化前后的截图 -->
![JSON 格式化截图](./images/easycurl-json-format-placeholder.png)

## 响应查看和复制

发送请求后，EasyCurl 会展示：

- HTTP 状态码。
- 请求耗时。
- 响应 Headers。
- 响应 Body。
- JSON 响应格式化展示。
- 网络失败或超时错误。

调试接口时，复制能力很重要。所以 EasyCurl 设计了几个直接按钮：

- `Copy curl`：把当前编辑后的请求重新复制成 curl。
- `Copy response`：复制响应体。
- `Copy report`：复制包含请求和响应信息的完整报告。

这对沟通很有用。比如你可以把“我发了什么请求、接口返回了什么、耗时多少”一次性贴给同事。

<!-- IMAGE: 在这里插入响应区和复制按钮截图 -->
![响应和复制结果截图](./images/easycurl-response-placeholder.png)

## 历史记录和隐私

EasyCurl 有本地历史记录，但它不会默认保存敏感信息的明文。

默认会脱敏的内容包括：

- `Authorization`
- `Cookie`
- `Set-Cookie`
- `X-API-Key`
- Basic Auth 密码

如果确实需要保存敏感字段，可以手动开启 `Save sensitive values in history`。这个设计是为了避免调试时一不小心把 token、cookie 或 key 长期留在本地历史里。

这里的原则很简单：调试工具应该方便，但不能替用户冒隐私风险。

## 本地安装方式

目前 EasyCurl 是 Chrome/Edge 的 Manifest V3 浏览器扩展，可以直接本地安装。

操作步骤：

1. 打开 Chrome 或 Edge。
2. 进入扩展管理页面：

```text
chrome://extensions
```

或：

```text
edge://extensions
```

3. 打开 `Developer mode / 开发者模式`。
4. 点击 `Load unpacked / 加载已解压的扩展程序`。
5. 选择项目里的 `extension/` 文件夹。
6. 安装后可以把 EasyCurl 固定到浏览器工具栏。

<!-- IMAGE: 在这里插入 Chrome 加载已解压扩展的截图 -->
![加载已解压扩展截图](./images/chrome-load-unpacked-placeholder.png)

## 快捷键设置

EasyCurl 默认建议用 `Ctrl+E` 唤起。

如果浏览器或其他插件占用了这个快捷键，可以手动设置：

1. 打开：

```text
chrome://extensions/shortcuts
```

2. 找到 EasyCurl。
3. 给打开插件窗口的命令绑定你想要的快捷键。

<!-- IMAGE: 在这里插入快捷键设置截图 -->
![快捷键设置截图](./images/easycurl-shortcut-placeholder.png)

## 从开发角度看，它为什么做成浏览器插件

这个工具也可以做成网页，但浏览器插件更适合第一版。

原因有几个：

第一，插件可以更自然地读取剪贴板。

用户复制 curl 后，不想再打开一个网页、找输入框、粘贴。插件入口更短，快捷键也更自然。

第二，插件可以直接发 HTTP/HTTPS 请求。

EasyCurl 使用浏览器扩展权限直接发送请求，不需要额外启动本地代理。对第一版来说，这样足够轻。

第三，它离使用场景更近。

curl 通常来自网页、接口文档、Apifox、浏览器 Network 或聊天工具。浏览器插件就在这些场景旁边，打开成本低。

## 第一版不做什么

EasyCurl 第一版刻意不做太多东西。

它暂时不做团队协作，不做云同步，不做复杂环境变量，不做证书管理，不做抓包代理，也不做完整 API 平台。

这些功能都可以很强，但它们会把工具重新变重。

第一版只解决一个明确问题：我已经有 curl 了，能不能快速变成可编辑请求，并立即发出去。

## 后续可以怎么迭代

如果继续完善，我会优先考虑这些方向：

- 收藏请求集合。
- 更强的 form-data 文件字段支持。
- 环境变量和变量替换。
- 从当前页面右键直接导入 curl。
- 支持更多 curl 参数。
- 响应搜索和折叠。
- 请求对比和历史 diff。
- 一键生成分享用的脱敏报告。

但这些都应该建立在一个前提上：不要破坏“快”。

EasyCurl 最重要的价值不是功能列表长，而是让一个原本让人烦躁的小流程变顺。

## 总结

EasyCurl 是从一个很具体的烦躁时刻做出来的工具。

当我只是想把一段 curl 发出去，却被页面加载、工具切换、工作区流程和复制整理卡住时，我需要的不是另一个完整 API 平台，而是一个更轻的入口。

所以 EasyCurl 的核心体验就是：

复制 curl，打开，导入，修改，发送，复制结果。

如果你也经常在 Apifox、接口文档或浏览器 Network 里复制 curl 调试接口，这类工具会非常省心。它不试图替代 Postman 或 Apifox，而是补上那个最急、最临时、最需要快的调试空档。

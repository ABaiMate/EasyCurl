# EasyCurl

[English](./README.md) | [简体中文](./README.zh-CN.md)

EasyCurl is a lightweight Chrome/Edge extension for turning copied `curl` commands into editable API requests. It is built for the moment when a full API client feels too slow: import curl, tweak headers/query/body, send, inspect the response, and copy the result.

<img width="1280" height="860" alt="image" src="https://github.com/user-attachments/assets/00debc3f-b554-4434-af8e-c7eeab95353d" />


## Why EasyCurl

Tools like Apifox, Postman, and browser docs are powerful, but they can feel heavy when you only need to quickly replay one request. EasyCurl keeps the workflow small:

1. Copy a `curl` command.
2. Open EasyCurl with `Ctrl+E` or the toolbar icon.
3. Click `Import curl`.
4. Read from clipboard or paste the command.
5. Edit the request and send it.

No account, no cloud sync, no workspace setup.

## Features

- Import common `curl` commands into an editable request.
- Edit method, URL, query parameters, headers, body, and Basic Auth.
- Table-style editors for Headers and Query.
- Send HTTP/HTTPS requests directly from the extension.
- View status, duration, response headers, and formatted response body.
- Format JSON request bodies.
- Copy the current request as curl.
- Copy response body or a full request/response report.
- Local request history with sensitive fields redacted by default.
- Opens as a larger standalone extension window instead of a cramped toolbar popup.

## Privacy

EasyCurl is designed as a local-first debugging tool.

- Request history is stored locally in the browser.
- `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`, and Basic Auth passwords are redacted by default.
- Sensitive values are only saved when you explicitly enable `Save sensitive values in history`.
- EasyCurl does not require an account.
- EasyCurl does not provide cloud sync.

See [PRIVACY.md](./PRIVACY.md) for the full privacy note. A Chinese version is available at [PRIVACY.zh-CN.md](./PRIVACY.zh-CN.md).

## Install Locally

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `extension/` folder in this repository.
5. Pin EasyCurl to the toolbar if you want quick access.

## Keyboard Shortcut

The extension suggests `Ctrl+E` to open EasyCurl. If Chrome/Edge blocks or overrides it, open:

```text
chrome://extensions/shortcuts
```

Then manually bind EasyCurl to your preferred shortcut.

## Development

This project intentionally has no build step. The extension is plain Manifest V3 HTML/CSS/JavaScript.

```bash
npm test
```

Useful paths:

- `extension/manifest.json` - extension metadata, permissions, icons, shortcuts.
- `extension/popup.html` - main UI.
- `extension/popup.js` - UI state and interactions.
- `extension/lib/curlParser.js` - curl parsing and request serialization.
- `extension/lib/httpClient.js` - request sending.
- `extension/lib/privacy.js` - redaction and history item creation.

## Package For Release

The current uploadable package is:

```text
dist/easycurl-extension-0.1.0.zip
```

To create a new package manually:

```bash
cd extension
zip -r ../dist/easycurl-extension-0.1.0.zip .
```

Before publishing a new version, update `version` in `extension/manifest.json`.

## GitHub Repository Setup

```bash
cd /Users/vector/tool/EasyCurl
git init
git add .
git commit -m "Initial EasyCurl extension"
git branch -M main
git remote add origin https://github.com/<your-name>/easycurl.git
git push -u origin main
```

Suggested repository description:

```text
A lightweight Chrome/Edge extension that turns copied curl commands into editable API requests.
```

Suggested topics:

```text
chrome-extension, edge-extension, curl, api-client, http-client, developer-tools, manifest-v3
```

## Chrome Web Store Notes

Chrome Web Store publishing requires a registered developer account and currently involves a one-time registration fee. If you do not want to pay that fee yet, GitHub plus local installation is enough for early users and testers.

When ready to publish:

1. Register in the Chrome Developer Dashboard.
2. Upload `dist/easycurl-extension-0.1.0.zip`.
3. Fill store listing, screenshots, privacy fields, and distribution settings.
4. Submit for review.

## Roadmap

- Environment variables.
- Searchable history.
- Favorite requests.
- Request collections.
- Better curl option coverage.
- Optional local proxy for advanced TLS/proxy/internal-network cases.

# Privacy Policy

EasyCurl is a local-first Chrome/Edge extension for importing, editing, and sending HTTP requests from copied `curl` commands.

## Data Collection

EasyCurl does not collect personal data, analytics, telemetry, or usage metrics.

## Data Storage

EasyCurl stores request history locally in your browser using extension storage.

By default, sensitive request values are redacted before they are saved, including:

- `Authorization`
- `Cookie`
- `Set-Cookie`
- `X-API-Key`
- `API-Key`
- `Proxy-Authorization`
- Basic Auth passwords

You can choose to save sensitive values by enabling `Save sensitive values in history`.

## Data Sharing

EasyCurl does not send your request history, tokens, cookies, or settings to any EasyCurl server. EasyCurl does not operate a backend service.

When you click `Send`, the request is sent directly to the URL you entered or imported. Request data is transmitted only to that target endpoint.

## Permissions

EasyCurl requests these browser permissions:

- `clipboardRead` - to import copied `curl` commands when you click the import action.
- `storage` - to save local request history.
- `contextMenus` - to provide a right-click import entry.
- `http://*/*` and `https://*/*` host permissions - to send API requests to user-provided URLs.

## Contact

For privacy or security questions, open an issue in the GitHub repository.


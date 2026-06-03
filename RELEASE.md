# Release Checklist

## Local Checks

```bash
npm test
node --check extension/background.js
node --check extension/popup.js
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('extension/manifest.json','utf8')); console.log('manifest ok')"
```

## Package

Update `extension/manifest.json` version, then package the extension:

```bash
mkdir -p dist
cd extension
zip -r ../dist/easycurl-extension-0.1.0.zip .
```

The ZIP root must contain `manifest.json`.

## Manual Smoke Test

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load unpacked from `extension/`.
4. Open EasyCurl.
5. Import a curl command.
6. Edit headers/query/body.
7. Send a request.
8. Copy response and report.


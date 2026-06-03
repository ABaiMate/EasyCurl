import assert from "node:assert/strict";
import { createHistoryItem, redactRequest, redactValue } from "../extension/lib/privacy.js";

const request = {
  method: "GET",
  url: "https://api.example.com/private",
  queryParams: [],
  headers: [
    { enabled: true, key: "Authorization", value: "Bearer abcdef123456" },
    { enabled: true, key: "X-Trace-Id", value: "trace-1" },
    { enabled: true, key: "Cookie", value: "sid=1234567890" }
  ],
  body: { type: "none", content: "" },
  auth: { type: "basic", username: "user", password: "very-secret" },
  metadata: { rawCurl: "", warnings: [] }
};

{
  assert.equal(redactValue("1234567890"), "1234••••7890");
  assert.equal(redactValue("123"), "••••");
}

{
  const redacted = redactRequest(request);
  assert.equal(redacted.headers[0].value, "Bear••••3456");
  assert.equal(redacted.headers[1].value, "trace-1");
  assert.equal(redacted.headers[2].value, "sid=••••7890");
  assert.equal(redacted.auth.password, "very••••cret");
}

{
  const saved = redactRequest(request, { saveSensitive: true });
  assert.equal(saved.headers[0].value, "Bearer abcdef123456");
}

{
  const item = createHistoryItem(request, { status: 200, durationMs: 42 });
  assert.equal(item.status, 200);
  assert.equal(item.durationMs, 42);
  assert.ok(item.id);
}

console.log("privacy tests passed");


import assert from "node:assert/strict";
import { buildUrlWithQuery, parseCurl, serializeRequestToCurl } from "../extension/lib/curlParser.js";

{
  const request = parseCurl("curl -H 'Accept: application/json' 'https://api.example.com/users?page=1'");
  assert.equal(request.method, "GET");
  assert.equal(request.url, "https://api.example.com/users");
  assert.deepEqual(request.queryParams, [{ enabled: true, key: "page", value: "1" }]);
  assert.equal(request.headers[0].key, "Accept");
  assert.equal(request.headers[0].value, "application/json");
}

{
  const request = parseCurl(`curl 'https://api.example.com/users' \\
    -H 'Content-Type: application/json' \\
    --data-raw '{"name":"EasyCurl"}'`);
  assert.equal(request.method, "POST");
  assert.equal(request.body.type, "json");
  assert.equal(request.body.content, '{"name":"EasyCurl"}');
}

{
  const request = parseCurl("curl -X PUT -H 'Content-Type: application/x-www-form-urlencoded' -d 'a=1&b=2' https://api.example.com/form");
  assert.equal(request.method, "PUT");
  assert.equal(request.body.type, "form-urlencoded");
  assert.equal(request.body.content, "a=1&b=2");
}

{
  const request = parseCurl("curl -u 'user:pass' -H 'Authorization: Bearer abc' -H 'Cookie: sid=123' https://api.example.com/private");
  assert.equal(request.auth.type, "basic");
  assert.equal(request.auth.username, "user");
  assert.equal(request.auth.password, "pass");
  assert.equal(request.headers.length, 2);
}

{
  const request = parseCurl("curl -b 'sid=123; theme=dark' https://api.example.com/private");
  assert.equal(request.metadata.warnings.length, 0);
  assert.equal(request.headers.length, 1);
  assert.equal(request.headers[0].key, "Cookie");
  assert.equal(request.headers[0].value, "sid=123; theme=dark");
}

{
  const request = parseCurl("curl --cookie='sid=123' -H 'Cookie: theme=dark' https://api.example.com/private");
  assert.equal(request.metadata.warnings.length, 0);
  assert.equal(request.headers.length, 1);
  assert.equal(request.headers[0].key, "Cookie");
  assert.equal(request.headers[0].value, "sid=123; theme=dark");
}

{
  const request = parseCurl("curl --compressed --unknown-flag https://api.example.com/items?tag=a");
  assert.equal(request.metadata.warnings.length, 1);
  assert.equal(buildUrlWithQuery(request), "https://api.example.com/items?tag=a");
  assert.match(serializeRequestToCurl(request), /curl/);
}

console.log("curlParser tests passed");

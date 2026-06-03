const DATA_FLAGS = new Set([
  "-d",
  "--data",
  "--data-raw",
  "--data-binary",
  "--data-ascii",
  "--data-urlencode",
  "--form",
  "-F"
]);

const HEADER_FLAGS = new Set(["-H", "--header"]);
const METHOD_FLAGS = new Set(["-X", "--request"]);
const USER_FLAGS = new Set(["-u", "--user"]);
const IGNORED_VALUE_FLAGS = new Set([
  "--connect-timeout",
  "--max-time",
  "--proxy",
  "--request-target",
  "--url"
]);
const IGNORED_BOOLEAN_FLAGS = new Set([
  "--compressed",
  "-i",
  "--include",
  "-k",
  "--insecure",
  "-L",
  "--location",
  "-s",
  "--silent",
  "-v",
  "--verbose"
]);

export function createEmptyRequest() {
  return {
    method: "GET",
    url: "",
    queryParams: [],
    headers: [],
    body: {
      type: "none",
      content: ""
    },
    auth: {
      type: "none",
      username: "",
      password: ""
    },
    metadata: {
      rawCurl: "",
      warnings: []
    }
  };
}

export function parseCurl(input) {
  const request = createEmptyRequest();
  const rawCurl = String(input || "").trim();
  request.metadata.rawCurl = rawCurl;

  if (!rawCurl) {
    request.metadata.warnings.push("Clipboard is empty. Paste a curl command or enter a request manually.");
    return request;
  }

  const tokens = tokenizeShell(rawCurl);
  if (!tokens.length) {
    request.metadata.warnings.push("Could not read any shell tokens from this curl command.");
    return request;
  }

  let index = tokens[0] === "curl" ? 1 : 0;
  if (tokens[0] !== "curl") {
    request.metadata.warnings.push("Input does not start with curl. EasyCurl will still try to import it.");
  }

  const bodyParts = [];
  const formParts = [];

  while (index < tokens.length) {
    const token = tokens[index];
    const [flag, inlineValue] = splitInlineFlag(token);

    if (METHOD_FLAGS.has(flag)) {
      const value = readFlagValue(tokens, index, inlineValue);
      request.method = (value.value || "GET").toUpperCase();
      index = value.nextIndex;
      continue;
    }

    if (HEADER_FLAGS.has(flag)) {
      const value = readFlagValue(tokens, index, inlineValue);
      addHeader(request, value.value);
      index = value.nextIndex;
      continue;
    }

    if (DATA_FLAGS.has(flag)) {
      const value = readFlagValue(tokens, index, inlineValue);
      if (flag === "--form" || flag === "-F") {
        formParts.push(value.value);
      } else {
        bodyParts.push(value.value);
      }
      index = value.nextIndex;
      continue;
    }

    if (USER_FLAGS.has(flag)) {
      const value = readFlagValue(tokens, index, inlineValue);
      const [username, password = ""] = String(value.value || "").split(/:(.*)/s);
      request.auth = { type: "basic", username, password };
      index = value.nextIndex;
      continue;
    }

    if (flag === "--url") {
      const value = readFlagValue(tokens, index, inlineValue);
      request.url = value.value || request.url;
      index = value.nextIndex;
      continue;
    }

    if (IGNORED_VALUE_FLAGS.has(flag)) {
      const value = readFlagValue(tokens, index, inlineValue);
      index = value.nextIndex;
      continue;
    }

    if (IGNORED_BOOLEAN_FLAGS.has(flag)) {
      index += 1;
      continue;
    }

    if (token.startsWith("-")) {
      request.metadata.warnings.push(`Unsupported curl option ignored: ${token}`);
      index += 1;
      continue;
    }

    if (!request.url && looksLikeUrl(token)) {
      request.url = token;
    }

    index += 1;
  }

  if (formParts.length) {
    request.body = {
      type: "form-data",
      content: formParts.join("\n")
    };
  } else if (bodyParts.length) {
    const content = bodyParts.join("&");
    request.body = {
      type: inferBodyType(content, request.headers),
      content
    };
  }

  if (request.body.type !== "none" && request.method === "GET") {
    request.method = "POST";
  }

  hydrateQueryParams(request);
  return request;
}

export function serializeRequestToCurl(request) {
  const parts = ["curl"];
  const url = buildUrlWithQuery(request);
  if (request.method && request.method !== "GET") {
    parts.push("-X", shellQuote(request.method));
  }
  for (const header of request.headers || []) {
    if (!header.enabled) continue;
    parts.push("-H", shellQuote(`${header.key}: ${header.value}`));
  }
  if (request.auth?.type === "basic") {
    parts.push("-u", shellQuote(`${request.auth.username}:${request.auth.password}`));
  }
  if (request.body?.type && request.body.type !== "none" && request.body.content) {
    const flag = request.body.type === "form-data" ? "-F" : "--data-raw";
    if (request.body.type === "form-data") {
      for (const line of request.body.content.split(/\n+/).filter(Boolean)) {
        parts.push(flag, shellQuote(line));
      }
    } else {
      parts.push(flag, shellQuote(request.body.content));
    }
  }
  parts.push(shellQuote(url));
  return parts.join(" ");
}

export function buildUrlWithQuery(request) {
  if (!request.url) return "";
  const url = new URL(request.url);
  url.search = "";
  for (const param of request.queryParams || []) {
    if (!param.enabled || !param.key) continue;
    url.searchParams.append(param.key, param.value || "");
  }
  return url.toString();
}

export function linesToPairs(text, separator = ":") {
  return String(text || "")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf(separator);
      if (at === -1) return { enabled: true, key: line, value: "" };
      return {
        enabled: true,
        key: line.slice(0, at).trim(),
        value: line.slice(at + 1).trim()
      };
    });
}

export function pairsToLines(pairs, separator = ":") {
  return (pairs || [])
    .filter((pair) => pair.enabled !== false && pair.key)
    .map((pair) => `${pair.key}${separator} ${pair.value || ""}`)
    .join("\n");
}

function tokenizeShell(input) {
  const normalized = String(input).replace(/\\\r?\n/g, " ");
  const tokens = [];
  let current = "";
  let quote = null;
  let escaping = false;

  for (const char of normalized) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\" && quote !== "'") {
      escaping = true;
      continue;
    }

    if ((char === "'" || char === '"') && !quote) {
      quote = char;
      continue;
    }

    if (char === quote) {
      quote = null;
      continue;
    }

    if (/\s/.test(char) && !quote) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

function splitInlineFlag(token) {
  const at = token.indexOf("=");
  if (at === -1 || !token.startsWith("--")) return [token, undefined];
  return [token.slice(0, at), token.slice(at + 1)];
}

function readFlagValue(tokens, index, inlineValue) {
  if (inlineValue !== undefined) {
    return { value: inlineValue, nextIndex: index + 1 };
  }
  return { value: tokens[index + 1] || "", nextIndex: index + 2 };
}

function addHeader(request, headerLine) {
  const line = String(headerLine || "");
  const at = line.indexOf(":");
  if (at === -1) {
    request.metadata.warnings.push(`Header skipped because it is missing ":": ${line}`);
    return;
  }
  request.headers.push({
    enabled: true,
    key: line.slice(0, at).trim(),
    value: line.slice(at + 1).trim()
  });
}

function hydrateQueryParams(request) {
  if (!request.url || !looksLikeUrl(request.url)) return;
  const url = new URL(request.url);
  request.queryParams = Array.from(url.searchParams.entries()).map(([key, value]) => ({
    enabled: true,
    key,
    value
  }));
  url.search = "";
  request.url = url.toString();
}

function inferBodyType(content, headers) {
  const contentType = (headers || []).find((header) => header.key.toLowerCase() === "content-type")?.value || "";
  if (/application\/json/i.test(contentType)) return "json";
  if (/application\/x-www-form-urlencoded/i.test(contentType)) return "form-urlencoded";
  if (/^\s*[\[{]/.test(content)) return "json";
  if (/^[^=&\s]+=[\s\S]*&?/.test(content)) return "form-urlencoded";
  return "raw";
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function shellQuote(value) {
  const text = String(value ?? "");
  if (/^[A-Za-z0-9_./:=?&%-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}


const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^cookie$/i,
  /^set-cookie$/i,
  /^x-api-key$/i,
  /^api-key$/i,
  /^proxy-authorization$/i
];

export function isSensitiveHeader(key) {
  return SENSITIVE_HEADER_PATTERNS.some((pattern) => pattern.test(String(key || "").trim()));
}

export function redactValue(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 8) return "••••";
  return `${text.slice(0, 4)}••••${text.slice(-4)}`;
}

export function redactRequest(request, options = {}) {
  const saveSensitive = Boolean(options.saveSensitive);
  if (saveSensitive) return structuredCloneSafe(request);

  const clone = structuredCloneSafe(request);
  clone.headers = (clone.headers || []).map((header) => ({
    ...header,
    value: isSensitiveHeader(header.key) ? redactValue(header.value) : header.value
  }));

  if (clone.auth?.type === "basic") {
    clone.auth = {
      ...clone.auth,
      password: redactValue(clone.auth.password)
    };
  }

  return clone;
}

export function createHistoryItem(request, result, options = {}) {
  const redactedRequest = redactRequest(request, options);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    method: request.method,
    url: request.url,
    status: result?.status || 0,
    durationMs: result?.durationMs || 0,
    request: redactedRequest
  };
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}


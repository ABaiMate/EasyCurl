import { buildUrlWithQuery } from "./curlParser.js";

export async function sendHttpRequest(request) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const headers = new Headers();
    for (const header of request.headers || []) {
      if (header.enabled === false || !header.key) continue;
      headers.set(header.key, header.value || "");
    }

    if (request.auth?.type === "basic" && request.auth.username) {
      const token = btoa(`${request.auth.username}:${request.auth.password || ""}`);
      headers.set("Authorization", `Basic ${token}`);
    }

    const init = {
      method: request.method || "GET",
      headers,
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store"
    };

    if (!["GET", "HEAD"].includes(init.method.toUpperCase()) && request.body?.type !== "none") {
      init.body = request.body?.content || "";
      ensureContentType(headers, request.body?.type);
    }

    const response = await fetch(buildUrlWithQuery(request), init);
    const bodyText = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(response.headers.entries()).map(([key, value]) => ({ key, value })),
      bodyText,
      bodyType: inferResponseBodyType(response.headers.get("content-type"), bodyText),
      durationMs: Math.round(performance.now() - startedAt),
      error: ""
    };
  } catch (error) {
    return {
      status: 0,
      statusText: "",
      headers: [],
      bodyText: "",
      bodyType: "text",
      durationMs: Math.round(performance.now() - startedAt),
      error: error?.name === "AbortError" ? "Request timed out after 30 seconds." : error?.message || "Request failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

function ensureContentType(headers, bodyType) {
  if (headers.has("Content-Type")) return;
  if (bodyType === "json") headers.set("Content-Type", "application/json");
  if (bodyType === "form-urlencoded") headers.set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
}

function inferResponseBodyType(contentType, bodyText) {
  if (/application\/json/i.test(contentType || "")) return "json";
  if (/^\s*[\[{]/.test(bodyText || "")) return "json";
  if (/text\/html/i.test(contentType || "")) return "html";
  return "text";
}


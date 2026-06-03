import {
  createEmptyRequest,
  linesToPairs,
  parseCurl,
  serializeRequestToCurl
} from "./lib/curlParser.js";
import { sendHttpRequest } from "./lib/httpClient.js";
import { createHistoryItem } from "./lib/privacy.js";

const HISTORY_KEY = "easycurlHistory";
const HISTORY_LIMIT = 24;
const extensionChrome = globalThis.chrome;
const hasExtensionApi = Boolean(extensionChrome?.runtime?.sendMessage);

const els = {
  statusText: document.querySelector("#statusText"),
  warnings: document.querySelector("#warnings"),
  toggleImportBtn: document.querySelector("#toggleImportBtn"),
  importPanel: document.querySelector("#importPanel"),
  curlInput: document.querySelector("#curlInput"),
  readClipboardBtn: document.querySelector("#readClipboardBtn"),
  applyCurlBtn: document.querySelector("#applyCurlBtn"),
  copyCurlBtn: document.querySelector("#copyCurlBtn"),
  copyResponseBtn: document.querySelector("#copyResponseBtn"),
  copyReportBtn: document.querySelector("#copyReportBtn"),
  sendBtn: document.querySelector("#sendBtn"),
  methodInput: document.querySelector("#methodInput"),
  urlInput: document.querySelector("#urlInput"),
  headersEditor: document.querySelector("#headersEditor"),
  queryEditor: document.querySelector("#queryEditor"),
  addHeaderBtn: document.querySelector("#addHeaderBtn"),
  addQueryBtn: document.querySelector("#addQueryBtn"),
  formatJsonBtn: document.querySelector("#formatJsonBtn"),
  bodyTypeInput: document.querySelector("#bodyTypeInput"),
  bodyInput: document.querySelector("#bodyInput"),
  authTypeInput: document.querySelector("#authTypeInput"),
  authUserInput: document.querySelector("#authUserInput"),
  authPasswordInput: document.querySelector("#authPasswordInput"),
  saveSensitiveInput: document.querySelector("#saveSensitiveInput"),
  responseStatus: document.querySelector("#responseStatus"),
  responseTime: document.querySelector("#responseTime"),
  responseBody: document.querySelector("#responseBody"),
  responseHeaders: document.querySelector("#responseHeaders"),
  historyList: document.querySelector("#historyList"),
  clearHistoryBtn: document.querySelector("#clearHistoryBtn")
};

let currentRequest = createEmptyRequest();
let currentResult = null;

init();

async function init() {
  bindTabs();
  bindActions();
  renderRequest(currentRequest);
  await maybeImportClipboardOnOpen();
  await renderHistory();
}

function bindTabs() {
  for (const tab of document.querySelectorAll(".tab")) {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  }
  for (const tab of document.querySelectorAll(".response-tab")) {
    tab.addEventListener("click", () => activateResponseTab(tab.dataset.responseTab));
  }
}

function bindActions() {
  els.toggleImportBtn.addEventListener("click", toggleImportPanel);
  els.readClipboardBtn.addEventListener("click", () => readClipboardIntoImportPanel());
  els.applyCurlBtn.addEventListener("click", applyCurlInput);
  els.copyCurlBtn.addEventListener("click", copyCurrentCurl);
  els.copyResponseBtn.addEventListener("click", copyResponseBody);
  els.copyReportBtn.addEventListener("click", copyResponseReport);
  els.sendBtn.addEventListener("click", sendCurrentRequest);
  els.clearHistoryBtn.addEventListener("click", clearHistory);
  els.addHeaderBtn.addEventListener("click", () => addPairRow(els.headersEditor, "header"));
  els.addQueryBtn.addEventListener("click", () => addPairRow(els.queryEditor, "query"));
  els.formatJsonBtn.addEventListener("click", formatJsonBody);
  els.urlInput.addEventListener("change", syncRequestFromForm);
}

async function maybeImportClipboardOnOpen() {
  const session = await readSession(["easycurlImportClipboard"]);
  if (session.easycurlImportClipboard) {
    await removeSession("easycurlImportClipboard");
    await readClipboardIntoImportPanel({ applyImmediately: true });
    return;
  }

  setStatus("Click Import curl to paste or read a curl command, convert it, edit the request, then send.", "neutral");
}

function toggleImportPanel() {
  els.importPanel.hidden = !els.importPanel.hidden;
  if (!els.importPanel.hidden) {
    els.curlInput.focus();
    setStatus("Paste a curl command, or read it from clipboard, then convert it into a request.", "neutral");
  }
}

async function readClipboardIntoImportPanel(options = {}) {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      els.importPanel.hidden = false;
      if (!options.quiet) setStatus("Clipboard is empty. Paste curl into the import box.", "warn");
      return;
    }
    els.curlInput.value = text;
    els.importPanel.hidden = false;
    if (options.applyImmediately && !looksLikeCurl(text)) {
      setStatus("Clipboard does not look like curl. Paste a curl command and click Use pasted curl.", "warn");
      els.curlInput.focus();
      return;
    }
    if (options.applyImmediately) {
      applyCurlText(text, "Imported curl from clipboard.");
    } else {
      setStatus("Clipboard curl is ready. Click Use pasted curl to convert it.", "ok");
      els.curlInput.focus();
    }
  } catch (error) {
    els.importPanel.hidden = false;
    if (!options.quiet) setStatus(error?.message || "Could not read clipboard. Paste curl into the import box.", "error");
  }
}

function applyCurlInput() {
  applyCurlText(els.curlInput.value, "Converted pasted curl into an editable request.");
}

function applyCurlText(text, successMessage) {
  const rawCurl = String(text || "").trim();
  if (!rawCurl) {
    setStatus("Paste a curl command before importing.", "warn");
    els.importPanel.hidden = false;
    els.curlInput.focus();
    return;
  }

  const request = parseCurl(rawCurl);
  currentRequest = request;
  renderRequest(request);
  renderWarnings(request.metadata.warnings);
  els.importPanel.hidden = true;
  activateTab(request.body?.type && request.body.type !== "none" ? "body" : "headers");
  setStatus(request.url ? successMessage : "Curl imported, but no URL was found.", request.url ? "ok" : "warn");
}

function looksLikeCurl(text) {
  return /^\s*curl(\s|$)/i.test(String(text || ""));
}

function formatJsonBody() {
  const rawBody = els.bodyInput.value.trim();
  if (!rawBody) {
    showSingleWarning("Body is empty. Paste JSON before formatting.");
    setStatus("Body is empty. Paste JSON before formatting.", "warn");
    return;
  }

  try {
    els.bodyInput.value = JSON.stringify(JSON.parse(rawBody), null, 2);
    els.bodyTypeInput.value = "json";
    renderWarnings([]);
    setStatus("Formatted JSON body.", "ok");
  } catch (error) {
    const message = `JSON format failed: ${error.message}`;
    showSingleWarning(message);
    setStatus(message, "error");
  }
}

function showSingleWarning(message) {
  renderWarnings([message]);
}

async function copyCurrentCurl() {
  syncRequestFromForm();
  const curl = serializeRequestToCurl(currentRequest);
  await navigator.clipboard.writeText(curl);
  setStatus("Copied current request as curl.", "ok");
}

async function copyResponseBody() {
  if (!currentResult) {
    setStatus("Send a request before copying the response.", "warn");
    return;
  }

  await navigator.clipboard.writeText(currentResult.error || formatBody(currentResult));
  setStatus("Copied response body.", "ok");
}

async function copyResponseReport() {
  if (!currentResult) {
    setStatus("Send a request before copying the report.", "warn");
    return;
  }

  syncRequestFromForm();
  await navigator.clipboard.writeText(formatResponseReport(currentRequest, currentResult));
  setStatus("Copied curl and response report.", "ok");
}

async function sendCurrentRequest() {
  syncRequestFromForm();
  renderWarnings(currentRequest.metadata.warnings);

  if (!currentRequest.url) {
    setStatus("Enter a request URL before sending.", "error");
    return;
  }

  els.sendBtn.disabled = true;
  els.responseStatus.textContent = "Sending";
  els.responseStatus.className = "status-pill";
  els.responseBody.textContent = "Request in flight...";
  els.responseHeaders.textContent = "";

  const response = await sendRequest(currentRequest);

  currentResult = response?.result;
  renderResult(currentResult);
  els.copyResponseBtn.disabled = false;
  els.copyReportBtn.disabled = false;
  await saveHistory(currentRequest, currentResult);
  await renderHistory();
  els.sendBtn.disabled = false;
}

function renderRequest(request) {
  els.methodInput.value = request.method || "GET";
  els.urlInput.value = request.url || "";
  renderPairEditor(els.headersEditor, request.headers, "header");
  renderPairEditor(els.queryEditor, request.queryParams, "query");
  els.bodyTypeInput.value = request.body?.type || "none";
  els.bodyInput.value = request.body?.content || "";
  els.authTypeInput.value = request.auth?.type || "none";
  els.authUserInput.value = request.auth?.username || "";
  els.authPasswordInput.value = request.auth?.password || "";
}

function syncRequestFromForm() {
  currentRequest = {
    ...currentRequest,
    method: els.methodInput.value,
    url: els.urlInput.value.trim(),
    queryParams: readPairEditor(els.queryEditor),
    headers: readPairEditor(els.headersEditor),
    body: {
      type: els.bodyTypeInput.value,
      content: els.bodyInput.value
    },
    auth: {
      type: els.authTypeInput.value,
      username: els.authUserInput.value,
      password: els.authPasswordInput.value
    }
  };
}

function renderPairEditor(container, pairs = [], kind) {
  container.textContent = "";
  const normalized = normalizePairs(pairs);
  const rows = normalized.length ? normalized : [{ enabled: true, key: "", value: "" }];

  for (const pair of rows) {
    addPairRow(container, kind, pair);
  }
}

function addPairRow(container, kind, pair = { enabled: true, key: "", value: "" }) {
  const row = document.createElement("div");
  row.className = "kv-row";
  row.innerHTML = `
    <label class="kv-check" title="Enable row">
      <input type="checkbox" ${pair.enabled === false ? "" : "checked"} aria-label="Enable ${kind}">
      <span></span>
    </label>
    <input class="kv-key" value="${escapeAttribute(pair.key || "")}" placeholder="${kind === "header" ? "Header name" : "Parameter name"}" aria-label="${kind} name">
    <span class="kv-equals">=</span>
    <input class="kv-value" value="${escapeAttribute(pair.value || "")}" placeholder="${kind === "header" ? "Header value" : "Parameter value"}" aria-label="${kind} value">
    <button class="kv-remove" type="button" title="Remove row" aria-label="Remove ${kind}">&times;</button>
  `;
  row.querySelector(".kv-remove").addEventListener("click", () => {
    row.remove();
    if (!container.querySelector(".kv-row")) addPairRow(container, kind);
  });
  container.append(row);
}

function readPairEditor(container) {
  return Array.from(container.querySelectorAll(".kv-row"))
    .map((row) => ({
      enabled: row.querySelector(".kv-check input").checked,
      key: row.querySelector(".kv-key").value.trim(),
      value: row.querySelector(".kv-value").value.trim()
    }))
    .filter((pair) => pair.key || pair.value);
}

function normalizePairs(pairs) {
  if (Array.isArray(pairs)) return pairs;
  return linesToPairs(pairs, ":");
}

function renderResult(result) {
  if (!result) return;
  const hasError = Boolean(result.error) || result.status === 0 || result.status >= 400;
  els.responseStatus.textContent = result.error || `${result.status} ${result.statusText || ""}`.trim();
  els.responseStatus.className = `status-pill ${hasError ? "error" : "ok"}`;
  els.responseTime.textContent = `${result.durationMs || 0} ms`;
  els.responseBody.textContent = result.error || formatBody(result);
  els.responseHeaders.textContent = (result.headers || []).map((header) => `${header.key}: ${header.value}`).join("\n");
  setStatus(hasError ? "Request completed with an error status." : "Request completed.", hasError ? "warn" : "ok");
}

function formatBody(result) {
  if (result.bodyType !== "json") return result.bodyText || "";
  try {
    return JSON.stringify(JSON.parse(result.bodyText), null, 2);
  } catch {
    return result.bodyText || "";
  }
}

function formatResponseReport(request, result) {
  const statusLine = result.error
    ? `ERROR: ${result.error}`
    : `${result.status} ${result.statusText || ""}`.trim();
  const headers = (result.headers || []).map((header) => `${header.key}: ${header.value}`).join("\n");
  const body = result.error || formatBody(result);

  return [
    "REQUEST",
    serializeRequestToCurl(request),
    "",
    "RESPONSE",
    `Status: ${statusLine}`,
    `Duration: ${result.durationMs || 0} ms`,
    "",
    "Headers:",
    headers || "(none)",
    "",
    "Body:",
    body || "(empty)"
  ].join("\n");
}

function renderWarnings(warnings = []) {
  if (!warnings.length) {
    els.warnings.hidden = true;
    els.warnings.textContent = "";
    return;
  }
  els.warnings.hidden = false;
  els.warnings.textContent = warnings.join(" ");
}

function setStatus(message, tone = "neutral") {
  els.statusText.textContent = message;
  els.statusText.dataset.tone = tone;
}

async function saveHistory(request, result) {
  const store = await readLocal([HISTORY_KEY]);
  const history = store[HISTORY_KEY] || [];
  const item = createHistoryItem(request, result, {
    saveSensitive: els.saveSensitiveInput.checked
  });
  await writeLocal({
    [HISTORY_KEY]: [item, ...history].slice(0, HISTORY_LIMIT)
  });
}

async function renderHistory() {
  const store = await readLocal([HISTORY_KEY]);
  const history = store[HISTORY_KEY] || [];
  els.historyList.textContent = "";

  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "empty-history";
    empty.textContent = "No requests yet.";
    els.historyList.append(empty);
    return;
  }

  for (const item of history.slice(0, 6)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.innerHTML = `
      <strong>${escapeHtml(item.method)} ${escapeHtml(String(item.status || "-"))}</strong>
      <span>${escapeHtml(item.url || "")}</span>
      <span>${new Date(item.createdAt).toLocaleString()} · ${item.durationMs || 0} ms</span>
    `;
    button.addEventListener("click", () => {
      currentRequest = item.request;
      renderRequest(currentRequest);
      setStatus("Loaded request from local history.", "ok");
    });
    els.historyList.append(button);
  }
}

async function clearHistory() {
  await writeLocal({ [HISTORY_KEY]: [] });
  await renderHistory();
  setStatus("Local history cleared.", "ok");
}

async function sendRequest(request) {
  if (hasExtensionApi) {
    return extensionChrome.runtime.sendMessage({
      type: "SEND_REQUEST",
      request
    });
  }

  return {
    ok: true,
    result: await sendHttpRequest(request)
  };
}

async function readSession(keys) {
  if (extensionChrome?.storage?.session) return extensionChrome.storage.session.get(keys);
  return {};
}

async function removeSession(key) {
  if (extensionChrome?.storage?.session) return extensionChrome.storage.session.remove(key);
}

async function readLocal(keys) {
  if (extensionChrome?.storage?.local) return extensionChrome.storage.local.get(keys);

  const result = {};
  for (const key of keys) {
    const value = localStorage.getItem(key);
    result[key] = value ? JSON.parse(value) : undefined;
  }
  return result;
}

async function writeLocal(values) {
  if (extensionChrome?.storage?.local) return extensionChrome.storage.local.set(values);

  for (const [key, value] of Object.entries(values)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function activateTab(name) {
  for (const tab of document.querySelectorAll(".tab")) {
    tab.classList.toggle("active", tab.dataset.tab === name);
  }
  for (const panel of document.querySelectorAll(".tab-panel")) {
    panel.classList.toggle("active", panel.dataset.panel === name);
  }
}

function activateResponseTab(name) {
  for (const tab of document.querySelectorAll(".response-tab")) {
    tab.classList.toggle("active", tab.dataset.responseTab === name);
  }
  els.responseBody.hidden = name !== "body";
  els.responseHeaders.hidden = name !== "headers";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

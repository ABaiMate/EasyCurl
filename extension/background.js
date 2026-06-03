import { sendHttpRequest } from "./lib/httpClient.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "easycurl-open",
    title: "Open EasyCurl from clipboard",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "easycurl-open") return;
  await chrome.storage.session.set({ easycurlImportClipboard: true });
  await openEasyCurlWindow();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-easycurl") return;
  await chrome.storage.session.remove("easycurlImportClipboard");
  await openEasyCurlWindow();
});

chrome.action.onClicked.addListener(async () => {
  await chrome.storage.session.remove("easycurlImportClipboard");
  await openEasyCurlWindow();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "SEND_REQUEST") return false;

  sendHttpRequest(message.request)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => {
      sendResponse({
        ok: false,
        result: {
          status: 0,
          statusText: "",
          headers: [],
          bodyText: "",
          bodyType: "text",
          durationMs: 0,
          error: error?.message || "Request failed"
        }
      });
    });

  return true;
});

async function openEasyCurlWindow() {
  const existing = await findExistingEasyCurlWindow();
  if (existing?.id) {
    await chrome.windows.update(existing.id, {
      focused: true,
      width: 1280,
      height: 860
    });
    return;
  }

  await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 1280,
    height: 860,
    focused: true
  });
}

async function findExistingEasyCurlWindow() {
  const targetUrl = chrome.runtime.getURL("popup.html");
  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["popup"] });
  return windows.find((candidate) =>
    candidate.tabs?.some((tab) => tab.url === targetUrl)
  );
}

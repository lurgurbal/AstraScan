// Service Worker — AstraScan Extension
const ASTRASCAN_URL = "https://astra-scan.vercel.app"; // ← Changer par votre URL Vercel

// Menu contextuel clic droit
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyze-selection",
    title: "🔍 AstraScan — Analyser cette sélection",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "analyze-link",
    title: "🔍 AstraScan — Analyser ce lien",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "analyze-page",
    title: "🔍 AstraScan — Analyser l'URL de cette page",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let url = ASTRASCAN_URL;
  if (info.menuItemId === "analyze-selection" && info.selectionText) {
    url = `${ASTRASCAN_URL}?tab=text&q=${encodeURIComponent(info.selectionText.slice(0, 500))}`;
  } else if (info.menuItemId === "analyze-link" && info.linkUrl) {
    url = `${ASTRASCAN_URL}?tab=url&q=${encodeURIComponent(info.linkUrl)}`;
  } else if (info.menuItemId === "analyze-page" && tab?.url) {
    url = `${ASTRASCAN_URL}?tab=url&q=${encodeURIComponent(tab.url)}`;
  }
  chrome.tabs.create({ url });
});

// Répondre aux messages du content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ANALYZE_URL") {
    fetch(`${ASTRASCAN_URL}/api/analyze-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: msg.url })
    })
    .then(r => r.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async
  }
});

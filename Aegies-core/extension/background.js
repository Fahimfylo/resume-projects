const API_BASE = 'http://localhost:9002/api';
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function checkUrl(url) {
  const cached = CACHE.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`${API_BASE}/security/ioc/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: url, type: 'url' }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    CACHE.set(url, { data, timestamp: Date.now() });
    return data;
  } catch {
    return null;
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const url = new URL(details.url);
  const result = await checkUrl(url.href);

  if (result && (result.classification === 'malicious' || result.classification === 'suspicious')) {
    chrome.tabs.sendMessage(details.tabId, {
      type: 'SECURITY_WARNING',
      data: result,
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AegisCore Security Alert',
      message: `Suspicious site detected: ${url.hostname}`,
      priority: 2,
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_URL') {
    checkUrl(message.url).then(sendResponse);
    return true;
  }
});

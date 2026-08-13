const API_BASE = 'http://localhost:9002/api';

document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = document.getElementById('currentPage');
  const riskStatus = document.getElementById('riskStatus');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    currentPage.textContent = tab.url;
    checkUrl(tab.url);
  } else {
    currentPage.textContent = 'No active tab';
  }

  document.getElementById('scanBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      riskStatus.textContent = 'Scanning...';
      riskStatus.className = 'value';
      await checkUrl(tab.url);
    }
  });

  document.getElementById('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:9002/dashboard' });
  });
});

async function checkUrl(url) {
  const riskStatus = document.getElementById('riskStatus');
  try {
    const response = await fetch(`${API_BASE}/security/ioc/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: url, type: 'url' }),
    });

    if (!response.ok) {
      riskStatus.textContent = 'Not authenticated or API unavailable';
      return;
    }

    const data = await response.json();

    if (data.classification === 'malicious') {
      riskStatus.textContent = `⚠ DANGEROUS — ${data.category} (${data.confidenceScore}% confidence)`;
      riskStatus.className = 'value danger';
    } else if (data.classification === 'suspicious') {
      riskStatus.textContent = `⚡ SUSPICIOUS — ${data.category} (${data.confidenceScore}% confidence)`;
      riskStatus.className = 'value warning';
    } else {
      riskStatus.textContent = '✅ Safe — no threats detected';
      riskStatus.className = 'value safe';
    }
  } catch {
    riskStatus.textContent = '❌ Error connecting to AegisCore API';
    riskStatus.className = 'value danger';
  }
}

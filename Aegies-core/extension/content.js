let warningOverlay = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SECURITY_WARNING') {
    showWarning(message.data);
  }
});

function showWarning(data) {
  if (warningOverlay) return;

  warningOverlay = document.createElement('div');
  warningOverlay.id = 'aegiscore-warning';
  warningOverlay.innerHTML = `
    <div style="
      position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
      background: linear-gradient(135deg, #1a0000 0%, #2d0000 100%);
      border-bottom: 3px solid #ff4444;
      padding: 16px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      box-shadow: 0 4px 20px rgba(255,0,0,0.3);
    ">
      <div style="display: flex; align-items: center; gap: 12px; max-width: 1200px; margin: 0 auto;">
        <div style="
          width: 40px; height: 40px;
          background: rgba(255,68,68,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        ">⚠️</div>
        <div style="flex: 1;">
          <strong style="color: #ff6b6b; font-size: 14px;">AegisCore Security Warning</strong>
          <p style="margin: 2px 0 0; font-size: 12px; color: #ccc;">
            This site is classified as <strong>${data.classification}</strong> (confidence: ${data.confidenceScore}%)
            — ${data.reputation}
          </p>
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 6px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">Dismiss</button>
      </div>
    </div>
  `;

  document.body.prepend(warningOverlay);
}

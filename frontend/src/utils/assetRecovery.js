// An open tab may still reference chunks removed by a new deployment.
// Retry the current URL once per minute, never in a reload loop.
export function setupAssetRecovery(browser = window) {
  const key = 'nexo:last-asset-reload';
  function recover(event) {
    try {
      const now = Date.now();
      const lastReload = Number(browser.sessionStorage.getItem(key));
      if (lastReload && now - lastReload < 60000) return;
      browser.sessionStorage.setItem(key, String(now));
    } catch {
      // Without storage we cannot safely prevent a reload loop.
      return;
    }
    event.preventDefault();
    browser.location.reload();
  }
  browser.addEventListener('vite:preloadError', recover);
  return () => browser.removeEventListener('vite:preloadError', recover);
}

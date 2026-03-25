// Content Script — AstraScan Extension
// Analyse automatiquement l'URL de la page courante si elle semble suspecte

(function() {
  const url = window.location.href;
  const suspiciousPatterns = [
    /login|signin|verify|secure|account|update|confirm|password|reset/i,
    /\.(xyz|tk|ru|top|icu|gq|cf|ml|ga|pw)($|\/)/i,
    /paypa[^l]|g[0o][0o]gle|amaz[o0]n|micros[o0]ft|netfl[i1]x/i,
  ];

  const isSuspicious = suspiciousPatterns.some(p => p.test(url));
  if (!isSuspicious) return;

  // Envoyer au background pour analyse
  chrome.runtime.sendMessage({ type: "ANALYZE_URL", url }, (response) => {
    if (!response?.success || !response.data) return;
    const { score, verdict, label, emoji } = response.data;
    if (score < 40) return; // Ne pas alerter pour les pages sûres

    // Créer le bandeau d'alerte
    const banner = document.createElement("div");
    banner.id = "astrascan-banner";
    banner.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:2147483647;
      padding:10px 16px;font-family:system-ui,sans-serif;font-size:13px;
      display:flex;align-items:center;justify-content:space-between;gap:8px;
      box-shadow:0 2px 12px rgba(0,0,0,0.3);
      background:${score >= 70 ? "#7f1d1d" : "#78350f"};
      color:${score >= 70 ? "#fca5a5" : "#fcd34d"};
      border-bottom:2px solid ${score >= 70 ? "#ef4444" : "#f59e0b"};
    `;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">${emoji}</span>
        <div>
          <strong>AstraScan : ${label}</strong>
          <span style="opacity:0.7;margin-left:8px">Score ${score}/100 — cette page présente des signaux suspects</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <a href="https://astra-scan.vercel.app?tab=url&q=${encodeURIComponent(url)}"
          target="_blank" rel="noopener"
          style="background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:6px;text-decoration:none;color:inherit;font-size:12px">
          Analyser en détail →
        </a>
        <button onclick="this.parentElement.parentElement.remove()"
          style="background:none;border:none;color:inherit;cursor:pointer;opacity:0.6;font-size:16px;padding:0 4px">✕</button>
      </div>
    `;
    document.body?.prepend(banner);
  });
})();

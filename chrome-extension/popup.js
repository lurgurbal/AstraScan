const ASTRASCAN_URL = "https://astra-scan.vercel.app";
let currentUrl = "";

// Afficher l'URL courante
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentUrl = tabs[0]?.url ?? "";
  const el = document.getElementById("current-url");
  if (el) el.textContent = currentUrl || "Aucune URL";
});

// Bouton analyser
document.getElementById("analyze-btn")?.addEventListener("click", async () => {
  if (!currentUrl) return;
  const container = document.getElementById("result-container");
  if (!container) return;
  container.innerHTML = `<div class="loading"><div class="spinner"></div>Analyse en cours…</div>`;
  try {
    const res = await fetch(`${ASTRASCAN_URL}/api/analyze-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: currentUrl })
    });
    const data = await res.json();
    const colorClass = data.color ?? "emerald";
    const barColor = data.color === "red" ? "#ef4444" : data.color === "amber" ? "#f59e0b" : "#10b981";
    const reasons = (data.reasons ?? []).slice(0, 3).map(r => `• ${r}`).join("\n");
    container.innerHTML = `
      <div class="result ${colorClass}">
        <div class="result-label">${data.emoji} ${data.label}</div>
        <div class="result-score">Score : ${data.score}/100</div>
        <div class="progress"><div class="progress-bar" style="width:${data.score}%;background:${barColor}"></div></div>
        ${reasons ? `<div class="result-reasons">${reasons}</div>` : ""}
      </div>`;
  } catch {
    container.innerHTML = `<div class="result amber"><div class="result-label">⚠ Impossible d'analyser</div></div>`;
  }
});

// Bouton ouvrir le site complet
document.getElementById("open-tool-btn")?.addEventListener("click", () => {
  chrome.tabs.create({ url: `${ASTRASCAN_URL}?tab=url&q=${encodeURIComponent(currentUrl)}` });
});

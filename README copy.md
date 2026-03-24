# 🔍 ScamDetector

**Analysez vos messages et URLs suspects pour détecter les arnaques, phishing et fraudes en ligne.**

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## ✨ Fonctionnalités

- **Analyse de messages** — détecte les mots d'urgence, demandes de données sensibles (RIB, carte bancaire, code SMS), menaces légales, promesses de gains, crypto...
- **Analyse d'URL** — détecte le typosquatting (paypa1, g00gle), les TLD suspects (.xyz, .ru, .tk), les structures inhabituelles, et vérifie contre une blacklist
- **Score de risque** — 0 à 100 avec verdict clair : 🚨 Probable arnaque / ⚠️ À vérifier / ✅ Rien de flagrant
- **Interface sombre** — UI minimaliste et moderne, responsive
- **Prêt pour les APIs externes** — structure préparée pour Google Safe Browsing, VirusTotal, WHOIS

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/VOTRE_USERNAME/scam-detector.git
cd scam-detector

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local avec vos clés API (optionnel pour le MVP)

# 4. Lancer en développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📁 Structure du projet

```
scam-detector/
│
├── app/
│   ├── page.tsx                 ← Page principale (onglets Texte / URL)
│   ├── layout.tsx               ← Layout racine, polices, métadonnées
│   └── api/
│       ├── analyze-text/
│       │   └── route.ts         ← POST /api/analyze-text
│       └── analyze-url/
│           └── route.ts         ← POST /api/analyze-url
│
├── components/
│   ├── TextForm.tsx             ← Formulaire analyse de message
│   ├── UrlForm.tsx              ← Formulaire analyse d'URL
│   └── ResultCard.tsx           ← Carte de résultat avec score et raisons
│
├── lib/
│   ├── textAnalyzer.ts          ← 15+ règles d'analyse textuelle
│   ├── urlAnalyzer.ts           ← Détection typosquatting, TLD, blacklist...
│   └── riskScorer.ts            ← Score 0–100 → verdict final
│
├── styles/
│   └── globals.css              ← CSS global
│
├── .env.example                 ← Template des variables d'environnement
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## 🧠 Logique d'analyse

### Analyse de texte (`lib/textAnalyzer.ts`)

| Catégorie | Exemples détectés | Points |
|---|---|---|
| Urgence | "urgent", "immédiatement", "dans les 24h" | +15 à +20 |
| Compte menacé | "compte suspendu", "accès bloqué" | +25 |
| Données bancaires | "RIB", "IBAN", "carte bancaire", "CVV" | +30 |
| Mot de passe | "mot de passe", "identifiant", "login" | +30 |
| Code SMS/OTP | "code reçu", "code de validation" | +25 |
| Crypto | "bitcoin", "ethereum", "wallet" | +25 |
| Menace légale | "poursuites judiciaires", "huissier" | +25 |
| Gain/loterie | "vous avez gagné", "heureux gagnant" | +25 |

### Analyse d'URL (`lib/urlAnalyzer.ts`)

| Signal | Exemples | Points |
|---|---|---|
| Blacklist | phishing-example.com, fake-paypal-login.com | +60 |
| Typosquatting | paypa1, g00gle, amaz0n, netfl1x | +35 |
| TLD suspect | .xyz, .ru, .tk, .top, .icu | +20 |
| Trop de sous-domaines | login.secure.bank.xyz.com | +10 à +25 |
| URL avec IP | http://185.234.12.9/login | +30 |
| HTTP sans HTTPS | http://... | +10 |
| Mots-clés suspects | login, verify, secure, account, reset | +10 à +20 |

### Verdict final

```
Score ≥ 70  →  🚨 Probable arnaque
Score ≥ 40  →  ⚠️  À vérifier
Score < 40  →  ✅  Rien de flagrant (prudence)
```

---

## 🔌 Brancher les APIs externes

Les fonctions sont prêtes dans `lib/urlAnalyzer.ts` — il suffit de décommenter et d'ajouter vos clés dans `.env.local` :

```typescript
// Google Safe Browsing
async function checkGoogleSafeBrowsing(url: string): Promise<boolean> {
  const response = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
    { method: "POST", body: JSON.stringify({ /* ... */ }) }
  );
  // ...
}

// VirusTotal
async function checkVirusTotal(url: string): Promise<boolean> {
  const response = await fetch("https://www.virustotal.com/api/v3/urls", {
    headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY! },
    // ...
  });
}
```

---

## 🚢 Déploiement sur Vercel

```bash
# Option 1 : Via CLI Vercel
npm i -g vercel
vercel

# Option 2 : Import depuis GitHub
# → vercel.com/new → importer le repo GitHub → Deploy
```

Ajoutez vos variables d'environnement dans les **Settings → Environment Variables** de votre projet Vercel.

---

## 🛠️ Scripts disponibles

```bash
npm run dev        # Serveur de développement (localhost:3000)
npm run build      # Build de production
npm run start      # Serveur de production
npm run type-check # Vérification TypeScript sans compilation
npm run lint       # ESLint
```

---

## ⚠️ Avertissement légal

ScamDetector est un outil d'aide à la détection, pas un substitut à un avis professionnel. En cas d'arnaque avérée :

- **Signal Spam** → [signal-spam.fr](https://www.signal-spam.fr)
- **Phishing Initiative** → [phishing-initiative.fr](https://phishing-initiative.fr)
- **Cybermalveillance.gouv.fr** → [cybermalveillance.gouv.fr](https://www.cybermalveillance.gouv.fr)

---

## 📄 Licence

MIT — Libre d'utilisation, modification et distribution.

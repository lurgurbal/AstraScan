# 🔍 AstraScan

**Analyze suspicious messages, URLs, and screenshots to detect scams, phishing, and online fraud.**

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## 🎯 Why AstraScan?

Online scams are evolving fast: phishing, fake SMS, crypto fraud, impersonation, and more.

AstraScan helps anyone spot fraud signals quickly, without needing technical knowledge.

---

## ✨ Features

- **Message analysis** - detects urgency language, sensitive data requests (IBAN, credit card, SMS codes), account threats, legal threats, fake rewards, and crypto scams
- **URL analysis** - detects typosquatting (paypa1, g00gle), suspicious TLDs (.xyz, .ru, .tk), unusual structures, blacklist matches, HTTP-only links, and IP-based URLs
- **Screenshot analysis** - extracts text from images with local OCR and runs it through the same risk engine
- **Risk score** - 0 to 100 with a clear verdict: 🚨 Likely scam / ⚠️ Suspicious / ✅ No major red flags
- **Dark UI** - clean, modern, responsive interface
- **API-ready** - prepared for Google Safe Browsing, VirusTotal, WHOIS, and optional vision-based image analysis

---

## 🚀 Quick Start

### Requirements

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/astra-scan.git
cd astra-scan

npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🧠 Analysis Logic

### Text Analysis

Detects:

- urgency words like "urgent" or "immediately"
- account threats like "account suspended"
- sensitive data requests such as IBAN, password, or OTP codes
- crypto-related scams
- legal threats
- fake rewards and lottery-style lures

### URL Analysis

Detects:

- blacklisted domains
- typosquatting such as `g00gle` or `paypa1`
- suspicious TLDs like `.xyz`, `.tk`, and `.ru`
- IP-based URLs
- non-HTTPS links
- suspicious keywords like `login`, `verify`, `secure`, `account`, and `reset`

### Screenshot Analysis

Screenshots are processed locally with OCR via `tesseract.js`, then the extracted text is analyzed with the same scoring system.

---

## 🧮 Scoring System

The score is based on weighted signals.

Each rule adds points depending on its severity.
The final score is normalized between 0 and 100.

- Score ≥ 70 → 🚨 Likely scam
- Score ≥ 40 → ⚠️ Suspicious
- Score < 40 → ✅ No major red flags

---

## 🔌 External APIs

AstraScan can be extended with:

- Google Safe Browsing
- VirusTotal
- a dedicated `/api/analyze-image` vision route when `ANTHROPIC_API_KEY` is configured

⚠️ If enabled:

- Some URLs or images may be sent to third-party services
- Their privacy policies apply

---

## 🚢 Deployment

Deploy easily on Vercel:

```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel project settings.

---

## ⚠️ Disclaimer

AstraScan is a heuristic-based tool.

- Results are not guaranteed to be 100% accurate
- Users remain responsible for their actions
- Never share sensitive data if in doubt

---

## 🔐 Privacy

AstraScan follows GDPR-friendly principles.

- No data is stored
- No user tracking
- No account required
- Data is processed in memory only
- OCR runs locally in the browser for screenshot analysis

---

## 🚨 Report a Scam

You can report scams to:

- https://www.signal-spam.fr
- https://phishing-initiative.fr
- https://www.cybermalveillance.gouv.fr
- https://www.europol.europa.eu/report-a-crime

---

## 📄 License

MIT - Free to use, modify, and distribute.

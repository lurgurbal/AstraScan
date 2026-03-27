/**
 * app/layout.tsx — Layout racine avec ThemeProvider intégré.
 * - Mode CLAIR par défaut
 * - Script inline bloquant pour éviter le flash de thème (FOUC)
 * - Polices Space Grotesk + JetBrains Mono
 */

import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AstraScan — Détectez les arnaques en un clic",
  description: "Analysez gratuitement vos messages suspects et URLs pour détecter les tentatives de phishing, arnaques et fraudes en ligne.",
  keywords: ["arnaque", "phishing", "scam", "détecteur", "sécurité", "fraud", "astrascan"],
  authors: [{ name: "AstraScan" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "AstraScan — Détectez les arnaques",
    description: "Analysez messages et URLs suspects gratuitement",
    type: "website",
  },
};

// Script anti-FOUC : applique le thème sauvegardé AVANT le premier rendu
// Mode CLAIR par défaut si aucune préférence sauvegardée
const THEME_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem('astrascan_theme');
    // Par défaut : light
    var theme = saved || 'light';
    document.documentElement.classList.add(theme);
  } catch(e) {
    document.documentElement.classList.add('light');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Script bloquant anti-FOUC — doit être en premier dans <head> */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

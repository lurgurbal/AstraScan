/**
 * app/layout.tsx
 * Layout racine de l'application Next.js.
 * Gère les métadonnées SEO et l'import des polices Google.
 */

import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

// Police principale : Space Grotesk (moderne, tech)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Police monospace : JetBrains Mono (pour les URLs, codes)
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScamDetector — Détectez les arnaques en un clic",
  description:
    "Analysez gratuitement vos messages suspects et URLs pour détecter les tentatives de phishing, arnaques et fraudes en ligne.",
  keywords: ["arnaque", "phishing", "scam", "détecteur", "sécurité", "fraud"],
  authors: [{ name: "ScamDetector" }],
  openGraph: {
    title: "ScamDetector — Détectez les arnaques",
    description: "Analysez messages et URLs suspects gratuitement",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#070809] text-white antialiased">
        {children}
      </body>
    </html>
  );
}

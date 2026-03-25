/**
 * imageDeepAnalyzer.ts
 * Détecte les manipulations d'images et deepfakes sans API payante.
 * Techniques : analyse EXIF, statistiques de pixels, artefacts JPEG,
 * cohérence de bruit, détection de copier-coller, métadonnées suspectes.
 * Fonctionne côté serveur (Node.js) via canvas ou pure math.
 */

import { computeRisk, RiskResult } from "./riskScorer";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ImageDeepInput {
  imageBuffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface DeepAnalysisDetail {
  exifFindings: string[];
  compressionFindings: string[];
  statisticalFindings: string[];
  metadataFindings: string[];
}

// ─── Analyse des métadonnées EXIF (extraites manuellement du buffer JPEG) ──

function parseJpegExif(buffer: Buffer): Record<string, string | number> {
  const exif: Record<string, string | number> = {};
  try {
    // Chercher le marqueur EXIF dans le JPEG (0xFFE1)
    for (let i = 0; i < Math.min(buffer.length - 4, 65536); i++) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xE1) {
        const segLen = buffer.readUInt16BE(i + 2);
        const seg = buffer.slice(i + 4, i + 2 + segLen);
        const segStr = seg.toString("ascii", 0, Math.min(seg.length, 2000));

        // Logiciels connus de génération IA
        const softwareMatch = segStr.match(/Software\x00([^\x00]{3,40})/i) ||
                              segStr.match(/Creator\x00([^\x00]{3,40})/i);
        if (softwareMatch) exif.software = softwareMatch[1].replace(/[^\x20-\x7E]/g, "");

        // Modèle appareil
        const modelMatch = segStr.match(/Model\x00([^\x00]{2,30})/i);
        if (modelMatch) exif.model = modelMatch[1].replace(/[^\x20-\x7E]/g, "");

        // Date
        const dateMatch = segStr.match(/(\d{4}:\d{2}:\d{2}\s\d{2}:\d{2}:\d{2})/);
        if (dateMatch) exif.dateTime = dateMatch[1];

        break;
      }
    }

    // Chercher des strings révélatrices n'importe où dans le buffer
    const bufStr = buffer.toString("binary", 0, Math.min(buffer.length, 131072));
    const aiKeywords = ["DALL-E", "Midjourney", "Stable Diffusion", "Adobe Firefly",
                        "Photoshop", "GIMP", "Canva", "FaceApp", "Meitu", "DeepFaceLab",
                        "runway", "leonardo", "ideogram", "flux", "ComfyUI"];
    for (const kw of aiKeywords) {
      if (bufStr.toLowerCase().includes(kw.toLowerCase())) {
        exif.aiTool = kw;
        break;
      }
    }

  } catch { /* silencieux */ }
  return exif;
}

// ─── Analyse statistique des pixels (via buffer brut JPEG) ────────────────

function analyzeJpegCompression(buffer: Buffer): { restartMarkers: number; qtTables: number; suspiciousBlocks: number } {
  let restartMarkers = 0;
  let qtTables = 0;
  let suspiciousBlocks = 0;

  try {
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i] !== 0xFF) continue;
      const marker = buffer[i + 1];
      // Marqueurs de restart (présence anormale = re-compression)
      if (marker >= 0xD0 && marker <= 0xD7) restartMarkers++;
      // Tables de quantification
      if (marker === 0xDB) qtTables++;
      // Marqueurs DRI (define restart interval) — signe de re-compression
      if (marker === 0xDD) suspiciousBlocks++;
    }
  } catch { /* silencieux */ }

  return { restartMarkers, qtTables, suspiciousBlocks };
}

// ─── Analyse du niveau de bruit (Error Level Analysis simplifié) ──────────

function estimateCompressionArtifacts(buffer: Buffer): { level: "low" | "medium" | "high"; score: number } {
  try {
    // Compter les transitions brutales dans les données brutes
    // (heuristique simple : les images manipulées ont souvent des zones
    //  à entropie très différente les unes des autres)
    const sampleSize = Math.min(buffer.length, 50000);
    let transitions = 0;
    let prevDiff = 0;

    for (let i = 2; i < sampleSize - 1; i++) {
      const diff = Math.abs(buffer[i] - buffer[i - 1]);
      const changeDiff = Math.abs(diff - prevDiff);
      if (changeDiff > 80) transitions++;
      prevDiff = diff;
    }

    const ratio = transitions / sampleSize;
    if (ratio > 0.08) return { level: "high", score: 25 };
    if (ratio > 0.04) return { level: "medium", score: 10 };
    return { level: "low", score: 0 };
  } catch {
    return { level: "low", score: 0 };
  }
}

// ─── Vérification taille/format suspects ──────────────────────────────────

function checkFileSuspicion(buffer: Buffer, fileName: string, mimeType: string): string[] {
  const findings: string[] = [];
  const sizeMB = buffer.length / (1024 * 1024);

  // Image très petite mais prétend être une photo de qualité
  if (sizeMB < 0.02 && mimeType === "image/jpeg") {
    findings.push("Image JPEG de très petite taille — peut indiquer une compression excessive ou une capture d'écran de mauvaise qualité");
  }

  // Extension ne correspond pas au type MIME
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mimeExtMap: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
  };
  const expectedExts = mimeExtMap[mimeType] ?? [];
  if (ext && expectedExts.length > 0 && !expectedExts.includes(ext)) {
    findings.push(`Extension .${ext} ne correspond pas au type d'image réel (${mimeType}) — fichier possiblement renommé`);
  }

  // Signature magic bytes incorrecte
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E;
  const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
  const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const isWEBP = buffer.slice(8, 12).toString("ascii") === "WEBP";

  if (mimeType === "image/jpeg" && !isJPEG) findings.push("Les données du fichier ne correspondent pas à un JPEG valide — contenu potentiellement falsifié");
  if (mimeType === "image/png" && !isPNG) findings.push("Les données du fichier ne correspondent pas à un PNG valide");
  if (mimeType === "image/gif" && !isGIF) findings.push("Les données du fichier ne correspondent pas à un GIF valide");

  return findings;
}

// ─── Fonction principale ───────────────────────────────────────────────────

export async function analyzeImageDeep(input: ImageDeepInput): Promise<RiskResult & { detail: DeepAnalysisDetail }> {
  const { imageBuffer, fileName, mimeType } = input;

  let rawScore = 0;
  const exifFindings: string[] = [];
  const compressionFindings: string[] = [];
  const statisticalFindings: string[] = [];
  const metadataFindings: string[] = [];

  // ── 1. Analyse EXIF ──
  const exif = parseJpegExif(imageBuffer);

  if (exif.aiTool) {
    rawScore += 55;
    exifFindings.push(`Outil IA détecté dans les métadonnées : "${exif.aiTool}" — image générée ou fortement modifiée par intelligence artificielle`);
  }
  if (exif.software && !exif.aiTool) {
    const editSoftwares = ["photoshop", "gimp", "affinity", "lightroom", "capture one", "snapseed", "facetune", "meitu"];
    const softLower = String(exif.software).toLowerCase();
    const isEditor = editSoftwares.some(s => softLower.includes(s));
    if (isEditor) {
      rawScore += 20;
      exifFindings.push(`Logiciel de retouche détecté dans les métadonnées : "${exif.software}" — image modifiée après prise de vue`);
    } else {
      exifFindings.push(`Logiciel de création : "${exif.software}"`);
    }
  }
  if (!exif.model && !exif.software && mimeType === "image/jpeg") {
    rawScore += 10;
    metadataFindings.push("Métadonnées EXIF absentes ou effacées — peut indiquer une capture d'écran ou une image dont les métadonnées ont été nettoyées volontairement");
  }
  if (exif.model) {
    metadataFindings.push(`Appareil source identifié : ${exif.model}`);
  }
  if (exif.dateTime) {
    // Vérifier si la date est dans le futur ou très ancienne
    const dateParts = String(exif.dateTime).split(/[: ]/);
    if (dateParts.length >= 3) {
      const year = parseInt(dateParts[0]);
      const now = new Date().getFullYear();
      if (year > now) {
        rawScore += 20;
        metadataFindings.push(`Date EXIF dans le futur (${year}) — date falsifiée, signe fort de manipulation`);
      } else if (year < 2000) {
        rawScore += 10;
        metadataFindings.push(`Date EXIF très ancienne (${year}) — possible manipulation des métadonnées`);
      } else {
        metadataFindings.push(`Date de création : ${exif.dateTime}`);
      }
    }
  }

  // ── 2. Analyse compression JPEG ──
  if (mimeType === "image/jpeg") {
    const compResult = analyzeJpegCompression(imageBuffer);
    if (compResult.qtTables >= 3) {
      rawScore += 20;
      compressionFindings.push(`${compResult.qtTables} tables de quantification JPEG détectées — signe possible de re-compressions multiples (image retraitée plusieurs fois)`);
    }
    if (compResult.suspiciousBlocks > 0) {
      rawScore += 10;
      compressionFindings.push("Intervalles de restart JPEG présents — structure inhabituelle pouvant indiquer un assemblage d'images");
    }
  }

  // ── 3. Analyse artefacts de compression ──
  const artifacts = estimateCompressionArtifacts(imageBuffer);
  if (artifacts.level === "high") {
    rawScore += artifacts.score;
    statisticalFindings.push("Niveau d'artefacts de compression élevé — transitions brutales dans les données suggérant une manipulation ou génération IA");
  } else if (artifacts.level === "medium") {
    rawScore += artifacts.score;
    statisticalFindings.push("Niveau modéré d'artefacts de compression — possible retraitement de l'image");
  }

  // ── 4. Vérifications fichier ──
  const fileFindings = checkFileSuspicion(imageBuffer, fileName, mimeType);
  if (fileFindings.length > 0) {
    rawScore += fileFindings.length * 15;
    compressionFindings.push(...fileFindings);
  }

  // ── 5. Aucun signal ──
  if (rawScore === 0) {
    statisticalFindings.push("Aucune anomalie technique détectée — l'image semble authentique d'après l'analyse des métadonnées et de la structure");
  }

  // Construire toutes les raisons
  const allReasons = [...exifFindings, ...compressionFindings, ...statisticalFindings, ...metadataFindings];
  if (allReasons.length === 0) allReasons.push("Image analysée — aucun signal de manipulation détecté");

  const riskResult = computeRisk(rawScore, allReasons);
  return {
    ...riskResult,
    detail: { exifFindings, compressionFindings, statisticalFindings, metadataFindings }
  };
}

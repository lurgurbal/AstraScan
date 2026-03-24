"use client";

/**
 * ImageForm.tsx - Analyse image via OCR Tesseract.js (100% gratuit, sans API)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { RiskResult } from "@/lib/riskScorer";
import { addToHistory } from "@/lib/historyStore";
import { recordAnalysis } from "@/lib/statsStore";
import ResultCard from "./ResultCard";

const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

export default function ImageForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { import("tesseract.js").catch(() => {}); }, []);

  const processFile = useCallback((file: File) => {
    setResult(null); setError(null); setExtractedText(""); setOcrProgress(0);
    if (!ACCEPTED_TYPES.includes(file.type)) { setError("Format non supporté. Utilisez JPG, PNG, WEBP, GIF ou BMP."); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Image trop grande (max ${MAX_SIZE_MB} Mo).`); return; }
    setFileName(file.name);
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsLoading(true); setResult(null); setError(null); setExtractedText(""); setOcrProgress(0);
    try {
      const { createWorker } = await import("tesseract.js");
      setOcrStatus("Chargement du moteur OCR…");
      const worker = await createWorker("fra+eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
            setOcrStatus(`Lecture du texte… ${Math.round(m.progress * 100)}%`);
          } else if (m.status.includes("language")) {
            setOcrStatus("Chargement dictionnaire français…");
          } else {
            setOcrStatus("Initialisation…");
          }
        },
      });
      setOcrStatus("Analyse de l'image…");
      const { data } = await worker.recognize(imageFile);
      await worker.terminate();
      const text = data.text.trim();
      if (!text || text.length < 5) {
        setError("Aucun texte détecté. Essayez avec une image plus nette contenant du texte visible.");
        setIsLoading(false); return;
      }
      setExtractedText(text);
      setOcrStatus("Analyse des risques…");
      const res = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const analysisResult = await res.json();
      if (!res.ok) { setError(analysisResult.error ?? "Erreur analyse."); setIsLoading(false); return; }
      analysisResult.reasons = [
        `📷 Texte extrait de la capture (${text.split(/\s+/).length} mots détectés via OCR)`,
        ...analysisResult.reasons,
      ];
      setResult(analysisResult);
      addToHistory({ type: "image", input: fileName, result: analysisResult });
      recordAnalysis(analysisResult.score);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la lecture de l'image. Vérifiez qu'elle est lisible.");
    } finally {
      setIsLoading(false); setOcrStatus(""); setOcrProgress(0);
    }
  };

  const handleReset = () => {
    setPreview(null); setFileName(""); setImageFile(null);
    setResult(null); setError(null); setExtractedText("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 px-6 cursor-pointer transition-all duration-200 ${isDragging ? "border-red-500/60 bg-red-500/5" : "border-theme/15 bg-theme/2 hover:border-theme/30 hover:bg-theme/5"}`}
        >
          <div className="text-5xl">📸</div>
          <div className="text-center">
            <p className="text-sm font-medium text-theme-muted">Glissez une capture d&apos;écran ici</p>
            <p className="text-xs text-theme-faint mt-1">ou cliquez pour choisir un fichier</p>
          </div>
          <p className="text-xs text-theme-faint font-mono">JPG · PNG · WEBP · GIF · BMP — max {MAX_SIZE_MB} Mo</p>
          <div className="flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-400">✓</span>
            <span className="text-xs text-emerald-400 font-medium">100% gratuit — OCR local, aucune API</span>
          </div>
          <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleFileChange} className="sr-only" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Capture à analyser" className="w-full max-h-72 object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-white/60 font-mono truncate max-w-[200px]">{fileName}</span>
              <button onClick={handleReset} className="text-xs text-white/40 hover:text-white transition-colors ml-3 shrink-0">✕ Changer</button>
            </div>
          </div>
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-theme-faint">
                <span>{ocrStatus}</span>
                <span>{ocrProgress > 0 ? `${ocrProgress}%` : ""}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: ocrProgress > 0 ? `${ocrProgress}%` : "25%" }} />
              </div>
            </div>
          )}
          {extractedText && !isLoading && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-theme-faint uppercase tracking-widest mb-2">Texte détecté par OCR</p>
              <p className="text-xs text-theme-muted font-mono leading-relaxed line-clamp-4">
                {extractedText.slice(0, 400)}{extractedText.length > 400 ? "…" : ""}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleAnalyze} disabled={isLoading}
              className="flex-1 rounded-xl bg-white text-black font-semibold py-3 text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  {ocrStatus || "Analyse en cours…"}
                </span>
              ) : "🔍 Analyser la capture d'écran"}
            </button>
            {!isLoading && (
              <button onClick={handleReset} className="px-4 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-sm transition-all duration-200">Effacer</button>
            )}
          </div>
        </div>
      )}
      {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 p-4"><p className="text-red-400 text-sm">⚠ {error}</p></div>}
      <ResultCard result={result} isLoading={false} error={null} />
    </div>
  );
}

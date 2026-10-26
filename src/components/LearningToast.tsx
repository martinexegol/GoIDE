/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  X,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Zap,
} from 'lucide-react';
import { GoDiagnostic } from '../services/goAnalyzer';

interface LearningToastProps {
  diagnostic: GoDiagnostic | null;
  countFixed?: number;
  onClose: () => void;
  onOpenNotebook: () => void;
}

export const LearningToast: React.FC<LearningToastProps> = ({
  diagnostic,
  countFixed = 1,
  onClose,
  onOpenNotebook,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!diagnostic) return;
    setProgress(100);

    const duration = 12000; // 12s auto-dismiss so user has ample time to read
    const stepTime = 100;
    const step = (stepTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - step;
        });
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [diagnostic, isPaused, onClose]);

  if (!diagnostic) return null;

  const insight = diagnostic.insight;
  const conceptTitle = insight?.concept || diagnostic.rule || 'Règle de syntaxe Go';
  const whatWasWrong = insight?.whatWasWrong || diagnostic.message;
  const whyGoWorks = insight?.whyGoWorksThisWay || diagnostic.explanation;
  const proTip = insight?.proTip || "Relisez toujours les messages du compilateur pour identifier l'origine.";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-32px)] bg-slate-900/95 border-2 border-sky-500/80 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 overflow-hidden animate-slide-left font-sans select-text ring-1 ring-sky-400/30"
    >
      {/* Top Header Badge */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-[#00ADD8] px-3.5 py-2 flex items-center justify-between text-slate-950 font-bold">
        <div className="flex items-center gap-1.5 text-xs">
          <Zap className="w-4 h-4 fill-slate-950 animate-bounce" />
          <span>
            {countFixed > 1
              ? `${countFixed} erreurs corrigées en 1 clic !`
              : 'Erreur corrigée en 1 clic !'}
          </span>
          <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-slate-950/20 text-slate-950 font-mono ml-1">
            Ligne {diagnostic.line}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-950/20 text-slate-950 transition"
          title="Fermer l'explication"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Educational Body */}
      <div className="p-4 space-y-3 text-xs">
        {/* Concept Title */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <GraduationCap className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
              Ce que vous apprenez en Go
            </div>
            <div className="text-sm font-bold text-white leading-tight mt-0.5">
              {conceptTitle}
            </div>
          </div>
        </div>

        {/* What was wrong */}
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
          <span className="font-bold text-[11px] text-rose-300 block mb-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Ce qui n'allait pas :
          </span>
          <p className="text-[11px] leading-relaxed opacity-95">{whatWasWrong}</p>
        </div>

        {/* Why Go works this way */}
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200">
          <span className="font-bold text-[11px] text-sky-300 block mb-0.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Pourquoi le langage Go fonctionne ainsi :
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed">{whyGoWorks}</p>
        </div>

        {/* Pro Tip / Mnemonic */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11px]">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="text-amber-300">Astuce de Gopher : </strong>
            {proTip}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80">
          <button
            onClick={onOpenNotebook}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition py-1 px-2 rounded-lg hover:bg-sky-950/50"
            title="Consulter l'historique complet des leçons apprises"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mon carnet d'apprentissage</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow-md shadow-sky-500/20"
          >
            <span>J'ai compris !</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-1 w-full bg-slate-800">
        <div
          className="h-full bg-sky-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

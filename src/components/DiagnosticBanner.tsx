/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';
import { GoDiagnostic } from '../services/goAnalyzer';

interface DiagnosticBannerProps {
  diagnostics: GoDiagnostic[];
  onApplyFix: (diag: GoDiagnostic) => void;
  onApplyAllFixes: () => void;
  onJumpToLine: (line: number) => void;
  isBackgroundChecking?: boolean;
}

export const DiagnosticBanner: React.FC<DiagnosticBannerProps> = ({
  diagnostics,
  onApplyFix,
  onApplyAllFixes,
  onJumpToLine,
  isBackgroundChecking = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const fixableCount = diagnostics.filter((d) => d.fix !== undefined).length;

  if (diagnostics.length === 0) {
    return (
      <div className="h-8 px-3 bg-emerald-950/40 border-t border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300 font-mono select-none">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-[11px] text-emerald-200">
            Syntaxe Go valide
          </span>
          <span className="text-[10px] text-emerald-400/80 hidden sm:inline">
            • Aucune erreur détectée (le code est prêt pour l'exécution)
          </span>
        </div>
        {isBackgroundChecking && (
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            Vérification Go...
          </span>
        )}
      </div>
    );
  }

  const hasErrors = errors.length > 0;

  return (
    <div
      className={`border-t transition-all duration-150 ${
        hasErrors
          ? 'bg-rose-950/80 border-rose-800/90'
          : 'bg-amber-950/80 border-amber-800/90'
      }`}
    >
      {/* Summary Header */}
      <div className="h-9 px-3 flex items-center justify-between">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
        >
          {hasErrors ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`font-bold text-xs ${
                hasErrors ? 'text-rose-200' : 'text-amber-200'
              }`}
            >
              {diagnostics.length} problème{diagnostics.length > 1 ? 's' : ''} détecté{diagnostics.length > 1 ? 's' : ''}
            </span>

            {errors.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {errors.length} erreur{errors.length > 1 ? 's' : ''}
              </span>
            )}

            {warnings.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {warnings.length} avertissement{warnings.length > 1 ? 's' : ''}
              </span>
            )}

            <span className="text-[10px] text-sky-400/90 hidden sm:inline flex items-center gap-1 font-sans">
              • Corrigez en 1 clic et découvrez la règle Go
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {fixableCount > 0 && (
            <button
              onClick={onApplyAllFixes}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 shadow-md ${
                hasErrors
                  ? 'bg-rose-500 text-slate-950 hover:bg-rose-400'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
              title="Appliquer automatiquement toutes les corrections et afficher les leçons"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Tout corriger ({fixableCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition"
            title={isExpanded ? 'Réduire les explications' : 'Afficher les explications pédagogiques'}
          >
            <span>{isExpanded ? 'Masquer' : 'Explications'}</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Detailed Diagnostic List */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 max-h-72 overflow-y-auto font-sans select-text">
          {diagnostics.map((diag) => (
            <div
              key={diag.id}
              className={`p-3 rounded-2xl border text-xs flex flex-col gap-2 transition shadow-md ${
                diag.severity === 'error'
                  ? 'bg-slate-900/95 border-rose-600/70 text-rose-100 ring-1 ring-rose-500/20'
                  : 'bg-slate-900/95 border-amber-600/70 text-amber-100 ring-1 ring-amber-500/20'
              }`}
            >
              {/* Header with line, message and 1-click fix button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <button
                    onClick={() => onJumpToLine(diag.line)}
                    className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-sky-300 border border-sky-500/40 shrink-0 hover:bg-sky-950 transition flex items-center gap-1 mt-0.5"
                    title="Aller à cette ligne dans le code"
                  >
                    <span>Ligne {diag.line}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white leading-snug">
                      {diag.message}
                    </div>
                    {diag.insight?.concept && (
                      <div className="text-[10px] text-sky-400 font-medium mt-0.5">
                        Notion : {diag.insight.concept}
                      </div>
                    )}
                  </div>
                </div>

                {diag.fix && (
                  <button
                    onClick={() => onApplyFix(diag)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-[#00ADD8] hover:from-sky-300 hover:to-sky-400 text-slate-950 font-black text-xs shrink-0 transition active:scale-95 shadow-md shadow-sky-500/25 ring-1 ring-white/20"
                    title={`Corriger en 1 clic : ${diag.fix.description}`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>⚡ Corriger en 1 clic</span>
                  </button>
                )}
              </div>

              {/* Educational Explanation Box for learning Go */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5 space-y-1.5 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[10px] uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  <span>🎓 Pourquoi cette erreur en Go (Leçon) :</span>
                </div>

                <p className="text-slate-300 font-normal">
                  {diag.insight?.whyGoWorksThisWay || diag.explanation}
                </p>

                {diag.insight?.proTip && (
                  <div className="pt-1 border-t border-slate-800/80 text-amber-300/90 text-[10.5px]">
                    <strong>Astuce : </strong>
                    {diag.insight.proTip}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

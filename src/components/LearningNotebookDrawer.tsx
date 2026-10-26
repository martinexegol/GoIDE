/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  X,
  Sparkles,
  BookOpen,
  Trash2,
  CheckCircle2,
  Lightbulb,
  Search,
  Zap,
} from 'lucide-react';
import { LearnedRule } from '../types';

interface LearningNotebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  learnedRules: LearnedRule[];
  onClearRules: () => void;
}

export const LearningNotebookDrawer: React.FC<LearningNotebookDrawerProps> = ({
  isOpen,
  onClose,
  learnedRules,
  onClearRules,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredRules = learnedRules.filter(
    (r) =>
      r.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.whatWasWrong.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.whyGoWorksThisWay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.proTip.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col h-full z-10 animate-slide-left font-sans text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-[#00ADD8] flex items-center justify-center text-slate-950 shadow-md shadow-sky-500/20">
              <GraduationCap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Carnet d'Apprentissage Go</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] border border-sky-500/30">
                  {learnedRules.length} notion{learnedRules.length > 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Vos erreurs corrigées en 1 clic expliquées pas à pas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {learnedRules.length > 0 && (
              <button
                onClick={onClearRules}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Vider l'historique d'apprentissage"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Fermer le carnet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {learnedRules.length > 3 && (
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une notion (majuscule, import, assignation...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {learnedRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-sky-400">
                <BookOpen className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="font-bold text-sm text-slate-200">
                Votre carnet est prêt pour vos sessions de code !
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Dès que vous rencontrez une erreur dans l'éditeur et que vous cliquez sur{' '}
                <span className="font-semibold text-sky-400">"Corriger en 1 clic"</span>,
                l'explication détaillée de la règle Go sera automatiquement archivée ici pour vous
                aider à progresser et ne plus la refaire.
              </p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Aucune notion trouvée pour "{searchQuery}".
            </div>
          ) : (
            filteredRules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-md space-y-2.5 text-xs transition hover:border-sky-500/50"
              >
                {/* Rule Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-white text-xs leading-snug">
                      {rule.concept}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(rule.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* What was wrong */}
                <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200">
                  <span className="font-bold text-[10px] text-rose-300 block mb-0.5">
                    Ce qui bloquait le compilateur :
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-90">{rule.whatWasWrong}</p>
                </div>

                {/* Why Go works this way */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-200">
                  <span className="font-bold text-[10px] text-sky-300 block mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    Pourquoi le langage Go exige cela :
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {rule.whyGoWorksThisWay}
                  </p>
                </div>

                {/* Pro tip */}
                {rule.proTip && (
                  <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/30 text-amber-200 text-[11px] flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">Astuce : </strong>
                      {rule.proTip}
                    </div>
                  </div>
                )}

                {/* Fix label */}
                {rule.fixApplied && (
                  <div className="pt-1 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Correction appliquée : {rule.fixApplied}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>GopherPad Guide d'apprentissage Go</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

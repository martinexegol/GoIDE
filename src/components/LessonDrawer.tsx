import React from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { GO_LESSONS } from '../data/lessons';
import { GoLesson } from '../types';

interface LessonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lesson: GoLesson) => void;
  currentLessonId?: string;
}

export const LessonDrawer: React.FC<LessonDrawerProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
  currentLessonId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Apprendre Go
                <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded">
                  Go 1.23
                </span>
              </h2>
              <p className="text-xs text-slate-400">10 leçons interactives prêtes à exécuter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lesson List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {GO_LESSONS.map((lesson) => {
            const isSelected = lesson.id === currentLessonId;

            return (
              <div
                key={lesson.id}
                onClick={() => {
                  onSelectLesson(lesson);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-sky-950/50 border-sky-500/80 shadow-md ring-1 ring-sky-500/50'
                    : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      lesson.level.includes('Go 1.23')
                        ? 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800/80'
                        : lesson.level.includes('Go 1.22')
                        ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80'
                        : lesson.level === 'Débutant'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                        : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80'
                    }`}
                  >
                    {lesson.level}
                  </span>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] text-sky-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> En cours
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{lesson.title}</h3>
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">{lesson.summary}</p>

                {/* Key Concepts Preview */}
                <div className="space-y-1 mb-2.5">
                  {lesson.keyConcepts.slice(0, 2).map((concept, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                      <span className="truncate">{concept}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs">
                  <span className="text-slate-400 text-[11px]">Cliquer pour charger le code</span>
                  <span className="text-sky-400 font-medium flex items-center gap-1 group">
                    Ouvrir <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

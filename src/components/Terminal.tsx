import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Split,
  Info,
} from 'lucide-react';
import { CompileResult, ParsedError } from '../types';
import { GoDiagnostic, explainAndFixCompilerError } from '../services/goAnalyzer';

interface TerminalProps {
  result: CompileResult | null;
  isRunning: boolean;
  onClear: () => void;
  onJumpToError: (error: ParsedError) => void;
  parsedErrors: ParsedError[];
  onRunAgain: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  height: number;
  onHeightChange: (newHeight: number) => void;
  activeCode?: string;
  diagnostics?: GoDiagnostic[];
  isWin98?: boolean;
  isDark?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  result,
  isRunning,
  onClear,
  onJumpToError,
  parsedErrors,
  onRunAgain,
  isCollapsed,
  onToggleCollapse,
  height,
  onHeightChange,
  activeCode = '',
  diagnostics = [],
  isWin98 = false,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'errors'>('output');
  const [copied, setCopied] = useState(false);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(height);

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = [
      ...result.events.map((e) => e.Message),
      result.errors ? `Erreurs :\n${result.errors}` : '',
      result.vetErrors ? `Avertissements go vet :\n${result.vetErrors}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasErrors = (result && !!result.errors) || parsedErrors.length > 0;

  // Dragging logic for resizing code and terminal
  const onStartDrag = useCallback(
    (clientY: number) => {
      isDraggingRef.current = true;
      startYRef.current = clientY;
      startHeightRef.current = height;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    },
    [height]
  );

  const onDrag = useCallback(
    (clientY: number) => {
      if (!isDraggingRef.current) return;
      const deltaY = startYRef.current - clientY;
      const maxHeight = window.innerHeight * 0.82;
      const minHeight = 90;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeightRef.current + deltaY));
      onHeightChange(newHeight);
      if (isCollapsed) {
        onToggleCollapse();
      }
    },
    [onHeightChange, isCollapsed, onToggleCollapse]
  );

  const onStopDrag = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  }, []);

  // Global mouse / touch listeners for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        onDrag(e.clientY);
      }
    };

    const handleMouseUp = () => {
      onStopDrag();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches[0]) {
        onDrag(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      onStopDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onDrag, onStopDrag]);

  // Quick presets
  const setPreset = (mode: 'compact' | 'half' | 'max') => {
    if (isCollapsed) onToggleCollapse();
    const available = window.innerHeight - 100;
    if (mode === 'compact') {
      onHeightChange(180);
    } else if (mode === 'half') {
      onHeightChange(Math.round(available * 0.48));
    } else if (mode === 'max') {
      onHeightChange(Math.round(available * 0.78));
    }
  };

  return (
    <div
      className={`flex flex-col transition-none select-text relative shrink-0 ${
        isWin98
          ? 'bg-[#c0c0c0] border-t-2 border-t-[#808080]'
          : 'bg-[#050811] border-t border-slate-800'
      }`}
      style={{
        height: isCollapsed ? (isWin98 ? '44px' : '40px') : `${height}px`,
      }}
    >
      {/* Draggable Resizer Handle Bar */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onStartDrag(e.clientY);
        }}
        onTouchStart={(e) => {
          if (e.touches[0]) onStartDrag(e.touches[0].clientY);
        }}
        className={`w-full h-2.5 cursor-row-resize flex items-center justify-center transition-colors group select-none touch-none ${
          isWin98
            ? 'bg-[#c0c0c0] hover:bg-[#b0b0b0] border-t border-t-white border-b border-b-[#808080]'
            : 'bg-slate-900/90 hover:bg-sky-500/30 active:bg-sky-500/50 border-t border-slate-800'
        }`}
        title="Glisser vers le haut ou le bas pour redimensionner le cadre Code / Terminal"
      >
        <div
          className={`w-16 h-1 rounded-full transition-colors ${
            isWin98
              ? 'bg-[#808080] group-hover:bg-[#404040]'
              : 'bg-slate-700 group-hover:bg-sky-400 group-active:bg-sky-300'
          }`}
        />
      </div>

      {/* Terminal Top Bar */}
      <div
        className={`flex items-center justify-between px-3 h-9 shrink-0 select-none ${
          isWin98
            ? 'bg-[#c0c0c0] border-b border-b-[#808080]'
            : 'bg-slate-900/90 border-b border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <TerminalIcon className={`w-3.5 h-3.5 ${isWin98 ? 'text-[#000080]' : 'text-sky-400'}`} />
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isWin98 ? 'text-black font-sans' : 'text-slate-200'
              }`}
            >
              {isWin98 ? 'Invite MS-DOS / Console Go' : 'Terminal'}
            </span>
          </div>

          {/* Status Indicator */}
          {isRunning ? (
            <span
              className={`flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-full animate-pulse ${
                isWin98
                  ? 'text-[#000080] bg-[#e0e0e0] border border-[#000080]'
                  : 'text-sky-400 bg-sky-950/80 border border-sky-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isWin98 ? 'bg-[#000080]' : 'bg-sky-400'} animate-ping`} />
              Compilation...
            </span>
          ) : result ? (
            result.success ? (
              <span
                className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  isWin98
                    ? 'text-emerald-800 bg-[#e0f2e9] border border-emerald-600 font-bold'
                    : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Succès {result.executionTimeMs ? `(${result.executionTimeMs}ms)` : ''}
              </span>
            ) : (
              <span
                className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  isWin98
                    ? 'text-rose-800 bg-[#fee2e2] border border-rose-600 font-bold'
                    : 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Erreur
              </span>
            )
          ) : diagnostics && diagnostics.length > 0 ? (
            <span
              className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md ${
                isWin98
                  ? 'text-rose-800 bg-[#fee2e2] border border-rose-600 font-bold'
                  : 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              {diagnostics.length} erreur{diagnostics.length > 1 ? 's' : ''} (log)
            </span>
          ) : (
            <span className={`text-[11px] font-mono ${isWin98 ? 'text-[#505050]' : 'text-slate-500'}`}>
              Prêt
            </span>
          )}

          {/* Tabs */}
          {!isCollapsed && (
            <div className={`flex items-center ml-2 pl-2 gap-1 ${isWin98 ? 'border-l border-[#808080]' : 'border-l border-slate-700/60'}`}>
              <button
                onClick={() => setActiveTab('output')}
                className={
                  isWin98
                    ? `text-xs px-2.5 py-0.5 font-sans font-medium transition-none ${
                        activeTab === 'output'
                          ? 'bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-r-[#404040] border-b-[#c0c0c0] shadow-[inset_1px_1px_0px_#dfdfdf]'
                          : 'bg-[#b0b0b0] text-[#404040] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#808080]'
                      }`
                    : `text-xs px-2 py-0.5 rounded transition ${
                        activeTab === 'output'
                          ? 'bg-slate-800 text-sky-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`
                }
              >
                Sortie
              </button>
              {hasErrors && (
                <button
                  onClick={() => setActiveTab('errors')}
                  className={
                    isWin98
                      ? `text-xs px-2.5 py-0.5 font-sans font-medium flex items-center gap-1 transition-none ${
                          activeTab === 'errors'
                            ? 'bg-[#c0c0c0] text-rose-800 font-bold border-2 border-t-white border-l-white border-r-[#404040] border-b-[#c0c0c0] shadow-[inset_1px_1px_0px_#dfdfdf]'
                            : 'bg-[#b0b0b0] text-rose-700 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#808080]'
                        }`
                      : `text-xs px-2 py-0.5 rounded flex items-center gap-1 transition ${
                          activeTab === 'errors'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 font-medium'
                            : 'text-rose-400 hover:bg-rose-950/40'
                        }`
                  }
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Erreurs ({parsedErrors.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons & Resize presets */}
        <div className="flex items-center gap-1">
          {/* Quick Resize Presets */}
          {!isCollapsed && (
            <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/80 mr-1.5">
              <button
                onClick={() => setPreset('compact')}
                className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white rounded transition"
                title="Taille compacte (25% écran)"
              >
                25%
              </button>
              <button
                onClick={() => setPreset('half')}
                className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white rounded transition"
                title="Taille partagée 50/50"
              >
                50%
              </button>
              <button
                onClick={() => setPreset('max')}
                className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white rounded transition"
                title="Agrandir au maximum (Focus Terminal)"
              >
                75%
              </button>
            </div>
          )}

          {!isCollapsed && result && (
            <>
              <button
                onClick={onRunAgain}
                disabled={isRunning}
                className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition disabled:opacity-40"
                title="Relancer l'exécution"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                title="Copier la sortie"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onClear}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                title="Effacer le terminal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition ml-1"
            title={isCollapsed ? 'Agrandir le terminal' : 'Réduire le terminal'}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {!isCollapsed && (
        <div
          className={`flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed ${
            isWin98
              ? 'bg-black text-[#e0e0e0] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white m-1.5 selection:bg-[#000080] selection:text-white shadow-[inset_1px_1px_0px_#000000]'
              : 'text-slate-200 selection:bg-sky-500/30'
          }`}
        >
          {isRunning ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Compilation et exécution du programme Go en cours...</span>
              <span className="text-[11px] text-slate-500">
                Compilateur officiel Go (version la plus récente)
              </span>
            </div>
          ) : !result ? (
            diagnostics && diagnostics.length > 0 ? (
              <div className="space-y-2 font-mono text-xs">
                <div className="text-slate-400 select-none flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">$</span>
                    <span>go vet ./...</span>
                    <span className="text-rose-400 text-[11px] font-sans font-bold">
                      ({diagnostics.length} erreur{diagnostics.length > 1 ? 's' : ''} détectée{diagnostics.length > 1 ? 's' : ''} avant compilation)
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {diagnostics.map((d, idx) => (
                    <div
                      key={d.id || idx}
                      onClick={() => onJumpToError({ line: d.line, column: d.column, message: d.message, raw: d.message })}
                      className="p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 transition cursor-pointer flex items-start justify-between gap-3 group"
                      title="Cliquer pour positionner le curseur sur la ligne de l'erreur"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-rose-400 font-bold shrink-0">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          ./main.go:{d.line}{d.column ? `:${d.column}` : ''}:
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-rose-200 font-medium break-words">
                            {d.message}
                          </span>
                          {d.explanation && (
                            <div className="text-slate-400 text-[11px] font-sans pt-0.5">
                              💡 {d.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                <div className="text-slate-500 select-none">
                  <span className="text-emerald-400">$</span> go vet ./...
                </div>
                <div className="text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Aucune erreur détectée. Prêt pour l'exécution.</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 font-sans">
                  Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 font-semibold">Exécuter ▶</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">Ctrl+Enter</kbd> pour compiler et lancer votre code instantanément.
                </p>
              </div>
            )
          ) : activeTab === 'errors' && hasErrors ? (
            <div className="space-y-3 font-sans">
              <div className="text-rose-400 font-bold mb-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Rapport d'erreurs du compilateur Go ({parsedErrors.length})</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  Cliquez sur une ligne pour naviguer dans l'éditeur
                </span>
              </div>

              {parsedErrors.map((err, idx) => {
                const diag = explainAndFixCompilerError(err.message, activeCode, err.line || 1);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border text-left bg-slate-900/90 border-rose-800/70 shadow-md space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {err.line && (
                          <button
                            onClick={() => onJumpToError(err)}
                            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 hover:bg-rose-950 transition flex items-center gap-1 mt-0.5"
                            title="Aller à la ligne dans l'éditeur"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Ligne {err.line}{err.column ? `:${err.column}` : ''}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                        <span className="text-rose-100 font-semibold leading-snug break-words">
                          {err.message}
                        </span>
                      </div>
                    </div>

                    {/* Educational Insight Box */}
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 space-y-1 text-[11px] leading-relaxed">
                      <div className="flex items-center gap-1 font-bold text-sky-400 text-[10px] uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5" />
                        <span>🎓 Ce qu'il faut comprendre en Go :</span>
                      </div>
                      <p className="text-slate-300">
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
                );
              })}
            </div>
          ) : (
            <div>
              {/* Terminal command banner */}
              <div className="text-slate-500 mb-2 select-none">
                <span className="text-emerald-400">$</span> go run main.go
              </div>

              {/* Standard Output Events */}
              {result.events.length > 0 ? (
                <div className="space-y-0.5 whitespace-pre-wrap">
                  {result.events.map((ev, index) => (
                    <div
                      key={index}
                      className={
                        ev.Kind === 'stderr'
                          ? 'text-rose-400 font-mono'
                          : 'text-slate-100 font-mono'
                      }
                    >
                      {ev.Message}
                    </div>
                  ))}
                </div>
              ) : result.success && !result.errors ? (
                <div className="text-slate-400 italic">
                  (Le programme s'est terminé sans rien afficher sur la sortie standard)
                </div>
              ) : null}

              {/* Compile Errors */}
              {result.errors && (
                <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300">
                  <div className="flex items-center justify-between gap-2 font-bold text-rose-200 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Erreur de compilation Go :</span>
                    </div>
                  </div>
                  <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {result.errors}
                  </div>
                </div>
              )}

              {/* Vet Errors */}
              {result.vetErrors && (
                <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 whitespace-pre-wrap text-[11px]">
                  <span className="font-semibold text-amber-200">Avertissement go vet :</span>
                  <div>{result.vetErrors}</div>
                </div>
              )}

              {/* Exit Code / Success Banner */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] flex items-center justify-between text-slate-500 select-none">
                <span>
                  Processus terminé {result.success ? 'avec code de retour 0' : 'avec des erreurs'}
                </span>
                {result.executionTimeMs && <span>Temps d'exécution : {result.executionTimeMs} ms</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Sparkles, ArrowRightToLine } from 'lucide-react';

interface MobileAccessoryBarProps {
  onInsert: (snippet: string) => void;
  onOpenCompletions?: () => void;
}

export const MobileAccessoryBar: React.FC<MobileAccessoryBarProps> = ({
  onInsert,
  onOpenCompletions,
}) => {
  const quickKeys = [
    { label: 'Tab', value: '\t', icon: ArrowRightToLine, highlight: true },
    { label: 'package main', value: 'package main', highlight: true },
    { label: ':=', value: ' := ', highlight: true },
    { label: 'var', value: 'var ', highlight: true },
    { label: '<-', value: ' <- ', highlight: true },
    { label: '{ }', value: '{}' },
    { label: '( )', value: '()' },
    { label: '[ ]', value: '[]' },
    { label: '" "', value: '""' },
    { label: ':', value: ':' },
    { label: ';', value: ';' },
    { label: '.', value: '.' },
    { label: ',', value: ', ' },
    { label: '&', value: '&' },
    { label: '*', value: '*' },
    { label: 'err!=nil', value: 'err!=nil', highlight: true },
    { label: 'fmt.', value: 'fmt.', highlight: true },
    { label: 'func', value: 'func ' },
    { label: 'return', value: 'return ' },
    { label: 'range', value: 'range ' },
    { label: 'any', value: 'any' },
    { label: 'nil', value: 'nil' },
  ];

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800/80 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none z-20 backdrop-blur-md">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-mono font-bold tracking-wider text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/50 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> GO 1.23
        </span>

        {onOpenCompletions && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onOpenCompletions();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              onOpenCompletions();
            }}
            title="Ouvrir le menu d'auto-complétion (reste affiché 40s)"
            className="h-7 px-2.5 rounded-md font-mono text-xs font-semibold flex items-center justify-center gap-1 shrink-0 transition active:scale-95 touch-manipulation bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>Compléter (40s)</span>
          </button>
        )}

        {quickKeys.map((item) => (
          <button
            key={item.label}
            type="button"
            onMouseDown={(e) => {
              // Prevent editor from losing focus
              e.preventDefault();
              onInsert(item.value);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              onInsert(item.value);
            }}
            className={`h-7 px-2.5 rounded-md font-mono text-xs font-medium flex items-center justify-center shrink-0 transition active:scale-95 touch-manipulation ${
              item.highlight
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30'
                : 'bg-slate-800 text-slate-200 border border-slate-700/70 hover:bg-slate-700/70 active:bg-slate-700'
            }`}
          >
            {item.icon ? (
              <item.icon className="w-3.5 h-3.5" />
            ) : (
              <span>{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

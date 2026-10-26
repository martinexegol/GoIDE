/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { go } from '@codemirror/lang-go';
import {
  autocompletion,
  acceptCompletion,
  moveCompletionSelection,
  closeCompletion,
  startCompletion,
  CompletionContext,
  Completion,
  snippet,
} from '@codemirror/autocomplete';
import { linter, lintGutter, Diagnostic as CmDiagnostic } from '@codemirror/lint';
import { keymap, EditorView } from '@codemirror/view';
import { Prec, Extension } from '@codemirror/state';
import {
  buildCompletionsList,
  getPackageMembers,
  PRINT_DECLINATIONS,
  VAR_TYPE_COMPLETIONS,
} from '../data/goCompletions';
import { analyzeGoCode } from '../services/goAnalyzer';
import { ThemeId, getThemeExtension, AVAILABLE_THEMES } from '../theme/goThemes';
import { ParsedError } from '../types';

export interface EditorHandle {
  insertSnippet: (text: string) => void;
  jumpToLine: (lineNumber: number) => void;
  applyFix: (fixFn: (code: string) => string) => void;
  format: () => void;
  focus: () => void;
}

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  fontSize?: number;
  highlightedError?: ParsedError | null;
  themeId?: ThemeId;
}

/**
 * Automatically inserts import statement into the Go file if missing
 */
function insertImportIfNeeded(view: EditorView, pkgName: string) {
  if (!pkgName) return;
  const docText = view.state.doc.toString();

  // If already imported, do nothing
  const importRegex = new RegExp(`"${pkgName}"|"${pkgName}/`);
  if (importRegex.test(docText)) {
    return;
  }

  // Find package declaration
  const pkgMatch = docText.match(/package\s+\w+/);
  if (!pkgMatch) return;

  // Check if an import ( ... ) block exists
  const blockImportMatch = docText.match(/import\s*\(([\s\S]*?)\)/);
  if (blockImportMatch && blockImportMatch.index !== undefined) {
    const openParenIdx = blockImportMatch[0].indexOf('(');
    const insertPos = blockImportMatch.index + openParenIdx + 1;
    view.dispatch({
      changes: {
        from: insertPos,
        to: insertPos,
        insert: `\n\t"${pkgName}"`,
      },
    });
    return;
  }

  // Check if a single import "..." exists
  const singleImportMatch = docText.match(/import\s+"[^"]+"/);
  if (singleImportMatch && singleImportMatch.index !== undefined) {
    const insertPos = singleImportMatch.index + singleImportMatch[0].length;
    view.dispatch({
      changes: {
        from: insertPos,
        to: insertPos,
        insert: `\nimport "${pkgName}"`,
      },
    });
    return;
  }

  // No import found: create import block right after package statement
  const insertPos = pkgMatch.index! + pkgMatch[0].length;
  view.dispatch({
    changes: {
      from: insertPos,
      to: insertPos,
      insert: `\n\nimport (\n\t"${pkgName}"\n)`,
    },
  });
}

export const Editor = forwardRef<EditorHandle, EditorProps>(({
  value,
  onChange,
  onRun,
  fontSize = 14,
  highlightedError,
  themeId = 'gopher-dark',
}, ref) => {
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  // Expose imperative handle for mobile touch bar, fixes, and error jumping
  useImperativeHandle(ref, () => ({
    insertSnippet: (snippetText: string) => {
      const view = cmRef.current?.view;
      if (!view) return;

      const state = view.state;
      const selection = state.selection.main;

      let insertContent = snippetText;
      let cursorOffset = snippetText.length;

      // Smart cursor positioning for paired symbols
      if (snippetText === 'var ' || snippetText === 'var') {
        view.dispatch({
          changes: {
            from: selection.from,
            to: selection.to,
            insert: 'var ',
          },
          selection: { anchor: selection.from + 4 },
        });
        view.focus();
        setTimeout(() => {
          startCompletion(view);
        }, 50);
        return;
      } else if (snippetText === '{}') {
        insertContent = '{\n\t\n}';
        cursorOffset = 3;
      } else if (snippetText === '()') {
        insertContent = '()';
        cursorOffset = 1;
      } else if (snippetText === '[]') {
        insertContent = '[]';
        cursorOffset = 1;
      } else if (snippetText === '""') {
        insertContent = '""';
        cursorOffset = 1;
      } else if (snippetText === 'err!=nil') {
        insertContent = 'if err != nil {\n\treturn err\n}';
        cursorOffset = insertContent.length;
      }

      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: insertContent,
        },
        selection: { anchor: selection.from + cursorOffset },
      });
      view.focus();
    },

    jumpToLine: (lineNumber: number) => {
      const view = cmRef.current?.view;
      if (!view || lineNumber < 1) return;

      try {
        const line = view.state.doc.line(Math.min(lineNumber, view.state.doc.lines));
        view.dispatch({
          selection: { anchor: line.from },
          scrollIntoView: true,
        });
        view.focus();
      } catch (err) {
        console.error('Failed to jump to line:', err);
      }
    },

    applyFix: (fixFn: (code: string) => string) => {
      const view = cmRef.current?.view;
      if (!view) return;
      const currentCode = view.state.doc.toString();
      const fixed = fixFn(currentCode);
      view.dispatch({
        changes: { from: 0, to: currentCode.length, insert: fixed },
      });
      onChange(fixed);
      view.focus();
    },

    format: () => {
      // Handled via parent gofmt
    },

    focus: () => {
      cmRef.current?.view?.focus();
    },
  }));

  // Jump to error line when highlightedError changes
  useEffect(() => {
    if (highlightedError && highlightedError.line) {
      const view = cmRef.current?.view;
      if (view) {
        try {
          const lineNum = Math.min(highlightedError.line, view.state.doc.lines);
          const line = view.state.doc.line(lineNum);
          view.dispatch({
            selection: { anchor: line.from },
            scrollIntoView: true,
          });
        } catch {
          // ignore out of bounds
        }
      }
    }
  }, [highlightedError]);

  // Build the rich Go autocompletion list
  const completions = useMemo(() => buildCompletionsList(), []);

  // Configure CodeMirror extensions
  const extensions = useMemo<Extension[]>(() => {
    // 1. Completion source function for Go
    const goCompletionSource = (context: CompletionContext) => {
      const line = context.state.doc.lineAt(context.pos);
      const textBefore = line.text.slice(0, context.pos - line.from);

      // Check if user is typing after a package dot (e.g. "fmt." or "slices.")
      const dotMatch = textBefore.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/);

      if (dotMatch) {
        const pkg = dotMatch[1];
        const memberQuery = dotMatch[2].toLowerCase();
        const from = context.pos - dotMatch[2].length;

        const members = getPackageMembers(pkg);
        if (members.length > 0) {
          const matchedMembers = members.filter((m) => {
            if (!memberQuery) return true;
            return (
              m.label.toLowerCase().includes(memberQuery) ||
              m.detail.toLowerCase().includes(memberQuery) ||
              (m.keywords && m.keywords.some((k) => k.includes(memberQuery)))
            );
          });

          return {
            from,
            options: matchedMembers.map((m) => {
              const baseSnippet = m.template ? snippet(m.template) : null;
              return {
                label: m.label,
                detail: m.detail,
                info: m.info,
                type: m.type,
                boost: (m.boost ?? 10) + 15,
                apply: (view: EditorView, completion: Completion, fromPos: number, toPos: number) => {
                  if (baseSnippet) {
                    baseSnippet(view, completion, fromPos, toPos);
                  } else {
                    view.dispatch({
                      changes: { from: fromPos, to: toPos, insert: m.label },
                    });
                  }
                  if (m.pkg) {
                    insertImportIfNeeded(view, m.pkg);
                  }
                },
              };
            }),
            validFor: /^[a-zA-Z0-9_]*$/,
          };
        }
      }

      // Check if user just typed "var " -> automatically trigger the variable types menu!
      const varMatch = textBefore.match(/(?:^|\s)var\s+([a-zA-Z0-9_]*)$/);
      if (varMatch) {
        const subquery = varMatch[1].toLowerCase();
        const from = context.pos - varMatch[1].length;

        const matchedTypes = VAR_TYPE_COMPLETIONS.filter((item) => {
          if (!subquery) return true;
          return (
            item.label.toLowerCase().includes(subquery) ||
            item.detail.toLowerCase().includes(subquery) ||
            (item.keywords && item.keywords.some((k) => k.includes(subquery)))
          );
        });

        return {
          from,
          options: matchedTypes.map((item) => {
            const baseSnippet = item.template ? snippet(item.template) : null;
            return {
              label: item.label,
              detail: item.detail,
              info: item.info,
              type: item.type,
              boost: (item.boost ?? 20) + 40,
              apply: (view: EditorView, completion: Completion, fromPos: number, toPos: number) => {
                if (baseSnippet) {
                  baseSnippet(view, completion, fromPos, toPos);
                } else {
                  view.dispatch({
                    changes: { from: fromPos, to: toPos, insert: item.label },
                  });
                }
                if (item.pkg) {
                  insertImportIfNeeded(view, item.pkg);
                }
              },
            };
          }),
          validFor: /^[a-zA-Z0-9_]*$/,
        };
      }

      // General word matching
      const word = context.matchBefore(/[\w.]+/);
      if (!word && !context.explicit) return null;

      const query = word ? word.text.toLowerCase() : '';
      const isPrintQuery = 'print'.startsWith(query) || query.startsWith('print') || query === 'p' || query === 'pr';

      const matched: Completion[] = [];

      // If query is specifically related to print, prioritize all Print declinations
      if (isPrintQuery) {
        for (const item of PRINT_DECLINATIONS) {
          const baseSnippet = item.template ? snippet(item.template) : null;
          matched.push({
            label: item.label,
            detail: item.detail,
            info: item.info,
            type: item.type,
            boost: (item.boost ?? 20) + 20,
            apply: (view: EditorView, completion: Completion, fromPos: number, toPos: number) => {
              if (baseSnippet) {
                baseSnippet(view, completion, fromPos, toPos);
              } else {
                view.dispatch({
                  changes: { from: fromPos, to: toPos, insert: item.label },
                });
              }
              if (item.pkg) {
                insertImportIfNeeded(view, item.pkg);
              }
            },
          });
        }
      }

      for (const c of completions) {
        const labelLower = c.label.toLowerCase();
        const detailLower = c.detail ? c.detail.toLowerCase() : '';

        if (isPrintQuery && matched.some((m) => m.label === c.label)) {
          continue;
        }

        if (labelLower.includes(query) || detailLower.includes(query)) {
          matched.push(c);
        }
      }

      return {
        from: word ? word.from : context.pos,
        options: matched,
        validFor: /^[\w.]*$/,
      };
    };

    // 2. Keyboard navigation bindings:
    // Arrow keys navigate, Enter validates
    const customKeymap = Prec.highest(
      keymap.of([
        {
          key: 'ArrowDown',
          run: moveCompletionSelection(true),
        },
        {
          key: 'ArrowUp',
          run: moveCompletionSelection(false),
        },
        {
          key: 'Enter',
          run: acceptCompletion,
        },
        {
          key: 'Tab',
          run: acceptCompletion,
        },
        {
          key: 'Escape',
          run: closeCompletion,
        },
        {
          key: 'Mod-Space',
          run: startCompletion,
        },
        {
          key: 'Mod-Enter',
          run: () => {
            onRun();
            return true;
          },
        },
      ])
    );

    // 3. Real-Time Automatic Error Detection & In-Editor Quick-Fixes
    const goLinter = linter(
      (view) => {
        const code = view.state.doc.toString();
        const diagnostics = analyzeGoCode(code);
        const cmDiagnostics: CmDiagnostic[] = [];

        for (const d of diagnostics) {
          const docLen = view.state.doc.length;
          const from = Math.max(0, Math.min(d.from ?? 0, docLen));
          const to = Math.max(from, Math.min(d.to ?? from + 1, docLen));

          const explanationText = d.insight
            ? `${d.message}\n\n🎓 Ce qu'il faut comprendre en Go :\n${d.insight.whyGoWorksThisWay}${d.insight.proTip ? `\n\n💡 Astuce : ${d.insight.proTip}` : ''}`
            : `${d.message}\n\n💡 ${d.explanation}`;

          cmDiagnostics.push({
            from,
            to,
            severity: d.severity === 'error' ? 'error' : d.severity === 'warning' ? 'warning' : 'info',
            message: explanationText,
            actions: d.fix
              ? [
                  {
                    name: `⚡ Corriger en 1 clic : ${d.fix.label}`,
                    apply: (editorView: EditorView) => {
                      const cur = editorView.state.doc.toString();
                      const fixed = d.fix!.apply(cur);
                      editorView.dispatch({
                        changes: { from: 0, to: cur.length, insert: fixed },
                      });
                      onChange(fixed);
                    },
                  },
                ]
              : undefined,
          });
        }

        return cmDiagnostics;
      },
      { delay: 250 }
    );

    // 4. Theme & Syntax highlighting extensions
    const themeExtensions = getThemeExtension(themeId);
    const themeConfig = AVAILABLE_THEMES.find((t) => t.id === themeId) || AVAILABLE_THEMES[0];
    const isDark = themeConfig.isDark;

    // 5. Base editor layout, diagnostics, & font styling
    const layoutTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        fontFamily: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: "'Fira Code', monospace",
        lineHeight: '1.6',
        paddingBottom: '80px',
      },
      // In-line diagnostics tooltip styling
      '.cm-tooltip-lint': {
        backgroundColor: isDark ? '#090d1a !important' : '#ffffff !important',
        border: `1.5px solid ${isDark ? '#e11d48' : '#f43f5e'} !important`,
        borderRadius: '12px !important',
        boxShadow: isDark
          ? '0 20px 30px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(225, 29, 72, 0.25) !important'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.15) !important',
        padding: '10px !important',
        minWidth: '280px',
        maxWidth: '440px',
        zIndex: '160 !important',
      },
      '.cm-diagnostic': {
        padding: '4px 0 !important',
        fontSize: '12px !important',
        fontFamily: "'Fira Code', monospace !important",
        lineHeight: '1.5 !important',
        color: isDark ? '#f1f5f9 !important' : '#0f172a !important',
      },
      '.cm-diagnosticAction': {
        marginTop: '8px !important',
        padding: '5px 10px !important',
        backgroundColor: '#00ADD8 !important',
        color: '#020617 !important',
        fontWeight: 'bold !important',
        fontSize: '11px !important',
        borderRadius: '6px !important',
        border: 'none !important',
        cursor: 'pointer !important',
        display: 'inline-flex !important',
        alignItems: 'center !important',
        gap: '4px !important',
        transition: 'transform 0.1s ease !important',
      },
      '.cm-diagnosticAction:active': {
        transform: 'scale(0.96) !important',
      },
      // Gutter lint marks
      '.cm-lint-marker': {
        width: '12px',
        height: '12px',
        cursor: 'pointer',
      },
      '.cm-lint-marker-error': {
        content: '""',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#f43f5e',
        boxShadow: '0 0 6px #f43f5e',
        marginLeft: '4px',
      },
      '.cm-lint-marker-warning': {
        content: '""',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#f59e0b',
        boxShadow: '0 0 6px #f59e0b',
        marginLeft: '4px',
      },
      // Base Tooltip Override
      '.cm-tooltip': {
        backgroundColor: isDark ? '#090d1a !important' : '#ffffff !important',
        color: isDark ? '#f8fafc !important' : '#0f172a !important',
        border: `1.5px solid ${isDark ? themeConfig.borderHex : '#94a3b8'} !important`,
      },
      // Autocomplete Popup Box Styling
      '.cm-tooltip-autocomplete': {
        backgroundColor: isDark ? '#090d1a !important' : '#ffffff !important',
        border: `2px solid ${isDark ? themeConfig.borderHex : '#0284c7'} !important`,
        borderRadius: '12px !important',
        boxShadow: isDark
          ? '0 20px 30px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 173, 216, 0.25) !important'
          : '0 20px 35px -5px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(2, 132, 199, 0.15) !important',
        padding: '6px !important',
        minWidth: '330px',
        maxWidth: 'min(520px, calc(100vw - 24px))',
        zIndex: '150 !important',
      },
      '.cm-tooltip-autocomplete ul': {
        fontFamily: "'Fira Code', monospace",
        maxHeight: '260px',
      },
      '.cm-tooltip-autocomplete ul li': {
        padding: '8px 12px !important',
        borderRadius: '8px !important',
        margin: '2px 0 !important',
        color: isDark ? '#f1f5f9 !important' : '#0f172a !important',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        gap: '10px',
        transition: 'background-color 0.1s ease',
      },
      '.cm-tooltip-autocomplete ul li:hover:not([aria-selected])': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08) !important' : '#f0f9ff !important',
        color: isDark ? '#ffffff !important' : '#0369a1 !important',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: isDark ? `${themeConfig.badgeBg} !important` : '#0284c7 !important',
        color: '#ffffff !important',
        fontWeight: '600 !important',
        boxShadow: isDark
          ? '0 2px 10px rgba(0, 0, 0, 0.5) !important'
          : '0 4px 12px rgba(2, 132, 199, 0.35) !important',
      },
      // Completion Labels (Function/keyword/variable name)
      '.cm-completionLabel': {
        color: isDark ? '#38bdf8 !important' : '#0369a1 !important',
        fontWeight: '700 !important',
        fontSize: '13px !important',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionLabel': {
        color: '#ffffff !important',
        fontWeight: '700 !important',
      },
      // Matched typed characters highlighting
      '.cm-completionMatchedText': {
        color: isDark ? '#00ADD8 !important' : '#0284c7 !important',
        fontWeight: '800 !important',
        textDecoration: 'underline !important',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionMatchedText': {
        color: '#ffffff !important',
        fontWeight: '800 !important',
        textDecoration: 'underline !important',
      },
      // Icons
      '.cm-completionIcon': {
        color: isDark ? '#38bdf8 !important' : '#0284c7 !important',
        marginRight: '6px !important',
        opacity: '0.9 !important',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionIcon': {
        color: '#ffffff !important',
        opacity: '1 !important',
      },
      // Details Badge (Type / Signature / Package)
      '.cm-completionDetail': {
        color: isDark ? '#cbd5e1 !important' : '#334155 !important',
        fontStyle: 'normal',
        fontSize: '11px !important',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85) !important' : '#f1f5f9 !important',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1) !important' : '1px solid #cbd5e1 !important',
        padding: '2px 7px',
        borderRadius: '5px',
        marginLeft: 'auto',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '220px',
      },
      '.cm-tooltip-autocomplete ul li[aria-selected] .cm-completionDetail': {
        color: '#ffffff !important',
        backgroundColor: 'rgba(0, 0, 0, 0.28) !important',
        border: '1px solid rgba(255, 255, 255, 0.3) !important',
      },
      // Explanation Box (Info / documentation panel next to suggestions)
      '.cm-tooltip-completionInfo, .cm-completionInfo': {
        backgroundColor: isDark ? '#0f172a !important' : '#ffffff !important',
        border: `2px solid ${isDark ? themeConfig.borderHex : '#0284c7'} !important`,
        borderRadius: '10px !important',
        color: isDark ? '#f8fafc !important' : '#0f172a !important',
        padding: '12px 14px !important',
        minWidth: '280px',
        maxWidth: 'min(460px, calc(100vw - 32px)) !important',
        fontSize: '12px !important',
        lineHeight: '1.55 !important',
        boxShadow: isDark
          ? '0 15px 30px rgba(0, 0, 0, 0.7) !important'
          : '0 12px 28px -4px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(2, 132, 199, 0.15) !important',
        whiteSpace: 'pre-wrap !important',
        fontFamily: "'Fira Code', monospace !important",
      },
    });

    return [
      go(),
      ...themeExtensions,
      layoutTheme,
      customKeymap,
      lintGutter(),
      goLinter,
      autocompletion({
        override: [goCompletionSource],
        activateOnTyping: true,
        selectOnOpen: true,
        maxRenderedOptions: 30,
        defaultKeymap: false,
      }),
      EditorView.lineWrapping,
    ];
  }, [completions, fontSize, onRun, themeId, onChange]);

  const isDark = AVAILABLE_THEMES.find((t) => t.id === themeId)?.isDark ?? true;
  const currentThemeConfig = AVAILABLE_THEMES.find((t) => t.id === themeId) || AVAILABLE_THEMES[0];

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: currentThemeConfig.bgHex }}
    >
      <CodeMirror
        ref={cmRef}
        value={value}
        height="100%"
        className="w-full h-full text-sm"
        theme={isDark ? 'dark' : 'light'}
        extensions={extensions}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: false,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: false,
          lintKeymap: true,
          tabSize: 4,
        }}
      />
    </div>
  );
});

Editor.displayName = 'Editor';

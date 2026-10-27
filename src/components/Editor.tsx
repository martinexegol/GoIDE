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
  selectedCompletion,
  currentCompletions,
  setSelectedCompletion,
  CompletionContext,
  Completion,
  snippet,
} from '@codemirror/autocomplete';
import { keymap, EditorView, gutter, GutterMarker } from '@codemirror/view';
import { Prec, Extension } from '@codemirror/state';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import {
  buildCompletionsList,
  getPackageMembers,
  PRINT_DECLINATIONS,
  VAR_TYPE_COMPLETIONS,
} from '../data/goCompletions';
import { ThemeId, getThemeExtension, AVAILABLE_THEMES } from '../theme/goThemes';
import { ParsedError } from '../types';

/**
 * Gutter marker displaying a clean, elegant red dot on lines with errors
 */
class ErrorDotMarker extends GutterMarker {
  toDOM() {
    const dot = document.createElement('div');
    dot.className = 'cm-error-dot';
    dot.title = 'Erreur détectée sur cette ligne';
    return dot;
  }
}
const errorDotMarker = new ErrorDotMarker();

function createErrorGutter(lines: number[]) {
  const lineSet = new Set(lines.filter((l) => l > 0));
  return gutter({
    class: 'cm-error-gutter',
    lineMarker(view, line) {
      const lineObj = view.state.doc.lineAt(line.from);
      return lineSet.has(lineObj.number) ? errorDotMarker : null;
    },
    lineMarkerChange: (update) => update.docChanged,
  });
}

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
  errorLines?: number[];
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
  errorLines = [],
}, ref) => {
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  // Expose imperative handle for mobile touch bar and actions
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
          // line out of bounds
        }
      }
    }
  }, [highlightedError]);

  // Completions list
  const completions = useMemo(() => buildCompletionsList(), []);

  // Configure CodeMirror extensions
  const extensions = useMemo<Extension[]>(() => {
    const themeExtensions = getThemeExtension(themeId);
    const themeConfig = AVAILABLE_THEMES.find((t) => t.id === themeId) || AVAILABLE_THEMES[0];
    const isDark = themeConfig.isDark;

    // 1. Contextual autocompletion source with auto-import
    const goCompletionSource = (context: CompletionContext) => {
      const pos = context.pos;
      const line = context.state.doc.lineAt(pos);
      const textBefore = line.text.slice(0, pos - line.from);

      // Shorthand fp -> fmt.Println
      const isPrintlnShorthand = /\bfp\b$/.test(textBefore);
      if (isPrintlnShorthand) {
        return {
          from: pos - 2,
          options: [
            {
              label: 'fmt.Println(...)',
              detail: 'Raccourci fp',
              info: 'Affiche sur la sortie standard avec saut de ligne (ajoute import "fmt")',
              type: 'function',
              boost: 100,
              apply: (view: EditorView, completion: Completion, fromPos: number, toPos: number) => {
                view.dispatch({
                  changes: { from: fromPos, to: toPos, insert: 'fmt.Println()' },
                  selection: { anchor: fromPos + 12 },
                });
                insertImportIfNeeded(view, 'fmt');
              },
            },
          ],
        };
      }

      // Var types completion (only after typing "var <name> ")
      if (/\bvar\s+\w+\s*$/.test(textBefore)) {
        return {
          from: pos,
          options: VAR_TYPE_COMPLETIONS,
          validFor: /^[a-zA-Z0-9_]*$/,
        };
      }

      // Dot completion (e.g. fmt.)
      const dotMatch = textBefore.match(/([a-zA-Z0-9_]+)\.$/);
      if (dotMatch) {
        const pkgName = dotMatch[1];
        const members = getPackageMembers(pkgName);

        if (members.length === 0) {
          return null;
        }

        return {
          from: pos,
          options: members.map((item) => {
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

      // General word completion: requires at least 1 word character unless explicitly invoked via Ctrl+Space
      const word = context.matchBefore(/[\w.]+/);
      if (!word && !context.explicit) return null;
      if (word && word.text.trim().length === 0 && !context.explicit) return null;

      const query = word ? word.text.toLowerCase() : '';
      if (!query && !context.explicit) return null;

      const matched: Completion[] = [];

      const isPrintQuery =
        query === 'print' || query === 'println' || query === 'printf' || query === 'p';

      if (isPrintQuery) {
        for (const item of PRINT_DECLINATIONS) {
          const baseSnippet = item.template ? snippet(item.template) : null;
          matched.push({
            label: item.label,
            detail: item.detail,
            info: item.info,
            type: item.type,
            boost: item.boost ?? 25,
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

      if (matched.length === 0) return null;

      return {
        from: word ? word.from : context.pos,
        options: matched,
        validFor: /^[\w.]*$/,
      };
    };

    // 2. Keyboard navigation bindings
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
          run: (view) => {
            // Only accept completion if an option is actively highlighted in the popup
            if (selectedCompletion(view.state)) {
              return acceptCompletion(view);
            }
            return false;
          },
        },
        {
          key: 'Tab',
          run: (view) => {
            if (acceptCompletion(view)) return true;
            const activeOpts = currentCompletions(view.state);
            if (activeOpts.length > 0) {
              view.dispatch({ effects: setSelectedCompletion(0) });
              return acceptCompletion(view);
            }
            return false;
          },
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

    const layoutTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        fontFamily: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      '.cm-scroller': {
        lineHeight: '1.65',
        overflow: 'auto',
      },
      '.cm-content': {
        caretColor: isDark ? '#38bdf8' : '#0284c7',
        paddingBottom: '80px',
      },

      // Red dot gutter error marker styling
      '.cm-error-gutter': {
        width: '18px',
        backgroundColor: 'transparent',
      },
      '.cm-error-gutter .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 !important',
      },
      '.cm-error-dot': {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#ef4444',
        boxShadow: '0 0 6px rgba(239, 68, 68, 0.95), 0 0 12px rgba(239, 68, 68, 0.5)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
      },
      '.cm-error-dot:hover': {
        transform: 'scale(1.35)',
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
      '.cm-completionLabel': {
        color: isDark ? '#38bdf8 !important' : '#0369a1 !important',
        fontWeight: '700 !important',
        fontSize: '13px !important',
      },
      '.cm-completionMatchedText': {
        color: isDark ? '#00ADD8 !important' : '#0284c7 !important',
        fontWeight: '800 !important',
        textDecoration: 'underline !important',
      },
      '.cm-completionDetail': {
        color: isDark ? '#cbd5e1 !important' : '#334155 !important',
        fontStyle: 'normal',
        fontSize: '11px !important',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85) !important' : '#f1f5f9 !important',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1) !important' : '1px solid #cbd5e1 !important',
        padding: '2px 7px',
        borderRadius: '5px',
        marginLeft: 'auto',
      },
    });

    // Vertical indentation guide lines: connects starting point of an element to its closing
    // Each nested scope has its own indentation column so lines run parallel and never overlap
    const indentGuides = indentationMarkers({
      highlightActiveBlock: true,
      hideFirstIndent: false,
      markerType: 'fullScope',
      thickness: 1.5,
      activeThickness: 2,
      colors: {
        light: themeConfig.isWin98 ? '#9ca3af' : 'rgba(0, 0, 0, 0.15)',
        dark: 'rgba(255, 255, 255, 0.14)',
        activeLight: themeConfig.isWin98 ? '#000080' : '#0284c7',
        activeDark: themeConfig.accentHex || '#38bdf8',
      },
    });

    return [
      go(),
      ...themeExtensions,
      layoutTheme,
      ...indentGuides,
      createErrorGutter(errorLines),
      customKeymap,
      autocompletion({
        override: [goCompletionSource],
        activateOnTyping: true,
        selectOnOpen: false,
        maxRenderedOptions: 30,
        defaultKeymap: false,
      }),
      EditorView.lineWrapping,
    ];
  }, [completions, fontSize, onRun, themeId, onChange, errorLines]);

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
          lintKeymap: false,
          tabSize: 4,
        }}
      />
    </div>
  );
});

Editor.displayName = 'Editor';

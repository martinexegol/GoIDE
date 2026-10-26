import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Editor, EditorHandle } from './components/Editor';
import { MobileAccessoryBar } from './components/MobileAccessoryBar';
import { Terminal } from './components/Terminal';
import { DiagnosticBanner } from './components/DiagnosticBanner';
import { LessonDrawer } from './components/LessonDrawer';
import { FileDrawer } from './components/FileDrawer';
import { LearningToast } from './components/LearningToast';
import { LearningNotebookDrawer } from './components/LearningNotebookDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { runGoCode, parseGoErrors } from './services/goRunner';
import { formatGoCode } from './services/goFormatter';
import { analyzeGoCode, applyAllFixes, GoDiagnostic } from './services/goAnalyzer';
import { GoFile, CompileResult, ParsedError, GoLesson, LearnedRule } from './types';
import { ThemeId, AVAILABLE_THEMES } from './theme/goThemes';

const STORAGE_KEY_FILES = 'gopherpad_files_v1';
const STORAGE_KEY_ACTIVE = 'gopherpad_active_file_v1';
const STORAGE_KEY_FONT = 'gopherpad_font_size_v1';
const STORAGE_KEY_THEME = 'gopherpad_theme_v1';
const STORAGE_KEY_TERM_HEIGHT = 'gopherpad_terminal_height_v1';
const STORAGE_KEY_LEARNED_RULES = 'gopherpad_learned_rules_v1';

const INITIAL_CODE = `package main

import (
	"cmp"
	"fmt"
	"slices"
	"time"
)

func main() {
	fmt.Println("🐹 Bienvenue sur GopherPad IDE (Go 1.23) !")
	fmt.Println("----------------------------------------")

	// 1. Syntaxe moderne Go 1.22+ : range directement sur un nombre entier
	fmt.Println("1. Boucle d'entier (for i := range 4) :")
	for i := range 4 {
		fmt.Printf("   -> Itération %d\\n", i+1)
	}

	// 2. Fonctions modernes du package slices (Go 1.21+)
	fmt.Println("\\n2. Package standard 'slices' :")
	scores := []int{85, 92, 78, 99, 64}
	fmt.Println("   Slices initial :", scores)
	slices.Sort(scores)
	fmt.Println("   Slices trié en place :", scores)
	fmt.Printf("   Min: %d | Max: %d | Présence de 99 : %t\\n",
		slices.Min(scores), slices.Max(scores), slices.Contains(scores, 99))

	// 3. Fonction cmp.Or (Go 1.22+) : valeur de repli concise
	pseudoSaisi := ""
	pseudoFinal := cmp.Or(pseudoSaisi, "GopherCurieux")
	fmt.Printf("\\n3. Utilisateur actif (cmp.Or) : %s\\n", pseudoFinal)

	// 4. Horodatage d'exécution
	fmt.Printf("\\nCode exécuté avec succès à %s\\n", time.Now().Format("15:04:05"))
}
`;

const DEFAULT_FILES: GoFile[] = [
  {
    id: 'main-go',
    name: 'main.go',
    content: INITIAL_CODE,
    isMain: true,
  },
];

export default function App() {
  // Files state
  const [files, setFiles] = useState<GoFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved && files.some((f) => f.id === saved)) return saved;
    } catch {
      // fallback
    }
    return files[0]?.id || 'main-go';
  });

  // Editor settings
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FONT);
      if (saved) return parseInt(saved, 10);
    } catch {
      // fallback
    }
    return 14;
  });

  // Theme state: supports all 10 themes
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved && AVAILABLE_THEMES.some((t) => t.id === saved)) {
        return saved as ThemeId;
      }
    } catch {
      // fallback
    }
    return 'gopher-dark';
  });

  // Terminal height for resizable panel
  const [terminalHeight, setTerminalHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TERM_HEIGHT);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 90) return parsed;
      }
    } catch {
      // fallback
    }
    return 240;
  });

  // Save feedback state
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => new Date());

  // Compiler & Terminal states
  const [isRunning, setIsRunning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [parsedErrors, setParsedErrors] = useState<ParsedError[]>([]);
  const [highlightedError, setHighlightedError] = useState<ParsedError | null>(null);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  // Background debounced checker state
  const [isBackgroundChecking, setIsBackgroundChecking] = useState(false);
  const [serverDiagnostics, setServerDiagnostics] = useState<GoDiagnostic[]>([]);

  // Drawers & Learning System
  const [isLessonsOpen, setIsLessonsOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isLearningNotebookOpen, setIsLearningNotebookOpen] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | undefined>();

  // Learning Toast & Learned Rules tracking
  const [learningToastDiag, setLearningToastDiag] = useState<GoDiagnostic | null>(null);
  const [learningToastCount, setLearningToastCount] = useState<number>(1);
  const [learnedRules, setLearnedRules] = useState<LearnedRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEARNED_RULES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Ref to editor handle
  const editorRef = useRef<EditorHandle>(null);

  // Active file reference
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Real-time static diagnostics (0ms latency, runs as user types)
  const staticDiagnostics = useMemo(() => {
    if (!activeFile?.content) return [];
    return analyzeGoCode(activeFile.content);
  }, [activeFile?.content]);

  // Combined diagnostics (static rules + background compiler checks)
  const diagnostics = useMemo(() => {
    // If static analysis already found errors, prioritize them
    const combined = [...staticDiagnostics];
    for (const sDiag of serverDiagnostics) {
      if (!combined.some((c) => c.line === sDiag.line && c.message === sDiag.message)) {
        combined.push(sDiag);
      }
    }
    return combined;
  }, [staticDiagnostics, serverDiagnostics]);

  // Debounced background compiler verification to catch compiler-specific checks
  useEffect(() => {
    if (!activeFile?.content || staticDiagnostics.length > 0) {
      setServerDiagnostics([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsBackgroundChecking(true);
        const res = await runGoCode(activeFile.content);
        if (res.errors) {
          const parsed = parseGoErrors(res.errors);
          const newServerDiags: GoDiagnostic[] = parsed.map((p, idx) => ({
            id: `server-err-${idx}`,
            line: p.line || 1,
            column: p.column,
            severity: 'error',
            rule: 'compiler-error',
            message: p.message,
            explanation: `Détecté par le compilateur Go officiel : "${p.message}". Vous pouvez corriger la ligne avant de lancer l'exécution.`,
            raw: p.raw,
          }));
          setServerDiagnostics(newServerDiags);
        } else {
          setServerDiagnostics([]);
        }
      } catch {
        // ignore background errors
      } finally {
        setIsBackgroundChecking(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeFile?.content, staticDiagnostics.length]);

  // Save files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('Failed to persist files to localStorage:', err);
    }
  }, [files]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeFileId);
    } catch {
      // ignore
    }
  }, [activeFileId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FONT, fontSize.toString());
    } catch {
      // ignore
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, themeId);
    } catch {
      // ignore
    }
  }, [themeId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TERM_HEIGHT, terminalHeight.toString());
    } catch {
      // ignore
    }
  }, [terminalHeight]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEARNED_RULES, JSON.stringify(learnedRules));
    } catch (err) {
      console.warn('Failed to save learned rules:', err);
    }
  }, [learnedRules]);

  // Explicit save action
  const handleSaveWorkspace = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeFileId);
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('Failed to save workspace:', err);
    }
  }, [files, activeFileId]);

  // Code change handler
  const handleCodeChange = useCallback((newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );
  }, [activeFileId]);

  // Run compiler
  const handleRun = useCallback(async () => {
    if (isRunning || !activeFile) return;

    setIsRunning(true);
    setIsTerminalCollapsed(false);
    setHighlightedError(null);

    const result = await runGoCode(activeFile.content);
    setCompileResult(result);

    const errors = parseGoErrors(result.errors);
    setParsedErrors(errors);

    if (errors.length > 0 && errors[0].line) {
      setHighlightedError(errors[0]);
    }

    setIsRunning(false);
  }, [isRunning, activeFile]);

  // Format code (gofmt)
  const handleFormat = useCallback(async () => {
    if (isFormatting || !activeFile) return;

    setIsFormatting(true);
    const { formatted, error } = await formatGoCode(activeFile.content);

    if (!error && formatted) {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, content: formatted } : f))
      );
      setLastSavedAt(new Date());
    } else if (error) {
      console.warn('gofmt warning:', error);
    }
    setIsFormatting(false);
  }, [isFormatting, activeFile, activeFileId]);

  // Insert snippet from Mobile Accessory Bar
  const handleInsertSnippet = useCallback((snippetText: string) => {
    editorRef.current?.insertSnippet(snippetText);
  }, []);

  // Jump to error line
  const handleJumpToError = useCallback((error: ParsedError) => {
    setHighlightedError(error);
    if (error.line) {
      editorRef.current?.jumpToLine(error.line);
    }
  }, []);

  // Jump to line from DiagnosticBanner
  const handleJumpToLine = useCallback((line: number) => {
    editorRef.current?.jumpToLine(line);
  }, []);

  // Apply single diagnostic fix in 1 click and trigger educational lesson
  const handleApplyFix = useCallback((diag: GoDiagnostic) => {
    if (!diag.fix) return;

    // 1. Apply code modification
    if (editorRef.current) {
      editorRef.current.applyFix(diag.fix.apply);
    } else if (activeFile) {
      const fixedCode = diag.fix.apply(activeFile.content);
      handleCodeChange(fixedCode);
    }

    // 2. Archive to user's Learning Notebook
    const newLearnedRule: LearnedRule = {
      id: `rule-${Date.now()}-${diag.id}`,
      timestamp: Date.now(),
      concept: diag.insight?.concept || diag.rule,
      whatWasWrong: diag.insight?.whatWasWrong || diag.message,
      whyGoWorksThisWay: diag.insight?.whyGoWorksThisWay || diag.explanation,
      proTip: diag.insight?.proTip || '',
      fixApplied: diag.fix.label,
      ruleId: diag.rule,
    };

    setLearnedRules((prev) => [
      newLearnedRule,
      ...prev.filter((r) => r.ruleId !== diag.rule),
    ]);

    // 3. Display didactic Learning Toast so the user learns the Go concept!
    setLearningToastDiag(diag);
    setLearningToastCount(1);
  }, [activeFile, handleCodeChange]);

  // Apply all available fixes at once and present educational lessons
  const handleApplyAllFixes = useCallback(() => {
    if (!activeFile) return;
    const fixable = diagnostics.filter((d) => d.fix !== undefined);
    if (fixable.length === 0) return;

    // 1. Apply all fixes
    const fixedCode = applyAllFixes(activeFile.content, diagnostics);
    if (editorRef.current) {
      editorRef.current.applyFix(() => fixedCode);
    } else {
      handleCodeChange(fixedCode);
    }

    // 2. Archive all fixed rules into Learning Notebook
    const newRules: LearnedRule[] = fixable.map((d) => ({
      id: `rule-${Date.now()}-${d.id}`,
      timestamp: Date.now(),
      concept: d.insight?.concept || d.rule,
      whatWasWrong: d.insight?.whatWasWrong || d.message,
      whyGoWorksThisWay: d.insight?.whyGoWorksThisWay || d.explanation,
      proTip: d.insight?.proTip || '',
      fixApplied: d.fix?.label || 'Correction automatique',
      ruleId: d.rule,
    }));

    setLearnedRules((prev) => {
      const existingRuleIds = new Set(newRules.map((r) => r.ruleId));
      return [...newRules, ...prev.filter((r) => !existingRuleIds.has(r.ruleId))];
    });

    // 3. Show educational toast with the first fixed rule
    setLearningToastDiag(fixable[0]);
    setLearningToastCount(fixable.length);
  }, [activeFile, diagnostics, handleCodeChange]);

  // Clear terminal
  const handleClearTerminal = useCallback(() => {
    setCompileResult(null);
    setParsedErrors([]);
    setHighlightedError(null);
  }, []);

  // Select lesson
  const handleSelectLesson = useCallback((lesson: GoLesson) => {
    setCurrentLessonId(lesson.id);
    const lessonFileName = `${lesson.id}.go`;

    setFiles((prev) => {
      const existing = prev.find((f) => f.name === lessonFileName);
      if (existing) {
        return prev.map((f) =>
          f.id === existing.id ? { ...f, content: lesson.code } : f
        );
      }
      const newFile: GoFile = {
        id: `lesson-${Date.now()}`,
        name: lessonFileName,
        content: lesson.code,
      };
      return [...prev, newFile];
    });

    // Switch to that file
    setTimeout(() => {
      setFiles((current) => {
        const found = current.find((f) => f.name === lessonFileName);
        if (found) setActiveFileId(found.id);
        return current;
      });
    }, 50);

    // Run automatically to demonstrate the lesson
    setTimeout(() => {
      handleRun();
    }, 200);
  }, [handleRun]);

  // Create file (with optional template content)
  const handleCreateFile = useCallback((name: string, templateContent?: string) => {
    const newFile: GoFile = {
      id: `file-${Date.now()}`,
      name,
      content:
        templateContent ||
        `package main\n\nimport (\n\t"fmt"\n)\n\nfunc main() {\n\tfmt.Println("Fichier ${name} prêt !")\n}\n`,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, []);

  // Rename file
  const handleRenameFile = useCallback((fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
  }, []);

  // Duplicate file
  const handleDuplicateFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === fileId);
      if (!target) return prev;
      const baseName = target.name.endsWith('.go')
        ? target.name.slice(0, -3)
        : target.name;
      const duplicateName = `${baseName}_copie.go`;
      const duplicated: GoFile = {
        id: `file-${Date.now()}`,
        name: duplicateName,
        content: target.content,
      };
      setActiveFileId(duplicated.id);
      return [...prev, duplicated];
    });
  }, []);

  // Delete file
  const handleDeleteFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileId);
      if (activeFileId === fileId && next.length > 0) {
        setActiveFileId(next[0].id);
      }
      return next;
    });
  }, [activeFileId]);

  // Download active file as .go
  const handleDownloadCurrentFile = useCallback(() => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFile]);

  // Export all files as single JSON backup
  const handleExportAllFiles = useCallback(() => {
    const backupData = {
      app: 'GopherPad IDE',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      files,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gopherpad_projets_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [files]);

  // Import single .go file
  const handleImportGoFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        const importedFile: GoFile = {
          id: `file-${Date.now()}`,
          name: file.name.endsWith('.go') ? file.name : `${file.name}.go`,
          content: text,
        };
        setFiles((prev) => [...prev, importedFile]);
        setActiveFileId(importedFile.id);
      }
    };
    reader.readAsText(file);
  }, []);

  // Restore .json backup
  const handleImportBackup = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const parsed = JSON.parse(text);
          let loadedFiles: GoFile[] = [];
          if (Array.isArray(parsed)) {
            loadedFiles = parsed;
          } else if (parsed && Array.isArray(parsed.files)) {
            loadedFiles = parsed.files;
          }

          if (loadedFiles.length > 0 && loadedFiles.every((f) => f.name && typeof f.content === 'string')) {
            setFiles(loadedFiles);
            setActiveFileId(loadedFiles[0].id);
          } else {
            alert('Format de fichier de sauvegarde non reconnu.');
          }
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier de sauvegarde JSON.');
      }
    };
    reader.readAsText(file);
  }, []);

  // Reset workspace
  const handleResetWorkspace = useCallback(() => {
    setFiles(DEFAULT_FILES);
    setActiveFileId(DEFAULT_FILES[0].id);
    setCompileResult(null);
    setParsedErrors([]);
    setHighlightedError(null);
  }, []);

  // Global keydown listeners (Ctrl/Cmd + Enter to run, Ctrl/Cmd + S to save & format)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveWorkspace();
        handleFormat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleFormat, handleSaveWorkspace]);

  const activeTheme = AVAILABLE_THEMES.find((t) => t.id === themeId) || AVAILABLE_THEMES[0];

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-150 ${
        activeTheme.isDark ? 'text-slate-100 bg-[#070b16]' : 'text-slate-900 bg-slate-100'
      }`}
    >
      {/* Top Navbar */}
      <Header
        files={files}
        activeFileId={activeFileId}
        onSelectFile={setActiveFileId}
        onRun={handleRun}
        isRunning={isRunning}
        onFormat={handleFormat}
        isFormatting={isFormatting}
        onOpenLessons={() => setIsLessonsOpen(true)}
        onOpenLearningNotebook={() => setIsLearningNotebookOpen(true)}
        learnedRulesCount={learnedRules.length}
        onOpenFiles={() => setIsFilesOpen(true)}
        fontSize={fontSize}
        onChangeFontSize={(delta) =>
          setFontSize((prev) => Math.min(24, Math.max(11, prev + delta)))
        }
        currentTheme={themeId}
        onSelectTheme={setThemeId}
        onSave={handleSaveWorkspace}
        lastSavedAt={lastSavedAt}
      />

      {/* Main Workspace: Editor, Diagnostics, Accessory Bar and Resizable Terminal */}
      <main
        className={`flex-1 flex flex-col min-h-0 relative overflow-hidden ${
          activeTheme.isWin98 ? 'bg-[#c0c0c0]' : ''
        }`}
      >
        {/* Code Editor Container */}
        <div
          className={`flex-1 relative min-h-0 overflow-hidden ${
            activeTheme.isWin98 ? 'p-1 bg-[#c0c0c0]' : ''
          }`}
        >
          <div
            className={`w-full h-full relative overflow-hidden ${
              activeTheme.isWin98
                ? 'border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white shadow-[inset_1px_1px_0px_#000000]'
                : ''
            }`}
          >
            {activeFile ? (
              <Editor
                ref={editorRef}
                value={activeFile.content}
                onChange={handleCodeChange}
                onRun={handleRun}
                fontSize={fontSize}
                highlightedError={highlightedError}
                themeId={themeId}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Aucun fichier ouvert
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Automatic Error Detection & Quick-Fixes Banner */}
        <DiagnosticBanner
          diagnostics={diagnostics}
          onApplyFix={handleApplyFix}
          onApplyAllFixes={handleApplyAllFixes}
          onJumpToLine={handleJumpToLine}
          isBackgroundChecking={isBackgroundChecking}
        />

        {/* Android Mobile Touch Accessory Toolbar */}
        <MobileAccessoryBar
          onInsert={handleInsertSnippet}
        />

        {/* Integrated Resizable Terminal */}
        <Terminal
          result={compileResult}
          isRunning={isRunning}
          onClear={handleClearTerminal}
          onJumpToError={handleJumpToError}
          parsedErrors={parsedErrors}
          onRunAgain={handleRun}
          isCollapsed={isTerminalCollapsed}
          onToggleCollapse={() => setIsTerminalCollapsed((prev) => !prev)}
          height={terminalHeight}
          onHeightChange={setTerminalHeight}
          activeCode={activeFile?.content}
          onApplyFix={handleApplyFix}
          isWin98={activeTheme.isWin98}
          isDark={activeTheme.isDark}
        />

        {/* Windows 95/98 Classic Status Bar */}
        {activeTheme.isWin98 && (
          <footer className="h-6 bg-[#c0c0c0] border-t-2 border-t-white border-b border-b-[#808080] px-2 py-0.5 flex items-center justify-between text-[11px] font-sans text-black select-none shrink-0 shadow-[inset_0_1px_0_#dfdfdf]">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <div className="px-2 py-0.5 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-[inset_1px_1px_0px_#dfdfdf] font-medium text-[10px] truncate">
                {isRunning ? 'Compilation en cours...' : 'Prêt'}
              </div>
              <div className="hidden sm:block px-2 py-0.5 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-[inset_1px_1px_0px_#dfdfdf] text-[10px]">
                Go 1.23
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="px-2 py-0.5 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-[inset_1px_1px_0px_#dfdfdf] font-mono text-[10px]">
                {activeFile?.name || 'main.go'}
              </div>
              <div className="hidden md:block px-2 py-0.5 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-[inset_1px_1px_0px_#dfdfdf] text-[10px]">
                UTF-8
              </div>
              <div className="px-1.5 py-0.5 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-[inset_1px_1px_0px_#dfdfdf] font-bold text-[9px] text-[#000080]">
                WIN98
              </div>
            </div>
          </footer>
        )}
      </main>

      {/* Interactive Didactic Toast for 1-Click Fixes */}
      <LearningToast
        diagnostic={learningToastDiag}
        countFixed={learningToastCount}
        onClose={() => setLearningToastDiag(null)}
        onOpenNotebook={() => {
          setLearningToastDiag(null);
          setIsLearningNotebookOpen(true);
        }}
      />

      {/* Side Drawers */}
      <LearningNotebookDrawer
        isOpen={isLearningNotebookOpen}
        onClose={() => setIsLearningNotebookOpen(false)}
        learnedRules={learnedRules}
        onClearRules={() => setLearnedRules([])}
      />

      <LessonDrawer
        isOpen={isLessonsOpen}
        onClose={() => setIsLessonsOpen(false)}
        onSelectLesson={handleSelectLesson}
        currentLessonId={currentLessonId}
      />

      <FileDrawer
        isOpen={isFilesOpen}
        onClose={() => setIsFilesOpen(false)}
        files={files}
        activeFileId={activeFileId}
        onSelectFile={setActiveFileId}
        onCreateFile={handleCreateFile}
        onRenameFile={handleRenameFile}
        onDuplicateFile={handleDuplicateFile}
        onDeleteFile={handleDeleteFile}
        onDownloadCurrentFile={handleDownloadCurrentFile}
        onExportAllFiles={handleExportAllFiles}
        onImportGoFile={handleImportGoFile}
        onImportBackup={handleImportBackup}
        onSaveWorkspace={handleSaveWorkspace}
        onResetWorkspace={handleResetWorkspace}
        lastSavedAt={lastSavedAt}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}

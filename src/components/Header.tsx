import React, { useState } from 'react';
import {
  Play,
  AlignLeft,
  BookOpen,
  FolderTree,
  Plus,
  Minus,
  Palette,
  Save,
  Check,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { GoFile } from '../types';
import { ThemeId, AVAILABLE_THEMES } from '../theme/goThemes';

interface HeaderProps {
  files: GoFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onRun: () => void;
  isRunning: boolean;
  onFormat: () => void;
  isFormatting: boolean;
  onOpenLessons: () => void;
  onOpenLearningNotebook: () => void;
  learnedRulesCount?: number;
  onOpenFiles: () => void;
  fontSize: number;
  onChangeFontSize: (delta: number) => void;
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onSave: () => void;
  lastSavedAt: Date | null;
}

type ThemeCategoryFilter = 'Tous' | 'Clair' | 'Rétro' | 'Foncé' | 'Néon';

export const Header: React.FC<HeaderProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onRun,
  isRunning,
  onFormat,
  isFormatting,
  onOpenLessons,
  onOpenLearningNotebook,
  learnedRulesCount = 0,
  onOpenFiles,
  fontSize,
  onChangeFontSize,
  currentTheme,
  onSelectTheme,
  onSave,
  lastSavedAt,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [themeFilter, setThemeFilter] = useState<ThemeCategoryFilter>('Tous');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveClick = () => {
    onSave();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const activeThemeConfig =
    AVAILABLE_THEMES.find((t) => t.id === currentTheme) || AVAILABLE_THEMES[0];
  const isWin98 = activeThemeConfig.isWin98 ?? false;
  const isDark = activeThemeConfig.isDark;

  const filteredThemes = AVAILABLE_THEMES.filter((theme) => {
    if (themeFilter === 'Tous') return true;
    return theme.category === themeFilter;
  });

  // Windows 95/98 Classic Button Style
  const win98BtnBase =
    'bg-[#c0c0c0] text-black font-sans text-xs border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[inset_1px_1px_0px_#dfdfdf,inset_-1px_-1px_0px_#808080] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0px_#000000,inset_-1px_-1px_0px_#dfdfdf] px-2.5 py-1 flex items-center gap-1.5 transition-none select-none';

  // Standard Modern Adaptive Button Style
  const modernBtnClass = isDark
    ? 'bg-slate-800/90 text-slate-200 border-slate-700/80 hover:bg-slate-700 hover:text-white'
    : 'bg-white/90 text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950 shadow-xs';

  return (
    <div className="flex flex-col shrink-0 select-none z-30">
      {/* Authentic Windows 95/98 Title Bar (when win98-retro is active) */}
      {isWin98 && (
        <div className="h-6 bg-gradient-to-r from-[#000080] via-[#081e92] to-[#1084d0] flex items-center justify-between px-2 text-white border-b border-black">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {/* Win95 classic 4-color icon */}
            <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 bg-black p-0.5 shrink-0 shadow-xs">
              <div className="bg-[#ff0000]" />
              <div className="bg-[#00ff00]" />
              <div className="bg-[#0000ff]" />
              <div className="bg-[#ffff00]" />
            </div>
            <span className="font-sans font-bold text-xs tracking-tight truncate">
              GopherPad 98 - [{files.find((f) => f.id === activeFileId)?.name || 'main.go'}] - Environnement Go 1.23
            </span>
          </div>
          {/* Win95 classic window controls */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              className="w-4 h-3.5 bg-[#c0c0c0] text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-black border-b-black shadow-[inset_1px_1px_0px_#dfdfdf] active:border-t-black active:border-l-black active:border-r-white active:border-b-white leading-none"
              title="Réduire"
            >
              _
            </button>
            <button
              className="w-4 h-3.5 bg-[#c0c0c0] text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-black border-b-black shadow-[inset_1px_1px_0px_#dfdfdf] active:border-t-black active:border-l-black active:border-r-white active:border-b-white leading-none"
              title="Agrandir"
            >
              □
            </button>
            <button
              className="w-4 h-3.5 bg-[#c0c0c0] text-black font-bold text-[10px] flex items-center justify-center border border-t-white border-l-white border-r-black border-b-black shadow-[inset_1px_1px_0px_#dfdfdf] active:border-t-black active:border-l-black active:border-r-white active:border-b-white leading-none"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar Header */}
      <header
        className={`flex items-center justify-between px-3 shrink-0 transition-colors duration-150 ${
          isWin98
            ? 'h-11 bg-[#c0c0c0] border-b-2 border-b-[#808080] border-t border-t-white shadow-[inset_0_-1px_0px_#000000]'
            : 'h-12 border-b'
        }`}
        style={{
          backgroundColor: isWin98 ? '#c0c0c0' : activeThemeConfig.headerBg,
          borderColor: isWin98
            ? undefined
            : isDark
            ? '#1e293b'
            : activeThemeConfig.borderHex || '#e2e8f0',
        }}
      >
        {/* Left: Brand + File Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 mr-1 shrink-0">
            {isWin98 ? (
              <div className="w-6 h-6 bg-[#000080] text-white flex items-center justify-center border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black font-bold text-xs font-mono shadow-xs">
                GO
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-[#00ADD8] flex items-center justify-center shadow-md shadow-sky-500/20">
                <span className="font-mono font-black text-xs text-slate-950">GO</span>
              </div>
            )}
            <div className="hidden sm:flex flex-col">
              <span
                className={`font-bold text-sm leading-none tracking-tight flex items-center gap-1 ${
                  isWin98
                    ? 'text-black'
                    : isDark
                    ? 'text-white'
                    : 'text-slate-900'
                }`}
              >
                Gopher<span className={isWin98 ? 'text-[#000080]' : 'text-[#00ADD8]'}>Pad</span>
              </span>
              <span
                className={`text-[9px] font-mono font-semibold ${
                  isWin98 ? 'text-[#000080]' : isDark ? 'text-sky-400' : 'text-sky-700'
                }`}
              >
                {isWin98 ? 'Windows 98 Go IDE' : 'Go 1.23 IDE'}
              </span>
            </div>
          </div>

          {/* Files drawer toggle */}
          <button
            onClick={onOpenFiles}
            className={
              isWin98
                ? win98BtnBase
                : `p-1.5 rounded-lg border flex items-center gap-1.5 transition shrink-0 ${modernBtnClass}`
            }
            title="Ouvrir le gestionnaire de fichiers Go"
          >
            <FolderTree className={`w-4 h-4 ${isWin98 ? 'text-[#000080]' : 'text-sky-500'}`} />
            <span className="text-xs font-semibold hidden md:inline">Fichiers</span>
          </button>

          {/* Open File Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            {files.map((file) => {
              const isActive = file.id === activeFileId;

              if (isWin98) {
                return (
                  <button
                    key={file.id}
                    onClick={() => onSelectFile(file.id)}
                    className={`px-3 py-1 text-xs font-sans font-medium flex items-center gap-1.5 shrink-0 transition-none ${
                      isActive
                        ? 'bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-r-[#404040] border-b-[#c0c0c0] shadow-[inset_1px_1px_0px_#dfdfdf] relative -mb-[2px] z-10'
                        : 'bg-[#b0b0b0] text-[#404040] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#808080]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-[#000080]" />
                    <span>{file.name}</span>
                  </button>
                );
              }

              return (
                <button
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? isDark
                        ? 'bg-slate-800 text-sky-300 border border-slate-700 font-medium shadow-sm ring-1 ring-sky-500/40'
                        : 'bg-white text-slate-900 border border-slate-300 font-semibold shadow-sm ring-1 ring-sky-500/30'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: activeThemeConfig.accentHex }}
                  />
                  <span>{file.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Quick Save button */}
          <button
            onClick={handleSaveClick}
            className={
              isWin98
                ? win98BtnBase
                : `flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition active:scale-95 shrink-0 ${modernBtnClass}`
            }
            title="Enregistrer le code dans le navigateur (Ctrl+S)"
          >
            {savedNotice ? (
              <>
                <Check className={`w-3.5 h-3.5 ${isWin98 ? 'text-emerald-700 font-bold' : 'text-emerald-500'}`} />
                <span className={`hidden sm:inline font-semibold ${isWin98 ? 'text-emerald-800' : 'text-emerald-500'}`}>
                  Sauvé !
                </span>
              </>
            ) : (
              <>
                <Save className={`w-3.5 h-3.5 ${isWin98 ? 'text-[#000080]' : 'text-sky-500'}`} />
                <span className="hidden sm:inline">Sauvegarder</span>
              </>
            )}
          </button>

          {/* Lessons Button */}
          <button
            onClick={onOpenLessons}
            className={
              isWin98
                ? win98BtnBase
                : `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition active:scale-95 shrink-0 ${modernBtnClass}`
            }
            title="Explorer les leçons interactives de Go"
          >
            <BookOpen className={`w-3.5 h-3.5 ${isWin98 ? 'text-[#000080]' : 'text-sky-500'}`} />
            <span className="hidden md:inline">Leçons</span>
          </button>

          {/* Learning Notebook Button */}
          <button
            onClick={onOpenLearningNotebook}
            className={
              isWin98
                ? win98BtnBase
                : `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition active:scale-95 shrink-0 ${modernBtnClass}`
            }
            title="Consulter le Carnet d'apprentissage Go (règles et leçons apprises lors des corrections 1-clic)"
          >
            <GraduationCap className={`w-3.5 h-3.5 ${isWin98 ? 'text-[#000080]' : 'text-sky-500'}`} />
            <span className="hidden md:inline">Carnet</span>
            {learnedRulesCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                  isWin98
                    ? 'bg-[#000080] text-white'
                    : isDark
                    ? 'bg-sky-500/30 text-sky-300 border border-sky-500/40'
                    : 'bg-sky-100 text-sky-800 border border-sky-300'
                }`}
              >
                {learnedRulesCount}
              </span>
            )}
          </button>

          {/* Gofmt format button */}
          <button
            onClick={onFormat}
            disabled={isFormatting}
            className={
              isWin98
                ? `${win98BtnBase} disabled:opacity-50`
                : `flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition active:scale-95 shrink-0 disabled:opacity-50 ${modernBtnClass}`
            }
            title="Formater le code avec gofmt (indentation et style officiel)"
          >
            <AlignLeft
              className={`w-3.5 h-3.5 ${isWin98 ? 'text-[#000080]' : 'text-sky-500'} ${
                isFormatting ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden lg:inline">gofmt</span>
          </button>

          {/* Font size adjustment */}
          <div
            className={`hidden lg:flex items-center p-0.5 ${
              isWin98
                ? 'bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-[inset_1px_1px_0px_#000000]'
                : isDark
                ? 'bg-slate-800/80 rounded-lg border border-slate-700/80'
                : 'bg-white rounded-lg border border-slate-300 shadow-xs'
            }`}
          >
            <button
              onClick={() => onChangeFontSize(-1)}
              disabled={fontSize <= 11}
              className={`p-1 disabled:opacity-30 rounded ${
                isWin98 ? 'text-black hover:bg-[#a0a0a0]' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
              }`}
              title="Diminuer la police"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span
              className={`px-1 text-[11px] font-mono ${
                isWin98 ? 'text-black font-bold' : isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'
              }`}
            >
              {fontSize}px
            </span>
            <button
              onClick={() => onChangeFontSize(1)}
              disabled={fontSize >= 22}
              className={`p-1 disabled:opacity-30 rounded ${
                isWin98 ? 'text-black hover:bg-[#a0a0a0]' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
              }`}
              title="Agrandir la police"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={
                isWin98
                  ? win98BtnBase
                  : `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition active:scale-95 shrink-0 ${modernBtnClass}`
              }
              title="Changer le thème de l'environnement (17 thèmes : Clairs, Rétro Windows 98, Foncés, Cyberpunk)"
            >
              <Palette className={`w-3.5 h-3.5 ${isWin98 ? 'text-[#000080]' : 'text-sky-500'}`} />
              <span className="hidden xl:inline">Thème</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0"
                style={{ backgroundColor: activeThemeConfig.bgHex }}
              />
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div
                  className={`absolute right-0 mt-1.5 w-80 rounded-2xl shadow-2xl p-2.5 z-50 text-xs animate-fade-in max-h-[85vh] flex flex-col ${
                    isWin98
                      ? 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black shadow-[3px_3px_10px_rgba(0,0,0,0.5)] rounded-none'
                      : isDark
                      ? 'bg-slate-900 border border-slate-700 text-slate-100'
                      : 'bg-white border border-slate-200 text-slate-900 shadow-slate-300/50'
                  }`}
                >
                  {/* Dropdown Header */}
                  <div className="px-2 py-1.5 border-b border-slate-700/50 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-bold tracking-tight">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Thèmes de l'IDE ({AVAILABLE_THEMES.length})</span>
                    </div>
                    <span className="text-[10px] text-sky-500 font-semibold font-mono">
                      Coloration Go
                    </span>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 mb-2 bg-slate-800/40 rounded-lg overflow-x-auto no-scrollbar">
                    {(['Tous', 'Clair', 'Rétro', 'Foncé', 'Néon'] as ThemeCategoryFilter[]).map(
                      (cat) => {
                        const isCatActive = themeFilter === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setThemeFilter(cat)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition shrink-0 ${
                              isCatActive
                                ? isDark
                                  ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                                  : 'bg-sky-600 text-white font-bold shadow-xs'
                                : isDark
                                ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                : 'text-slate-600 hover:text-black hover:bg-slate-200/60'
                            }`}
                          >
                            {cat === 'Clair' && '☀️ '}
                            {cat === 'Rétro' && '💾 '}
                            {cat === 'Foncé' && '🌙 '}
                            {cat === 'Néon' && '⚡ '}
                            {cat}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Scrollable Themes List */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
                    {filteredThemes.map((theme) => {
                      const isSelected = theme.id === currentTheme;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            onSelectTheme(theme.id);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                            isSelected
                              ? isDark
                                ? 'bg-sky-950/80 text-sky-200 border border-sky-500/60 shadow-sm ring-1 ring-sky-500/30'
                                : 'bg-sky-50 text-sky-950 border border-sky-400 shadow-sm ring-1 ring-sky-400/30'
                              : isDark
                              ? 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-transparent'
                          }`}
                        >
                          {/* Color preview badge */}
                          <div className="relative shrink-0 mt-0.5">
                            <span
                              className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center shadow-xs"
                              style={{ backgroundColor: theme.bgHex }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: theme.accentHex }}
                              />
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold truncate text-xs">
                                {theme.name}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                                  theme.category === 'Rétro'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                    : theme.category === 'Néon'
                                    ? 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800/60'
                                    : theme.category === 'Clair'
                                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {theme.category}
                              </span>
                            </div>
                            {theme.description && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {theme.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Big Run Button */}
          <button
            onClick={onRun}
            disabled={isRunning}
            className={
              isWin98
                ? `${win98BtnBase} bg-[#000080] text-white font-bold border-t-white border-l-white border-r-black border-b-black shadow-[inset_1px_1px_0px_#4040ff] px-3.5 py-1.5 disabled:opacity-60`
                : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ADD8] hover:bg-[#0097be] text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition disabled:opacity-60 shrink-0'
            }
            title="Compiler et exécuter le code Go (Ctrl+Enter)"
          >
            {isRunning ? (
              <div
                className={`w-3.5 h-3.5 border-2 ${
                  isWin98 ? 'border-white' : 'border-slate-950'
                } border-t-transparent rounded-full animate-spin`}
              />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Compilation...' : 'Exécuter'}</span>
          </button>
        </div>
      </header>
    </div>
  );
};

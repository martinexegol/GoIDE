import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileCode,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Edit2,
  Check,
  Search,
  FolderArchive,
  Save,
  Sparkles,
  FileCheck,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Clock,
  History,
  RotateCcw,
  Network,
  List,
} from 'lucide-react';
import { GoFile, WorkspaceSnapshot, FileTreeNode } from '../types';
import { buildFileTree, normalizePath } from '../utils/fileTree';

interface FileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  files: GoFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (fileName: string, templateContent?: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDownloadCurrentFile: () => void;
  onExportAllFiles: () => void;
  onImportGoFile: (file: File) => void;
  onImportBackup: (file: File) => void;
  onSaveWorkspace: () => void;
  onResetWorkspace: () => void;
  lastSavedAt: Date | null;
  // 5-minute Auto-Save Snapshots & Arborescence
  snapshots?: WorkspaceSnapshot[];
  lastAutoSnapshotTime?: Date | null;
  nextSnapshotSec?: number;
  onRestoreSnapshot?: (snapshot: WorkspaceSnapshot) => void;
  onDeleteSnapshot?: (snapshotId: string) => void;
  onCreateSnapshotNow?: (label?: string) => void;
  onInitStandardProject?: () => void;
}

const STARTER_TEMPLATES = [
  {
    name: 'main.go',
    title: 'Programme Principal (main.go)',
    desc: 'Point d\'entrée standard avec fonction main() et fmt.Println.',
    code: `package main

import (
\t"fmt"
)

func main() {
\tfmt.Println("🚀 Nouveau programme Go prêt !")
}
`,
  },
  {
    name: 'cmd/server/main.go',
    title: 'Arborescence CLI / Serveur (cmd/server/main.go)',
    desc: 'Organisation standard Go avec dossier cmd/ dédié aux exécutables.',
    code: `package main

import (
\t"fmt"
\t"time"
)

func main() {
\tfmt.Println("Serveur Go démarré avec succès à", time.Now().Format("15:04:05"))
}
`,
  },
  {
    name: 'pkg/api/server.go',
    title: 'Module API REST (pkg/api/server.go)',
    desc: 'Structure modulaire avec endpoints JSON et séparation de code.',
    code: `package api

import (
\t"encoding/json"
\t"net/http"
\t"time"
)

type StatusResponse struct {
\tStatus    string    \`json:"status"\`
\tTimestamp time.Time \`json:"timestamp"\`
}

func HandlerStatus(w http.ResponseWriter, r *http.Request) {
\tw.Header().Set("Content-Type", "application/json")
\tjson.NewEncoder(w).Encode(StatusResponse{
\t\tStatus:    "ok",
\t\tTimestamp: time.Now(),
\t})
}
`,
  },
  {
    name: 'pkg/math/calc_test.go',
    title: 'Test Unitaire Modulaire (pkg/math/calc_test.go)',
    desc: 'Suite de tests unitaires structurée dans le package pkg/math.',
    code: `package math

import "testing"

func Add(a, b int) int {
\treturn a + b
}

func TestAdd(t *testing.T) {
\ttests := []struct {
\t\ta, b, attendu int
\t}{
\t\t{2, 3, 5},
\t\t{-1, 1, 0},
\t\t{10, -5, 5},
\t}

\tfor _, tt := range tests {
\t\tobtenu := Add(tt.a, tt.b)
\t\tif obtenu != tt.attendu {
\t\t\tt.Errorf("Add(%d, %d) = %d; attendu %d", tt.a, tt.b, obtenu, tt.attendu)
\t\t}
\t}
}
`,
  },
  {
    name: 'goroutines.go',
    title: 'Concurrence & Canaux (Channels)',
    desc: 'Goroutines, channels typés, sync.WaitGroup et select.',
    code: `package main

import (
\t"fmt"
\t"sync"
\t"time"
)

func travailleur(id int, ch chan<- string, wg *sync.WaitGroup) {
\tdefer wg.Done()
\ttime.Sleep(100 * time.Millisecond)
\tch <- fmt.Sprintf("Worker #%d terminé", id)
}

func main() {
\tvar wg sync.WaitGroup
\tch := make(chan string, 3)

\tfor i := range 3 {
\t\twg.Add(1)
\t\tgo travailleur(i+1, ch, &wg)
\t}

\twg.Wait()
\tclose(ch)

\tfor msg := range ch {
\t\tfmt.Println("->", msg)
\t}
}
`,
  },
];

export const FileDrawer: React.FC<FileDrawerProps> = ({
  isOpen,
  onClose,
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDuplicateFile,
  onDeleteFile,
  onDownloadCurrentFile,
  onExportAllFiles,
  onImportGoFile,
  onImportBackup,
  onSaveWorkspace,
  onResetWorkspace,
  lastSavedAt,
  snapshots = [],
  lastAutoSnapshotTime = null,
  nextSnapshotSec = 300,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onCreateSnapshotNow,
  onInitStandardProject,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'templates' | 'backup'>('files');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [targetFolderForNewFile, setTargetFolderForNewFile] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(false);

  // Expanded folders state (keyed by folder path)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => ({
    cmd: true,
    'cmd/server': true,
    pkg: true,
    'pkg/api': true,
    'pkg/math': true,
    internal: true,
  }));

  const importFileRef = useRef<HTMLInputElement>(null);
  const importBackupRef = useRef<HTMLInputElement>(null);

  // Build hierarchical tree
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  if (!isOpen) return null;

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: prev[folderPath] === false ? true : false,
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileName.trim();
    if (!name) return;
    if (!name.endsWith('.go')) {
      name += '.go';
    }

    const fullPath = targetFolderForNewFile
      ? `${targetFolderForNewFile}/${name}`
      : name;

    onCreateFile(normalizePath(fullPath));
    setNewFileName('');
    setTargetFolderForNewFile('');
    setIsCreating(false);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    let folder = newFolderName.trim();
    if (!folder) return;
    folder = normalizePath(folder);

    // Create a starter file inside this new folder so it persists in the tree
    const defaultFile = `${folder}/mod.go`;
    onCreateFile(
      defaultFile,
      `package ${folder.split('/').pop() || 'main'}\n\n// Package ${folder}\n`
    );

    setExpandedFolders((prev) => ({ ...prev, [folder]: true }));
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleStartRename = (file: GoFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setRenameInput(file.name);
  };

  const handleSaveRename = (fileId: string) => {
    let name = renameInput.trim();
    if (name) {
      if (!name.endsWith('.go')) name += '.go';
      onRenameFile(fileId, normalizePath(name));
    }
    setEditingFileId(null);
  };

  const handleManualSave = () => {
    onSaveWorkspace();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleManualSnapshot = () => {
    if (onCreateSnapshotNow) {
      onCreateSnapshotNow("Point d'étape manuel");
      setSnapshotToast(true);
      setTimeout(() => setSnapshotToast(false), 2000);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLines = files.reduce(
    (acc, f) => acc + (f.content.split('\n').length || 1),
    0
  );

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: FileTreeNode, depth = 0) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders[node.path] !== false;
      const childFilesCount = node.children.reduce(
        (acc, c) => acc + (c.isFolder ? c.children.length : 1),
        0
      );

      return (
        <div key={`folder-${node.path}`} className="flex flex-col">
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/70 text-xs cursor-pointer group transition select-none"
            style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="font-mono font-bold text-slate-200 text-xs">
                {node.name}/
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({childFilesCount})
              </span>
            </div>

            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setTargetFolderForNewFile(node.path);
                  setIsCreating(true);
                }}
                className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-700/60"
                title={`Nouveau fichier dans ${node.path}/`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="flex flex-col border-l border-slate-800/80 ml-3">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    const file = node.file!;
    const isActive = file.id === activeFileId;
    const isEditing = editingFileId === file.id;
    const lineCount = file.content.split('\n').length;

    return (
      <div
        key={`file-${file.id}`}
        onClick={() => {
          if (!isEditing) {
            onSelectFile(file.id);
            onClose();
          }
        }}
        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition select-none my-0.5 ${
          isActive
            ? 'bg-sky-950/70 border border-sky-500/60 shadow-xs'
            : 'hover:bg-slate-800/60 border border-transparent'
        }`}
        style={{ paddingLeft: `${Math.max(10, depth * 14 + 10)}px` }}
      >
        {isEditing ? (
          <div
            className="flex items-center gap-1.5 flex-1 mr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(file.id);
                if (e.key === 'Escape') setEditingFileId(null);
              }}
              className="flex-1 px-2 py-0.5 rounded bg-slate-950 border border-sky-400 text-xs text-white font-mono"
            />
            <button
              onClick={() => handleSaveRename(file.id)}
              className="p-1 bg-sky-500 text-slate-950 rounded hover:bg-sky-400"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 truncate">
            <FileCode
              className={`w-3.5 h-3.5 shrink-0 ${
                isActive ? 'text-sky-400' : 'text-slate-400'
              }`}
            />
            <span
              className={`font-mono font-medium truncate ${
                isActive ? 'text-sky-200 font-bold' : 'text-slate-300'
              }`}
            >
              {node.name}
            </span>
            {file.isMain && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/60 shrink-0">
                main
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-mono hidden group-hover:inline">
              {lineCount}l
            </span>
          </div>
        )}

        {/* Action icons */}
        <div
          className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => handleStartRename(file, e)}
            className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-700/60 rounded transition"
            title="Renommer ou déplacer ce fichier"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDuplicateFile(file.id)}
            className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-700/60 rounded transition"
            title="Dupliquer ce fichier"
          >
            <Copy className="w-3 h-3" />
          </button>
          {files.length > 1 && !file.isMain && (
            <button
              onClick={() => {
                if (confirm(`Supprimer le fichier ${file.name} ?`)) {
                  onDeleteFile(file.id);
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded transition"
              title="Supprimer ce fichier"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm sm:max-w-md h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl animate-slide-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  Arborescence & Fichiers
                  <span className="text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded">
                    {files.length} fichier(s)
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>{totalLines} lignes</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Auto-save 5 min actif
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 5-minute Autosave Pulse Banner */}
          <div className="flex items-center justify-between bg-slate-900/90 rounded-lg p-2 border border-slate-800 text-xs mt-2">
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Auto-save dans <strong className="text-white font-mono">{formatCountdown(nextSnapshotSec)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleManualSave}
                className="flex items-center gap-1 px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-semibold transition active:scale-95"
                title="Enregistrer immédiatement dans le navigateur"
              >
                {savedToast ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Enregistré !</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Sauvegarder</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 mt-3 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                activeTab === 'files'
                  ? 'bg-slate-800 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Arborescence</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                activeTab === 'templates'
                  ? 'bg-slate-800 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Modèles</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                activeTab === 'backup'
                  ? 'bg-slate-800 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3 h-3" />
              <span>Sauvegardes (5 min)</span>
              {snapshots.length > 0 && (
                <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1 rounded-full">
                  {snapshots.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Files & Arborescence Tree */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tree / Flat Switcher & Actions */}
            <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-900/60">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrer l'arborescence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Tree vs Flat view switch */}
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 shrink-0">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`p-1.5 rounded text-xs transition ${
                      viewMode === 'tree'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Vue Arborescence (dossiers & hiérarchie)"
                  >
                    <Network className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('flat')}
                    className={`p-1.5 rounded text-xs transition ${
                      viewMode === 'flat'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Vue Liste à plat"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: New File, New Folder, Init Standard */}
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => {
                    setTargetFolderForNewFile('');
                    setIsCreating(true);
                    setIsCreatingFolder(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition flex items-center gap-1 shrink-0 active:scale-95"
                  title="Créer un nouveau fichier Go (ex: cmd/main.go)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Fichier</span>
                </button>

                <button
                  onClick={() => {
                    setIsCreatingFolder(true);
                    setIsCreating(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs hover:bg-slate-700 hover:text-white transition flex items-center gap-1 shrink-0 active:scale-95"
                  title="Créer un nouveau dossier (ex: pkg/api)"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Dossier</span>
                </button>

                {onInitStandardProject && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Initialiser l\'arborescence Go standard (cmd/server/, pkg/math/, internal/config/) ?'
                        )
                      ) {
                        onInitStandardProject();
                      }
                    }}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium hover:text-sky-300 hover:bg-slate-700 transition flex items-center gap-1 shrink-0 ml-auto"
                    title="Générer l'arborescence Go conventionnelle"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Scaffold Go</span>
                  </button>
                )}
              </div>

              {/* Inline Create File Form */}
              {isCreating && (
                <form
                  onSubmit={handleCreate}
                  className="p-2.5 rounded-xl bg-slate-950 border border-sky-500/50 animate-fade-in"
                >
                  <label className="text-[11px] text-slate-400 mb-1 block">
                    {targetFolderForNewFile ? (
                      <span>
                        Nouveau fichier dans{' '}
                        <strong className="text-amber-400 font-mono">
                          {targetFolderForNewFile}/
                        </strong>
                        :
                      </span>
                    ) : (
                      <span>Nom ou chemin du fichier Go :</span>
                    )}
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder={targetFolderForNewFile ? 'ex: service.go' : 'ex: cmd/server/main.go'}
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-sky-500 text-slate-950 font-bold rounded text-xs hover:bg-sky-400 transition"
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setTargetFolderForNewFile('');
                      }}
                      className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs hover:text-white"
                    >
                      Annuler
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Astuce : saisissez des sous-dossiers séparés par des slashes (ex: <code>pkg/models/user.go</code>).
                  </p>
                </form>
              )}

              {/* Inline Create Folder Form */}
              {isCreatingFolder && (
                <form
                  onSubmit={handleCreateFolder}
                  className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/50 animate-fade-in"
                >
                  <label className="text-[11px] text-slate-400 mb-1 block">
                    Nom du nouveau dossier (ex: <code>pkg/services</code>) :
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="ex: pkg/utils"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded text-xs hover:bg-amber-400 transition"
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(false)}
                      className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs hover:text-white"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* List / Tree Container */}
            <div className="flex-1 overflow-y-auto p-2">
              {viewMode === 'tree' ? (
                <div className="space-y-0.5">
                  {fileTree.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Aucun fichier trouvé.
                    </div>
                  ) : (
                    fileTree.map((node) => renderTreeNode(node, 0))
                  )}
                </div>
              ) : (
                /* Flat view fallback */
                <div className="space-y-1.5">
                  {filteredFiles.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Aucun fichier trouvé pour "{searchQuery}"
                    </div>
                  ) : (
                    filteredFiles.map((file) => {
                      const isActive = file.id === activeFileId;
                      const isEditing = editingFileId === file.id;
                      const lineCount = file.content.split('\n').length;
                      const byteSize = new Blob([file.content]).size;

                      return (
                        <div
                          key={file.id}
                          onClick={() => {
                            if (!isEditing) {
                              onSelectFile(file.id);
                              onClose();
                            }
                          }}
                          className={`group p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1 text-xs ${
                            isActive
                              ? 'bg-sky-950/60 border-sky-500/70 shadow-sm'
                              : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            {isEditing ? (
                              <div
                                className="flex items-center gap-1.5 flex-1 mr-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  value={renameInput}
                                  onChange={(e) => setRenameInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(file.id);
                                    if (e.key === 'Escape') setEditingFileId(null);
                                  }}
                                  className="flex-1 px-2 py-0.5 rounded bg-slate-950 border border-sky-400 text-xs text-white font-mono"
                                />
                                <button
                                  onClick={() => handleSaveRename(file.id)}
                                  className="p-1 bg-sky-500 text-slate-950 rounded hover:bg-sky-400"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 truncate">
                                <FileCode
                                  className={`w-4 h-4 shrink-0 ${
                                    isActive ? 'text-sky-400' : 'text-slate-500'
                                  }`}
                                />
                                <span
                                  className={`font-mono font-semibold truncate ${
                                    isActive ? 'text-white' : 'text-slate-300'
                                  }`}
                                >
                                  {file.name}
                                </span>
                                {file.isMain && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/60 shrink-0">
                                    main
                                  </span>
                                )}
                              </div>
                            )}

                            {/* File action buttons */}
                            <div
                              className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => handleStartRename(file, e)}
                                className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-700/60 rounded transition"
                                title="Renommer ce fichier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDuplicateFile(file.id)}
                                className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-700/60 rounded transition"
                                title="Dupliquer ce fichier"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {files.length > 1 && !file.isMain && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Supprimer le fichier ${file.name} ?`)) {
                                      onDeleteFile(file.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded transition"
                                  title="Supprimer ce fichier"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>
                              {lineCount} ligne{lineCount > 1 ? 's' : ''} • {byteSize} octets
                            </span>
                            {isActive && (
                              <span className="text-sky-400 text-[10px] font-medium">
                                ● Fichier actif
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Starter Templates */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs text-slate-400 mb-2">
              Ajoutez un modèle prêt à l'emploi avec arborescence dans votre projet Go :
            </div>

            {STARTER_TEMPLATES.map((tmpl, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:border-sky-500/80 hover:bg-slate-800 transition flex flex-col gap-2"
              >
                <div>
                  <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-sky-400" />
                    {tmpl.title}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {tmpl.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                  <span className="text-[10px] text-slate-400 font-mono">{tmpl.name}</span>
                  <button
                    onClick={() => {
                      onCreateFile(tmpl.name, tmpl.code);
                      setActiveTab('files');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-semibold hover:bg-sky-500/30 transition active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    Créer dans l'arborescence
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: 5-Minute Auto-Save Checkpoints & Backup */}
        {activeTab === 'backup' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* 5-minute Auto-Save Status Panel */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Enregistrement toutes les 5 minutes
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                  Actif
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Prochaine sauvegarde auto :</span>
                  <span className="text-emerald-400 font-mono font-bold text-xs">
                    {formatCountdown(nextSnapshotSec)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Dernière sauvegarde auto :</span>
                  <span className="text-slate-200 font-mono text-xs">
                    {lastAutoSnapshotTime
                      ? lastAutoSnapshotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'Au démarrage'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleManualSnapshot}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold hover:bg-emerald-500/30 transition active:scale-95 text-xs"
                >
                  {snapshotToast ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Point d'étape enregistré !</span>
                    </>
                  ) : (
                    <>
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Créer un point de sauvegarde</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List of 5-minute Auto-Save Snapshots */}
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
              <h3 className="font-bold text-white flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-sky-400" />
                  Historique des sauvegardes automatiques ({snapshots.length})
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Chaque point d'étape conserve l'ensemble de votre arborescence de fichiers. Vous pouvez revenir à n'importe quelle version en 1 clic.
              </p>

              {snapshots.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-900 text-center text-slate-500 text-xs">
                  Le premier point d'étape automatique sera enregistré d'ici 5 minutes (ou cliquez sur "Créer un point de sauvegarde").
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {snapshots.map((snap) => {
                    const date = new Date(snap.timestamp);
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

                    return (
                      <div
                        key={snap.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {snap.label || 'Sauvegarde auto 5 min'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dateStr} à {timeStr} • {snap.files.length} fichier(s) • {snap.totalLines || 0} lignes
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {onRestoreSnapshot && (
                            <button
                              onClick={() => {
                                if (confirm(`Restaurer le projet à la version du ${dateStr} à ${timeStr} ?`)) {
                                  onRestoreSnapshot(snap);
                                  onClose();
                                }
                              }}
                              className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-semibold flex items-center gap-1 transition"
                              title="Restaurer cette version"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restaurer</span>
                            </button>
                          )}
                          {onDeleteSnapshot && (
                            <button
                              onClick={() => onDeleteSnapshot(snap.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                              title="Supprimer ce point d'étape"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Export & Import JSON archives */}
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Download className="w-4 h-4 text-sky-400" />
                Export & Import manuel
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Exportez ou chargez une archive <code className="text-sky-300">.json</code> complète de votre arborescence pour la sauvegarder sur disque.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={onExportAllFiles}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold hover:bg-sky-500/30 transition active:scale-95"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  Exporter tout (.json)
                </button>
                <button
                  onClick={onDownloadCurrentFile}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold hover:text-white hover:bg-slate-700 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger le .go
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-2">
                <input
                  type="file"
                  ref={importFileRef}
                  accept=".go"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImportGoFile(file);
                      setActiveTab('files');
                    }
                  }}
                />
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold hover:bg-slate-700 hover:text-white transition active:scale-95"
                >
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  Importer un fichier .go
                </button>

                <input
                  type="file"
                  ref={importBackupRef}
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImportBackup(file);
                      setActiveTab('files');
                    }
                  }}
                />
                <button
                  onClick={() => importBackupRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold hover:bg-slate-700 hover:text-white transition active:scale-95"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
                  Restaurer sauvegarde .json
                </button>
              </div>
            </div>

            {/* Reset */}
            <div className="p-3 border-t border-slate-800/80">
              <button
                onClick={() => {
                  if (confirm('Voulez-vous réinitialiser l\'espace de travail au code d\'exemple initial ?')) {
                    onResetWorkspace();
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg border border-rose-900/40 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réinitialiser l'espace de travail
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Stockage local & Sauvegarde 5 min
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
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
  Layers,
  FileCheck,
} from 'lucide-react';
import { GoFile } from '../types';

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
    name: 'api_server.go',
    title: 'Serveur Web & API REST',
    desc: 'API HTTP moderne Go 1.22+ avec endpoints GET/POST et JSON.',
    code: `package main

import (
\t"encoding/json"
\t"fmt"
\t"net/http"
\t"time"
)

type ReponseAPI struct {
\tStatut  string    \`json:"statut"\`
\tMessage string    \`json:"message"\`
\tDate    time.Time \`json:"date"\`
}

func main() {
\tmux := http.NewServeMux()

\tmux.HandleFunc("GET /api/status", func(w http.ResponseWriter, r *http.Request) {
\t\tw.Header().Set("Content-Type", "application/json")
\t\tjson.NewEncoder(w).Encode(ReponseAPI{
\t\t\tStatut:  "succes",
\t\t\tMessage: "API Go opérationnelle",
\t\t\tDate:    time.Now(),
\t\t})
\t})

\tfmt.Println("Serveur configuré sur :8080 (simulation)")
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
  {
    name: 'generics.go',
    title: 'Algorithme & Types Génériques [T any]',
    desc: 'Fonctions génériques réutilisables avec contrainte comparable.',
    code: `package main

import (
\t"cmp"
\t"fmt"
\t"slices"
)

func Filtrer[T any](items []T, predicat func(T) bool) []T {
\tvar res []T
\tfor _, item := range items {
\t\tif predicat(item) {
\t\t\tres = append(res, item)
\t\t}
\t}
\treturn res
}

func main() {
\tnombres := []int{12, 5, 88, 3, 44}
\tslices.Sort(nombres)
\tfmt.Println("Trié :", nombres)

\tpairs := Filtrer(nombres, func(n int) bool { return n%2 == 0 })
\tfmt.Println("Pairs :", pairs)
}
`,
  },
  {
    name: 'service_test.go',
    title: 'Test Unitaire (testing.T)',
    desc: 'Structure de test unitaire officiel Go avec table-driven tests.',
    code: `package main

import (
\t"testing"
)

func Somme(a, b int) int {
\treturn a + b
}

func TestSomme(t *testing.T) {
\ttests := []struct {
\t\ta, b, attendu int
\t}{
\t\t{2, 3, 5},
\t\t{-1, 1, 0},
\t\t{10, -5, 5},
\t}

\tfor _, tt := range tests {
\t\tobtenu := Somme(tt.a, tt.b)
\t\tif obtenu != tt.attendu {
\t\t\tt.Errorf("Somme(%d, %d) = %d; attendu %d", tt.a, tt.b, obtenu, tt.attendu)
\t\t}
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
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'templates' | 'backup'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const importFileRef = useRef<HTMLInputElement>(null);
  const importBackupRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileName.trim();
    if (!name) return;
    if (!name.endsWith('.go')) {
      name += '.go';
    }
    onCreateFile(name);
    setNewFileName('');
    setIsCreating(false);
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
      onRenameFile(fileId, name);
    }
    setEditingFileId(null);
  };

  const handleManualSave = () => {
    onSaveWorkspace();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLines = files.reduce(
    (acc, f) => acc + (f.content.split('\n').length || 1),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm sm:max-w-md h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl animate-slide-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  Gestionnaire de Codes Go
                  <span className="text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded">
                    {files.length} fichier(s)
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {totalLines} lignes au total • Sauvegarde automatique active
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

          {/* Quick Save Banner */}
          <div className="flex items-center justify-between bg-slate-900/90 rounded-lg p-2 border border-slate-800 text-xs mt-2">
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {lastSavedAt
                  ? `Enregistré à ${lastSavedAt.toLocaleTimeString()}`
                  : 'Enregistré dans le navigateur'}
              </span>
            </div>
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1 px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-semibold transition active:scale-95"
            >
              {savedToast ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Enregistré !</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  <span>Enregistrer (Ctrl+S)</span>
                </>
              )}
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 mt-3 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'files'
                  ? 'bg-slate-800 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fichiers ({files.length})
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
              Modèles
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                activeTab === 'backup'
                  ? 'bg-slate-800 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderArchive className="w-3 h-3" />
              Sauvegarde
            </button>
          </div>
        </div>

        {/* Tab 1: Files List */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Add bar */}
            <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrer mes fichiers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition flex items-center gap-1 shrink-0 active:scale-95"
                  title="Créer un nouveau fichier"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau</span>
                </button>
              </div>

              {/* Inline create form */}
              {isCreating && (
                <form
                  onSubmit={handleCreate}
                  className="p-2.5 rounded-xl bg-slate-950 border border-sky-500/50 animate-fade-in"
                >
                  <label className="text-[11px] text-slate-400 mb-1 block">
                    Nom du nouveau fichier Go :
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="ex: utils.go"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-sky-500 text-slate-950 font-bold rounded text-xs hover:bg-sky-400 transition"
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs hover:text-white"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
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

                      {/* File metadata */}
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
          </div>
        )}

        {/* Tab 2: Starter Templates */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs text-slate-400 mb-2">
              Ajoutez un modèle prêt à l'emploi directement dans votre espace de travail :
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
                    Créer depuis modèle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Backup, Export & Restore */}
        {activeTab === 'backup' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Export */}
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Download className="w-4 h-4 text-sky-400" />
                Sauvegarder & Exporter
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Téléchargez une archive JSON complète contenant tous vos fichiers Go pour les conserver ou les transférer vers un autre appareil.
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
                  Télécharger le .go actuel
                </button>
              </div>
            </div>

            {/* Import */}
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Upload className="w-4 h-4 text-emerald-400" />
                Importer depuis votre appareil
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Chargez un fichier <code className="text-sky-300">.go</code> individuel ou restaurez une sauvegarde <code className="text-sky-300">.json</code> précédente.
              </p>

              <div className="flex flex-col gap-2 pt-1">
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
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold hover:bg-slate-700 hover:text-white transition active:scale-95"
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
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold hover:bg-slate-700 hover:text-white transition active:scale-95"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
                  Restaurer une sauvegarde .json
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
                Réinitialiser tous les fichiers
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>GopherPad Cloud-Free • Données privées</span>
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

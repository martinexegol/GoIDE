import { GoFile, FileTreeNode } from '../types';

/**
 * Normalizes a file or folder path:
 * Removes duplicate slashes, leading/trailing whitespace and slashes.
 */
export function normalizePath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

/**
 * Extracts directory name from a path (e.g. "pkg/models/user.go" -> "pkg/models")
 */
export function getDirname(filePath: string): string {
  const norm = normalizePath(filePath);
  const lastSlash = norm.lastIndexOf('/');
  return lastSlash > -1 ? norm.slice(0, lastSlash) : '';
}

/**
 * Extracts base filename from a path (e.g. "pkg/models/user.go" -> "user.go")
 */
export function getBasename(filePath: string): string {
  const norm = normalizePath(filePath);
  const lastSlash = norm.lastIndexOf('/');
  return lastSlash > -1 ? norm.slice(lastSlash + 1) : norm;
}

/**
 * Builds a hierarchical tree structure (Arborescence) from a flat list of GoFiles
 */
export function buildFileTree(files: GoFile[]): FileTreeNode[] {
  interface IntermediateFolder {
    name: string;
    path: string;
    isFolder: true;
    folders: Map<string, IntermediateFolder>;
    files: Map<string, GoFile>;
  }

  const root: IntermediateFolder = {
    name: '',
    path: '',
    isFolder: true,
    folders: new Map(),
    files: new Map(),
  };

  for (const file of files) {
    const cleanPath = normalizePath(file.name);
    const parts = cleanPath.split('/').filter(Boolean);
    const fileName = parts.pop() || cleanPath;

    let current = root;
    let curPath = '';
    for (const folder of parts) {
      curPath = curPath ? `${curPath}/${folder}` : folder;
      if (!current.folders.has(folder)) {
        current.folders.set(folder, {
          name: folder,
          path: curPath,
          isFolder: true,
          folders: new Map(),
          files: new Map(),
        });
      }
      current = current.folders.get(folder)!;
    }

    current.files.set(fileName, file);
  }

  function convertFolder(folder: IntermediateFolder): FileTreeNode[] {
    const result: FileTreeNode[] = [];

    // 1. Folders first (sorted)
    const sortedFolders = Array.from(folder.folders.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    for (const f of sortedFolders) {
      result.push({
        name: f.name,
        path: f.path,
        isFolder: true,
        children: convertFolder(f),
      });
    }

    // 2. Files next (sorted)
    const sortedFiles = Array.from(folder.files.entries()).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    for (const [name, goFile] of sortedFiles) {
      result.push({
        name,
        path: goFile.name,
        isFolder: false,
        file: goFile,
        children: [],
      });
    }

    return result;
  }

  return convertFolder(root);
}

/**
 * Standard Go Project Scaffolding
 */
export const STANDARD_GO_PROJECT_FILES: GoFile[] = [
  {
    id: 'cmd-main',
    name: 'cmd/server/main.go',
    isMain: true,
    content: `package main

import (
\t"fmt"
\t"time"
)

func main() {
\tfmt.Println("🚀 Serveur démarré à", time.Now().Format("15:04:05"))
}
`,
  },
  {
    id: 'pkg-calc',
    name: 'pkg/math/calc.go',
    content: `package math

// Additionne deux entiers
func Add(a, b int) int {
\treturn a + b
}

// Multiplie deux entiers
func Multiply(a, b int) int {
\treturn a * b
}
`,
  },
  {
    id: 'pkg-calc-test',
    name: 'pkg/math/calc_test.go',
    content: `package math

import "testing"

func TestAdd(t *testing.T) {
\tif got := Add(2, 3); got != 5 {
\t\tt.Errorf("Add(2, 3) = %d; attendu 5", got)
\t}
}
`,
  },
  {
    id: 'internal-config',
    name: 'internal/config/config.go',
    content: `package config

type Config struct {
\tPort int
\tEnv  string
}

func Load() Config {
\treturn Config{
\t\tPort: 8080,
\t\tEnv:  "development",
\t}
}
`,
  },
];

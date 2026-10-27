import { GoEducationalInsight, ParsedError } from '../types';

export interface GoFix {
  label: string;
  description: string;
  apply: (currentCode: string) => string;
}

export interface GoDiagnostic {
  id: string;
  line: number; // 1-indexed
  column?: number;
  from?: number; // character offset
  to?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  explanation: string;
  rule: string;
  fix?: GoFix;
  insight?: GoEducationalInsight;
  raw?: string;
}

// Map of standard library packages and their exported identifiers
const STD_PACKAGES: Record<string, { pkg: string; funcs: string[] }> = {
  fmt: {
    pkg: 'fmt',
    funcs: ['Println', 'Printf', 'Print', 'Sprintf', 'Sprintln', 'Sprint', 'Fprintf', 'Errorf'],
  },
  slices: {
    pkg: 'slices',
    funcs: ['Sort', 'SortFunc', 'Min', 'Max', 'Contains', 'ContainsFunc', 'Clone', 'Index', 'Insert', 'Delete', 'Compact'],
  },
  maps: {
    pkg: 'maps',
    funcs: ['Clone', 'Copy', 'DeleteFunc', 'Equal', 'EqualFunc'],
  },
  strings: {
    pkg: 'strings',
    funcs: ['Contains', 'Split', 'Join', 'ToLower', 'ToUpper', 'HasPrefix', 'HasSuffix', 'TrimSpace', 'Trim', 'ReplaceAll', 'Count', 'Index'],
  },
  time: {
    pkg: 'time',
    funcs: ['Now', 'Sleep', 'Since', 'Until', 'Date', 'Parse', 'Duration', 'Second', 'Minute', 'Hour', 'Millisecond'],
  },
  sync: {
    pkg: 'sync',
    funcs: ['WaitGroup', 'Mutex', 'RWMutex', 'Once', 'Cond', 'Pool'],
  },
  cmp: {
    pkg: 'cmp',
    funcs: ['Or', 'Compare', 'Less', 'Ordered'],
  },
  json: {
    pkg: 'encoding/json',
    funcs: ['Marshal', 'Unmarshal', 'NewDecoder', 'NewEncoder', 'Valid'],
  },
  http: {
    pkg: 'net/http',
    funcs: ['HandleFunc', 'ListenAndServe', 'NewServeMux', 'Get', 'Post', 'ResponseWriter', 'Request'],
  },
  math: {
    pkg: 'math',
    funcs: ['Sqrt', 'Max', 'Min', 'Abs', 'Floor', 'Ceil', 'Round', 'Pow', 'Pi'],
  },
  rand: {
    pkg: 'math/rand',
    funcs: ['Intn', 'Float64', 'Shuffle', 'Seed'],
  },
  os: {
    pkg: 'os',
    funcs: ['Exit', 'ReadFile', 'WriteFile', 'Getenv', 'Setenv', 'Args', 'Open', 'Create'],
  },
  log: {
    pkg: 'log',
    funcs: ['Println', 'Printf', 'Print', 'Fatal', 'Fatalf', 'Fatalln', 'Panic'],
  },
  slog: {
    pkg: 'log/slog',
    funcs: ['Info', 'Error', 'Warn', 'Debug', 'Default'],
  },
  errors: {
    pkg: 'errors',
    funcs: ['New', 'Is', 'As', 'Join'],
  },
  strconv: {
    pkg: 'strconv',
    funcs: ['Itoa', 'Atoi', 'ParseInt', 'FormatInt', 'ParseFloat'],
  },
  context: {
    pkg: 'context',
    funcs: ['Background', 'TODO', 'WithTimeout', 'WithCancel', 'WithValue', 'Context'],
  },
  testing: {
    pkg: 'testing',
    funcs: ['T', 'B', 'M'],
  },
};

// Map of common case errors (e.g. fmt.println -> fmt.Println)
const COMMON_CASE_ERRORS: Record<string, { correct: string; pkg: string }> = {
  'fmt.println': { correct: 'fmt.Println', pkg: 'fmt' },
  'fmt.printf': { correct: 'fmt.Printf', pkg: 'fmt' },
  'fmt.print': { correct: 'fmt.Print', pkg: 'fmt' },
  'fmt.sprintf': { correct: 'fmt.Sprintf', pkg: 'fmt' },
  'fmt.errorf': { correct: 'fmt.Errorf', pkg: 'fmt' },
  'slices.sort': { correct: 'slices.Sort', pkg: 'slices' },
  'slices.contains': { correct: 'slices.Contains', pkg: 'slices' },
  'slices.min': { correct: 'slices.Min', pkg: 'slices' },
  'slices.max': { correct: 'slices.Max', pkg: 'slices' },
  'slices.clone': { correct: 'slices.Clone', pkg: 'slices' },
  'maps.clone': { correct: 'maps.Clone', pkg: 'maps' },
  'maps.equal': { correct: 'maps.Equal', pkg: 'maps' },
  'strings.contains': { correct: 'strings.Contains', pkg: 'strings' },
  'strings.split': { correct: 'strings.Split', pkg: 'strings' },
  'strings.join': { correct: 'strings.Join', pkg: 'strings' },
  'strings.hasprefix': { correct: 'strings.HasPrefix', pkg: 'strings' },
  'strings.hassuffix': { correct: 'strings.HasSuffix', pkg: 'strings' },
  'strings.tolower': { correct: 'strings.ToLower', pkg: 'strings' },
  'strings.toupper': { correct: 'strings.ToUpper', pkg: 'strings' },
  'strings.trimspace': { correct: 'strings.TrimSpace', pkg: 'strings' },
  'strings.replaceall': { correct: 'strings.ReplaceAll', pkg: 'strings' },
  'time.now': { correct: 'time.Now', pkg: 'time' },
  'time.sleep': { correct: 'time.Sleep', pkg: 'time' },
  'time.since': { correct: 'time.Since', pkg: 'time' },
  'cmp.or': { correct: 'cmp.Or', pkg: 'cmp' },
  'json.marshal': { correct: 'json.Marshal', pkg: 'encoding/json' },
  'json.unmarshal': { correct: 'json.Unmarshal', pkg: 'encoding/json' },
  'http.handlefunc': { correct: 'http.HandleFunc', pkg: 'net/http' },
  'sync.waitgroup': { correct: 'sync.WaitGroup', pkg: 'sync' },
  'sync.mutex': { correct: 'sync.Mutex', pkg: 'sync' },
  'os.exit': { correct: 'os.Exit', pkg: 'os' },
  'log.println': { correct: 'log.Println', pkg: 'log' },
  'log.printf': { correct: 'log.Printf', pkg: 'log' },
  'slog.info': { correct: 'slog.Info', pkg: 'log/slog' },
  'slog.error': { correct: 'slog.Error', pkg: 'log/slog' },
};

/**
 * Inserts an import package into Go code
 */
export function addImportToCode(code: string, importPath: string): string {
  // Check if already imported
  if (new RegExp(`"${importPath}"`).test(code)) {
    return code;
  }

  // Find package main declaration
  const pkgMatch = code.match(/package\s+\w+/);
  if (!pkgMatch) {
    return `package main\n\nimport "${importPath}"\n\n${code}`;
  }

  // Check if an import ( ... ) block exists
  const blockImportMatch = code.match(/import\s*\(([\s\S]*?)\)/);
  if (blockImportMatch && blockImportMatch.index !== undefined) {
    const fullBlock = blockImportMatch[0];
    const openParenIdx = fullBlock.indexOf('(');
    const updatedBlock =
      fullBlock.slice(0, openParenIdx + 1) +
      `\n\t"${importPath}"` +
      fullBlock.slice(openParenIdx + 1);

    return (
      code.slice(0, blockImportMatch.index) +
      updatedBlock +
      code.slice(blockImportMatch.index + fullBlock.length)
    );
  }

  // Check if a single import "..." exists
  const singleImportMatch = code.match(/import\s+"([^"]+)"/);
  if (singleImportMatch && singleImportMatch.index !== undefined) {
    const existing = singleImportMatch[1];
    const replacement = `import (\n\t"${existing}"\n\t"${importPath}"\n)`;
    return (
      code.slice(0, singleImportMatch.index) +
      replacement +
      code.slice(singleImportMatch.index + singleImportMatch[0].length)
    );
  }

  // No import block at all: insert right after package statement
  const insertPos = pkgMatch.index! + pkgMatch[0].length;
  return (
    code.slice(0, insertPos) +
    `\n\nimport (\n\t"${importPath}"\n)` +
    code.slice(insertPos)
  );
}

/**
 * Removes an unused import from Go code
 */
export function removeImportFromCode(code: string, importPath: string): string {
  // Case 1: single import "foo"
  const singleRegex = new RegExp(`import\\s+"${importPath}"\\s*\\n?`, 'g');
  let updated = code.replace(singleRegex, '');

  // Case 2: inside import ( ... ) block
  const blockMatch = updated.match(/import\s*\(([\s\S]*?)\)/);
  if (blockMatch && blockMatch.index !== undefined) {
    const inner = blockMatch[1];
    // Remove the line with "${importPath}"
    const lineRegex = new RegExp(`^\\s*"${importPath}"\\s*\\n?`, 'gm');
    const newInner = inner.replace(lineRegex, '');

    // If import block is now empty or only whitespace, remove the entire import block
    if (newInner.trim() === '') {
      updated =
        updated.slice(0, blockMatch.index) +
        updated.slice(blockMatch.index + blockMatch[0].length);
    } else {
      updated =
        updated.slice(0, blockMatch.index) +
        `import (${newInner})` +
        updated.slice(blockMatch.index + blockMatch[0].length);
    }
  }

  return updated;
}

/**
 * Analyzes Go code in real time and produces actionable diagnostics with 1-click fixes
 */
export function analyzeGoCode(code: string): GoDiagnostic[] {
  const diagnostics: GoDiagnostic[] = [];
  const lines = code.split('\n');

  if (!code.trim()) {
    return diagnostics;
  }

  // Helper to get character offset of line
  const getLineOffset = (lineIndex: number): number => {
    let offset = 0;
    for (let i = 0; i < lineIndex; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    return offset;
  };

  // 1. Check for missing package main declaration
  const hasPackageDecl = /^\s*package\s+\w+/.test(code);
  if (!hasPackageDecl) {
    diagnostics.push({
      id: 'missing-package-main',
      line: 1,
      column: 1,
      from: 0,
      to: Math.min(code.length, 10),
      severity: 'error',
      rule: 'package-declaration',
      message: "Déclaration 'package main' manquante en début de fichier.",
      explanation:
        "En Go, tout programme autonome exécutable doit obligatoirement débuter par la déclaration du paquet 'package main'.",
      insight: {
        concept: "Le paquet racine d'un exécutable Go : package main",
        whatWasWrong: "Le fichier ne commence pas par la déclaration de paquet 'package main'.",
        whyGoWorksThisWay:
          "En langage Go, chaque fichier source appartient à un package. Pour compiler un programme autonome (exécutable binaire avec `go run` ou `go build`), Go exige que le package s'appelle strictement 'main'. Tous les autres noms définissent des bibliothèques partagées.",
        proTip: "La toute première ligne de code d'un script ou programme exécutable Go est toujours 'package main'.",
        officialRule: "The Go Programming Language Specification: A complete program is created by linking a single unimported package called the main package.",
      },
      fix: {
        label: "Ajouter 'package main'",
        description: "Insère la déclaration obligatoire au début du fichier.",
        apply: (c) => `package main\n\n${c}`,
      },
    });
  }

  // 1b. Check for duplicate package declarations (e.g. line 1 and line 2 'package main')
  const packageMatches: { lineIndex: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*package\s+\w+/.test(lines[i])) {
      packageMatches.push({ lineIndex: i, text: lines[i] });
    }
  }
  if (packageMatches.length > 1) {
    for (let p = 1; p < packageMatches.length; p++) {
      const dup = packageMatches[p];
      const lineOffset = getLineOffset(dup.lineIndex);
      diagnostics.push({
        id: `duplicate-package-${dup.lineIndex}`,
        line: dup.lineIndex + 1,
        column: 1,
        from: lineOffset,
        to: lineOffset + dup.text.length,
        severity: 'error',
        rule: 'duplicate-package',
        message: `Déclaration 'package' en double à la ligne ${dup.lineIndex + 1}. Un fichier Go ne peut comporter qu'une seule déclaration de package.`,
        explanation:
          "En Go, la clause 'package' doit figurer une seule fois en tout début de fichier. Une deuxième déclaration 'package' bloque le compilateur avec l'erreur : 'syntax error: non-declaration statement outside function body'.",
        insight: {
          concept: "Clause de paquet unique (Single Package Clause)",
          whatWasWrong: `Vous avez déclaré deux fois 'package' (ligne ${packageMatches[0].lineIndex + 1} et ligne ${dup.lineIndex + 1}).`,
          whyGoWorksThisWay:
            "En Go, un fichier source appartient entièrement à un seul package. Déclarer une deuxième fois 'package' est invalide car le compilateur s'attend à des déclarations de variables, types ou fonctions.",
          proTip: "Supprimez la ligne 'package' redondante pour restaurer la compilation.",
          officialRule: "A source file begins with a package clause defining the package to which the file belongs.",
        },
        fix: {
          label: `Supprimer 'package' en double (ligne ${dup.lineIndex + 1})`,
          description: "Supprime la déclaration de package superflue pour restaurer la compilation.",
          apply: (c) => {
            const allLines = c.split('\n');
            allLines.splice(dup.lineIndex, 1);
            return allLines.join('\n');
          },
        },
      });
    }
  }

  // 2. Check for missing func main() when package is main
  if (hasPackageDecl && /package\s+main\b/.test(code)) {
    const hasFuncMain = /func\s+main\s*\(\s*\)/.test(code);
    if (!hasFuncMain) {
      diagnostics.push({
        id: 'missing-func-main',
        line: lines.length,
        column: 1,
        from: code.length - 1,
        to: code.length,
        severity: 'error',
        rule: 'func-main',
        message: "Fonction d'entrée 'func main()' introuvable.",
        explanation:
          "Le paquet 'main' exige une fonction 'func main()' sans argument ni retour, qui sert de point d'entrée pour l'exécution.",
        insight: {
          concept: "Le point d'entrée universel : func main()",
          whatWasWrong: "Votre programme a un 'package main' mais ne définit pas de fonction 'func main()'.",
          whyGoWorksThisWay:
            "Le compilateur Go cherche toujours 'func main()' comme point de départ unique lors de l'exécution. Contrairement à d'autres langages (C ou Java), en Go 'main()' ne prend AUCUN argument et ne retourne AUCUNE valeur. Pour lire les arguments système, on utilise le package standard 'os.Args'.",
          proTip: "Écrivez toujours 'func main() { ... }' pour démarrer l'exécution de vos instructions.",
          officialRule: "Package main must define a function main that takes no arguments and returns no value.",
        },
        fix: {
          label: "Créer la fonction main()",
          description: "Ajoute le squelette de la fonction main() à la fin du fichier.",
          apply: (c) => `${c.trimEnd()}\n\nfunc main() {\n\t// Votre code ici\n}\n`,
        },
      });
    }
  }

  // 3. Extract currently imported packages
  const importedPackages = new Set<string>();
  const importLines: { pkg: string; lineIndex: number; importPath: string }[] = [];

  // Match single imports
  const singleImportRegex = /import\s+"([^"]+)"/g;
  let singleMatch;
  while ((singleMatch = singleImportRegex.exec(code)) !== null) {
    const fullPath = singleMatch[1];
    const basePkg = fullPath.split('/').pop() || fullPath;
    importedPackages.add(basePkg);
    const lineIndex = code.slice(0, singleMatch.index).split('\n').length - 1;
    importLines.push({ pkg: basePkg, lineIndex, importPath: fullPath });
  }

  // Match block imports
  const blockMatch = code.match(/import\s*\(([\s\S]*?)\)/);
  if (blockMatch && blockMatch.index !== undefined) {
    const inner = blockMatch[1];
    const blockStartOffset = blockMatch.index;
    const innerLines = inner.split('\n');

    let currentOffset = blockStartOffset + blockMatch[0].indexOf('(') + 1;
    for (let i = 0; i < innerLines.length; i++) {
      const lineStr = innerLines[i];
      const match = lineStr.match(/"([^"]+)"/);
      if (match) {
        const fullPath = match[1];
        const basePkg = fullPath.split('/').pop() || fullPath;
        importedPackages.add(basePkg);
        const lineIndex = code.slice(0, currentOffset).split('\n').length - 1;
        importLines.push({ pkg: basePkg, lineIndex, importPath: fullPath });
      }
      currentOffset += lineStr.length + 1;
    }
  }

  // 4. Check for Unused Imports (Go's strict rule: imported and not used)
  for (const item of importLines) {
    const codeWithoutImports = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/import\s*\([\s\S]*?\)/g, '')
      .replace(/import\s+"[^"]+"/g, '');

    const pkgUsageRegex = new RegExp(`\\b${item.pkg}\\.`, 'g');
    const isUsed = pkgUsageRegex.test(codeWithoutImports);

    if (!isUsed) {
      const lineOffset = getLineOffset(item.lineIndex);
      diagnostics.push({
        id: `unused-import-${item.pkg}`,
        line: item.lineIndex + 1,
        column: 1,
        from: lineOffset,
        to: lineOffset + (lines[item.lineIndex]?.length || 10),
        severity: 'warning',
        rule: 'unused-import',
        message: `Package "${item.importPath}" importé mais non utilisé.`,
        explanation: `En Go, tout package importé doit être obligatoirement utilisé, sinon le compilateur bloque immédiatement avec l'erreur : "${item.importPath}" imported and not used.`,
        insight: {
          concept: "Tolérance Zéro pour le code mort (Imports inutilisés)",
          whatWasWrong: `Vous avez importé "${item.importPath}", mais aucune fonction de ce package n'est appelée.`,
          whyGoWorksThisWay:
            "Les concepteurs de Go (Google) ont volontairement interdit les imports inutilisés au niveau du compilateur. Cela permet à Go de compiler des projets de millions de lignes en quelques secondes, élimine les dépendances fantômes et garantit que votre binaire reste le plus compact possible.",
          proTip: "Si vous devez importer un package uniquement pour ses effets de bord (son bloc init()), préfixez-le d'un tiret du bas : _ \"nom/du/package\". Sinon, supprimez l'import.",
          officialRule: "It is an error to import a package and not refer to its exported identifiers.",
        },
        fix: {
          label: `Supprimer l'import "${item.importPath}"`,
          description: `Retire la ligne d'import inutilisée pour éviter le rejet du compilateur.`,
          apply: (c) => removeImportFromCode(c, item.importPath),
        },
      });
    }
  }

  // 5. Check for Missing Imports (Standard Library packages called without import)
  for (const [pkgIdent, info] of Object.entries(STD_PACKAGES)) {
    if (!importedPackages.has(pkgIdent)) {
      const callRegex = new RegExp(`\\b${pkgIdent}\\.([A-Za-z0-9_]+)`, 'g');
      let callMatch;
      let firstFoundLine: number | null = null;
      let firstMatchCol = 1;
      let firstMatchPos = 0;
      let funcName = '';

      while ((callMatch = callRegex.exec(code)) !== null) {
        const lineIdx = code.slice(0, callMatch.index).split('\n').length - 1;
        const lineText = lines[lineIdx] || '';
        const trimmed = lineText.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

        if (firstFoundLine === null) {
          firstFoundLine = lineIdx;
          firstMatchCol = (lineText.indexOf(callMatch[0]) || 0) + 1;
          firstMatchPos = callMatch.index;
          funcName = callMatch[1];
          break;
        }
      }

      if (firstFoundLine !== null) {
        const lineOffset = getLineOffset(firstFoundLine);
        diagnostics.push({
          id: `missing-import-${pkgIdent}`,
          line: firstFoundLine + 1,
          column: firstMatchCol,
          from: firstMatchPos,
          to: firstMatchPos + pkgIdent.length,
          severity: 'error',
          rule: 'missing-import',
          message: `Package standard '${pkgIdent}' utilisé (${pkgIdent}.${funcName}) mais non importé.`,
          explanation: `Le compilateur Go refuse le symbole '${pkgIdent}' tant que 'import "${info.pkg}"' n'est pas présent dans l'en-tête du fichier.`,
          insight: {
            concept: "Importations explicites : Aucun symbole magique",
            whatWasWrong: `Vous appelez '${pkgIdent}.${funcName}' sans avoir importé "${info.pkg}".`,
            whyGoWorksThisWay:
              "En Go, il n'existe pas d'importation globale ou implicite. Chaque package externe doit figurer en toutes lettres dans le bloc 'import' en tête de fichier pour que le code soit 100% autodocumenté et prévisible.",
            proTip: `Placez vos imports dans un bloc 'import ( "${info.pkg}" )' au début de votre fichier.`,
            officialRule: "Packages referenced in source must be declared in an import declaration.",
          },
          fix: {
            label: `Ajouter import "${info.pkg}"`,
            description: `Insère l'import '${info.pkg}' dans le bloc d'importation.`,
            apply: (c) => addImportToCode(c, info.pkg),
          },
        });
      }
    }
  }

  // 6. Check for Common Lowercase / Case Sensitivity Errors (e.g. fmt.println)
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    for (const [wrong, info] of Object.entries(COMMON_CASE_ERRORS)) {
      const idx = lineText.indexOf(wrong);
      if (idx !== -1) {
        const lineOffset = getLineOffset(lineIdx);
        diagnostics.push({
          id: `case-error-${wrong}-${lineIdx}`,
          line: lineIdx + 1,
          column: idx + 1,
          from: lineOffset + idx,
          to: lineOffset + idx + wrong.length,
          severity: 'error',
          rule: 'case-sensitivity',
          message: `Casse incorrecte : '${wrong}' au lieu de '${info.correct}'.`,
          explanation: `En Go, toutes les fonctions publiques exportées débutent par une MAJUSCULE. '${wrong}' est inconnu du compilateur.`,
          insight: {
            concept: "Visibilité par la casse : Majuscule = Exporté (Public)",
            whatWasWrong: `Vous avez écrit '${wrong}' avec une minuscule.`,
            whyGoWorksThisWay:
              "C'est l'un des piliers du langage Go : il n'y a pas de mot-clé 'public' ou 'private'. La visibilité dépend de la casse de la première lettre. Une Majuscule (ex: 'Println') rend l'identifiant exporté (accessible en dehors de son package). Une minuscule (ex: 'println') le rend privé et inaccessible.",
            proTip: "Règle mémo : Majuscule = Monde extérieur (Public). Minuscule = Maison (Privé). Toutes les fonctions d'autres packages s'écrivent donc avec une Majuscule.",
            officialRule: "An identifier is exported if the first character of the identifier's name is a Unicode upper case letter.",
          },
          fix: {
            label: `Remplacer par '${info.correct}'`,
            description: `Corrige la majuscule obligatoire pour la fonction exportée.`,
            apply: (c) => {
              let updated = c.replace(new RegExp(`\\b${wrong.replace('.', '\\.')}\\b`, 'g'), info.correct);
              if (!new RegExp(`"${info.pkg}"`).test(updated)) {
                updated = addImportToCode(updated, info.pkg);
              }
              return updated;
            },
          },
        });
      }
    }
  }

  // 7. Check for built-in print / println usage (Go best practice: prefer fmt.Println)
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    const builtInPrintMatch = lineText.match(/\b(println|print)\s*\(/);
    if (builtInPrintMatch && builtInPrintMatch.index !== undefined) {
      const prevChar = builtInPrintMatch.index > 0 ? lineText[builtInPrintMatch.index - 1] : '';
      if (prevChar !== '.') {
        const lineOffset = getLineOffset(lineIdx);
        const matchStr = builtInPrintMatch[1];
        diagnostics.push({
          id: `builtin-print-${lineIdx}`,
          line: lineIdx + 1,
          column: builtInPrintMatch.index + 1,
          from: lineOffset + builtInPrintMatch.index,
          to: lineOffset + builtInPrintMatch.index + matchStr.length,
          severity: 'info',
          rule: 'idiomatic-print',
          message: `Utilisation de '${matchStr}()' natif : il est fortement recommandé d'utiliser 'fmt.Println()' en Go.`,
          explanation: `'${matchStr}()' est une fonction interne de bootstrap réservée au compilateur sans garantie de formatage standard. Le standard officiel de Go est 'fmt.Println()'.`,
          insight: {
            concept: "Sortie standard idiomatique : fmt.Println() vs print()",
            whatWasWrong: `Vous utilisez la primitive '${matchStr}()' intégrée au runtime.`,
            whyGoWorksThisWay:
              "En Go, 'print' et 'println' sont des fonctions rudimentaires réservées au bootstrapping du runtime et au débogage du compilateur lui-même. Elles écrivent sur stderr sans buffer et ne respectent pas le formatage standard. Tout code Go propre et idiomatique utilise le package officiel 'fmt'.",
            proTip: "Utilisez 'fmt.Println()' pour les lignes simples, et 'fmt.Printf()' quand vous avez besoin de formater avec des verbes (%v, %d, %s).",
            officialRule: "Current implementations provide several built-in functions useful during bootstrap: print, println. They are not guaranteed to stay in the language.",
          },
          fix: {
            label: "Remplacer par 'fmt.Println'",
            description: "Adopte le standard idiomatique officiel avec le package 'fmt'.",
            apply: (c) => {
              const updated = c.replace(/\b(println|print)\s*\(/g, 'fmt.Println(');
              return addImportToCode(updated, 'fmt');
            },
          },
        });
      }
    }
  }

  // 8. Check for Double Colon or Spacing Typo (e.g. x ::= 10 or x : = 10)
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    const typoMatch = lineText.match(/(::=|:\s+=)/);
    if (typoMatch && typoMatch.index !== undefined) {
      const lineOffset = getLineOffset(lineIdx);
      diagnostics.push({
        id: `typo-assign-${lineIdx}`,
        line: lineIdx + 1,
        column: typoMatch.index + 1,
        from: lineOffset + typoMatch.index,
        to: lineOffset + typoMatch.index + typoMatch[0].length,
        severity: 'error',
        rule: 'assign-syntax',
        message: `Erreur de syntaxe d'assignation courte : '${typoMatch[0]}'.`,
        explanation: `En Go, l'assignation courte s'écrit obligatoirement ':=' (sans espace ni double deux-points).`,
        insight: {
          concept: "Syntaxe de l'assignation courte ':='",
          whatWasWrong: `Vous avez écrit '${typoMatch[0]}' au lieu de ':='`,
          whyGoWorksThisWay:
            "L'opérateur ':=' (Walrus operator) est un jeton atomique de deux caractères accolés. Il déclare une variable et en déduit son type à partir de la valeur de droite en une seule opération concise.",
          proTip: "Écrivez toujours ':=' collé sans espace : 'score := 100'.",
        },
        fix: {
          label: "Corriger en ':='",
          description: "Rétablit l'opérateur d'assignation Go correct.",
          apply: (c) => c.replace(/(::=|:\s+=)/g, ':='),
        },
      });
    }
  }

  // 9. Check for Semicolon before opening brace in control structures (e.g. if x == 1; {)
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    const semiBraceMatch = lineText.match(/\b(if|for)\s+[^;{]+;\s*\{/);
    if (semiBraceMatch && semiBraceMatch.index !== undefined) {
      if (!lineText.includes(':=') && !lineText.includes(' = ')) {
        const lineOffset = getLineOffset(lineIdx);
        diagnostics.push({
          id: `semicolon-brace-${lineIdx}`,
          line: lineIdx + 1,
          column: lineText.indexOf(';'),
          from: lineOffset + lineText.indexOf(';'),
          to: lineOffset + lineText.indexOf(';') + 1,
          severity: 'error',
          rule: 'control-semicolon',
          message: `Point-virgule ';' superflu avant l'accolade '{'.`,
          explanation: `En Go, les conditions de boucle 'for' ou 'if' ne doivent pas se terminer par un point-virgule avant l'accolade ouvrante.`,
          insight: {
            concept: "Insertion automatique des points-virgules & Accolades",
            whatWasWrong: "Un point-virgule ';' a été placé juste avant l'accolade ouvrante '{'.",
            whyGoWorksThisWay:
              "En Go, l'analyseur lexical insère automatiquement des points-virgules en fin de ligne selon des règles précises. Ajouter manuellement un ';' avant '{' tronque la clause conditionnelle.",
            proTip: "En Go : jamais de parenthèses autour des conditions 'if' ou 'for', et jamais de point-virgule avant l'accolade ouvrante '{'.",
          },
          fix: {
            label: "Supprimer le point-virgule",
            description: "Retire le point-virgule superflu.",
            apply: (c) => c.replace(/;\s*\{/g, ' {'),
          },
        });
      }
    }
  }

  // 10. Check for Unclosed Braces, Parentheses or Brackets
  let openBraces = 0;
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prev = i > 0 ? code[i - 1] : '';

    if (inString) {
      if (char === stringChar && prev !== '\\') {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '{') openBraces++;
    else if (char === '}') openBraces--;
  }

  if (openBraces > 0) {
    diagnostics.push({
      id: 'unclosed-braces',
      line: lines.length,
      column: 1,
      from: code.length - 1,
      to: code.length,
      severity: 'error',
      rule: 'unclosed-braces',
      message: `${openBraces} accolade(s) ouvrante(s) '{' non refermée(s).`,
      explanation: `Chaque bloc d'instructions de fonction ou de structure doit être fermé par une accolade '}'.`,
      insight: {
        concept: "Équilibrage des blocs de code : Accolades { ... }",
        whatWasWrong: `Il manque ${openBraces} accolade(s) fermante(s) '}'.`,
        whyGoWorksThisWay:
          "En Go, la portée lexicale (variables, fonctions, boucles) est délimitée strictement par des accolades '{' et '}'. Oublier de fermer un bloc empêche l'analyseur syntaxique de délimiter la fin de la fonction.",
        proTip: "Gardez toujours vos accolades alignées avec le mot-clé de début ('func', 'for', 'if').",
      },
      fix: {
        label: `Ajouter les ${openBraces} accolade(s) '}'`,
        description: `Referme automatiquement tous les blocs ouverts à la fin du fichier.`,
        apply: (c) => `${c.trimEnd()}\n${'}'.repeat(openBraces)}\n`,
      },
    });
  }

  return diagnostics;
}

/**
 * Analyzes compiler output and generates structured educational insight and 1-click fixes
 */
export function explainAndFixCompilerError(
  rawMessage: string,
  code: string,
  line: number = 1
): GoDiagnostic {
  const trimmed = rawMessage.trim();

  // Pattern 1: undefined: fmt.println or undefined: xxx
  const undefinedMatch = trimmed.match(/undefined:\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
  if (undefinedMatch) {
    const pkg = undefinedMatch[1];
    const member = undefinedMatch[2];
    const candidateLower = `${pkg}.${member.toLowerCase()}`;
    const knownError = COMMON_CASE_ERRORS[candidateLower];

    if (knownError) {
      return {
        id: `comp-case-${Date.now()}`,
        line,
        severity: 'error',
        rule: 'compiler-case-error',
        message: `Erreur du compilateur : '${pkg}.${member}' n'existe pas. Vouliez-vous dire '${knownError.correct}' ?`,
        explanation: `En Go, les identifiants exportés commencent toujours par une Majuscule. '${pkg}.${member}' est inconnu du package '${pkg}'.`,
        insight: {
          concept: "Visibilité des identifiants (Exported Identifiers)",
          whatWasWrong: `Le compilateur Go a rejeté '${pkg}.${member}'.`,
          whyGoWorksThisWay:
            "En Go, il n'y a pas de mot-clé 'public'. Seules les fonctions débutant par une Majuscule sont visibles depuis l'extérieur du package.",
          proTip: `Utilisez '${knownError.correct}' avec une majuscule.`,
        },
        fix: {
          label: `Remplacer par '${knownError.correct}'`,
          description: `Corrige la casse vers '${knownError.correct}'.`,
          apply: (c) => c.replace(new RegExp(`\\b${pkg}\\.${member}\\b`, 'g'), knownError.correct),
        },
      };
    }
  }

  // Pattern 2: imported and not used: "xyz"
  const unusedMatch = trimmed.match(/(?:imported and not used:\s*"([^"]+)"|"([^"]+)"\s+imported and not used)/);
  if (unusedMatch) {
    const pkgPath = unusedMatch[1] || unusedMatch[2];
    return {
      id: `comp-unused-${Date.now()}`,
      line,
      severity: 'error',
      rule: 'compiler-unused-import',
      message: `Erreur du compilateur : Package "${pkgPath}" importé mais non utilisé.`,
      explanation: `Le compilateur Go interdit les imports morts pour garantir des temps de build éclairs et un code propre.`,
      insight: {
        concept: "Tolérance Zéro pour les imports inutilisés",
        whatWasWrong: `Le package "${pkgPath}" est dans les imports mais non utilisé dans le corps du code.`,
        whyGoWorksThisWay:
          "Go refuse de compiler les programmes avec des imports inutilisés pour éviter d'embarquer des dépendances superflues et pour préserver une vitesse de compilation maximale.",
        proTip: "Supprimez l'import ou utilisez une fonction de ce package.",
      },
      fix: {
        label: `Supprimer l'import "${pkgPath}"`,
        description: `Retire "${pkgPath}" des imports.`,
        apply: (c) => removeImportFromCode(c, pkgPath),
      },
    };
  }

  // Pattern 3: no new variables on left side of :=
  if (trimmed.includes('no new variables on left side of :=')) {
    return {
      id: `comp-walrus-${Date.now()}`,
      line,
      severity: 'error',
      rule: 'compiler-reassign',
      message: "Erreur de réassignation : vous utilisez ':=' sur une variable qui existe déjà.",
      explanation: "L'opérateur ':=' sert à déclarer de nouvelles variables. Pour réassigner une variable déjà déclarée, utilisez '='.",
      insight: {
        concept: "Déclaration ':=' versus Réassignation '='",
        whatWasWrong: "Vous avez réutilisé ':=' pour une variable qui a déjà été déclarée plus haut.",
        whyGoWorksThisWay:
          "En Go, l'opérateur ':=' exige qu'au moins une variable à gauche soit nouvelle dans la portée courante. Pour mettre à jour une variable existante, il faut utiliser l'opérateur d'assignation standard '='.",
        proTip: "Règle : ':=' pour créer une variable pour la 1ère fois, '=' pour changer sa valeur ensuite.",
      },
      fix: {
        label: "Changer ':=' en '='",
        description: "Remplace la déclaration par une simple assignation.",
        apply: (c) => {
          const linesList = c.split('\n');
          if (linesList[line - 1]) {
            linesList[line - 1] = linesList[line - 1].replace(':=', '=');
            return linesList.join('\n');
          }
          return c.replace(':=', '=');
        },
      },
    };
  }

  // Pattern 4: undefined: fmt (or any standard package)
  const undefinedPkgMatch = trimmed.match(/undefined:\s+([a-zA-Z0-9_]+)\b/);
  if (undefinedPkgMatch) {
    const pkgName = undefinedPkgMatch[1];
    if (STD_PACKAGES[pkgName]) {
      const fullPkg = STD_PACKAGES[pkgName].pkg;
      return {
        id: `comp-missing-${Date.now()}`,
        line,
        severity: 'error',
        rule: 'compiler-missing-import',
        message: `Erreur du compilateur : '${pkgName}' est inconnu car le package n'est pas importé.`,
        explanation: `Pour utiliser le package standard '${pkgName}', vous devez ajouter 'import "${fullPkg}"' en début de fichier.`,
        insight: {
          concept: "Import explicite de package",
          whatWasWrong: `Le symbole '${pkgName}' n'a pas été reconnu par le compilateur.`,
          whyGoWorksThisWay:
            "En Go, chaque dépendance doit être explicitement déclarée en tête de fichier pour que le compilateur sache où trouver les types et fonctions.",
          proTip: `Ajoutez 'import "${fullPkg}"' pour accéder à ses fonctions.`,
        },
        fix: {
          label: `Ajouter import "${fullPkg}"`,
          description: `Importe le package '${fullPkg}'.`,
          apply: (c) => addImportToCode(c, fullPkg),
        },
      };
    }
  }

  // Pattern 5: syntax error: non-declaration statement outside function body
  if (trimmed.includes('non-declaration statement outside function body')) {
    const linesList = code.split('\n');
    const targetLineText = linesList[line - 1] || '';

    // Check if target line is a duplicate package declaration (e.g. line 2 'package main')
    if (/^\s*package\s+\w+/.test(targetLineText) && line > 1) {
      return {
        id: `comp-dup-pkg-${Date.now()}`,
        line,
        severity: 'error',
        rule: 'duplicate-package',
        message: `Déclaration 'package' en double à la ligne ${line}.`,
        explanation: `Un fichier Go ne peut comporter qu'une seule clause de package en tête de fichier. La clause à la ligne ${line} est redondante.`,
        insight: {
          concept: "Clause de paquet unique en tête de fichier",
          whatWasWrong: `La ligne ${line} contient une deuxième déclaration 'package main' qui perturbe le compilateur.`,
          whyGoWorksThisWay: "Un fichier source Go n'appartient qu'à un seul package. Toute déclaration de package répétée est rejetée comme une instruction hors fonction.",
          proTip: "Supprimez la ligne de package en double pour restaurer la compilation.",
        },
        fix: {
          label: `Supprimer 'package' en double (ligne ${line})`,
          description: "Retire la ligne 2 pour que le compilateur accepte le programme.",
          apply: (c) => {
            const l = c.split('\n');
            if (l.length >= line) {
              l.splice(line - 1, 1);
              return l.join('\n');
            }
            return autoRepairGoCode(c).repairedCode;
          },
        },
      };
    }

    return {
      id: `comp-nondecl-${Date.now()}`,
      line,
      severity: 'error',
      rule: 'statement-outside-function',
      message: `Instruction hors fonction à la ligne ${line}.`,
      explanation: `En Go, seules les déclarations (var, const, type, func, import) peuvent être au niveau du package. Les instructions exécutables doivent être placées à l'intérieur d'une fonction (ex: func main()).`,
      insight: {
        concept: "Instructions exécutables à l'intérieur des fonctions",
        whatWasWrong: `L'instruction à la ligne ${line} est en dehors du corps d'une fonction.`,
        whyGoWorksThisWay: "Go est un langage compilé strict : aucun code exécutable libre ne peut flotter au niveau global.",
        proTip: "Placez votre instruction dans la fonction 'func main() { ... }'.",
      },
      fix: {
        label: "Corriger avec l'IDE (surligné 1 min)",
        description: "Nettoie la structure du fichier et replace les instructions.",
        apply: (c) => autoRepairGoCode(c).repairedCode,
      },
    };
  }

  // Pattern 6: syntax error: imports must appear before other declarations
  if (trimmed.includes('imports must appear before other declarations')) {
    return {
      id: `comp-import-order-${Date.now()}`,
      line,
      severity: 'error',
      rule: 'import-order',
      message: "L'importation doit se situer avant toute autre déclaration.",
      explanation: "En Go, l'ordre légal d'un fichier source est : 'package ...' puis 'import (...)', puis les déclarations de fonctions ou variables.",
      insight: {
        concept: "Ordre structurel strict des fichiers Go",
        whatWasWrong: "Le bloc d'importation apparaît après des déclarations de package ou de code.",
        whyGoWorksThisWay: "Go impose une structure prévisible : d'abord le package, puis les dépendances (imports), puis le corps du code.",
        proTip: "Placez toujours le bloc import (...) juste après 'package main'.",
      },
      fix: {
        label: "Réordonner la structure du fichier",
        description: "Nettoie et réorganise les déclarations dans l'ordre Go officiel.",
        apply: (c) => autoRepairGoCode(c).repairedCode,
      },
    };
  }

  // Fallback generic compiler error with explanation and auto-repair fix
  return {
    id: `comp-gen-${Date.now()}`,
    line,
    severity: 'error',
    rule: 'compiler-generic',
    message: trimmed,
    explanation: `Le compilateur Go officiel a signalé : "${trimmed}". Corrigez la ligne ${line} pour permettre la génération du binaire.`,
    insight: {
      concept: "Diagnostic du compilateur Go",
      whatWasWrong: `Le compilateur a rencontré l'erreur : "${trimmed}"`,
      whyGoWorksThisWay:
        "Le compilateur Go applique des vérifications strictes de types, de portée et de syntaxe pour garantir qu'aucune erreur ne survive au moment de l'exécution.",
      proTip: "Vérifiez les types des variables et les arguments de la fonction.",
    },
    fix: {
      label: "Corriger automatiquement les erreurs",
      description: "L'IDE analyse et applique automatiquement les réparations de syntaxe, d'imports et de doublons.",
      apply: (c) => autoRepairGoCode(c).repairedCode,
    },
  };
}

/**
 * Master repair function: automatically corrects syntax, structure, duplicate packages,
 * misplaced imports, lowercase function typos, and unclosed braces.
 */
export function autoRepairGoCode(code: string, parsedErrors: ParsedError[] = []): {
  repairedCode: string;
  hasChanges: boolean;
  changesApplied: string[];
} {
  let updated = code;
  const changes: string[] = [];

  // 1. Remove duplicate package declarations (e.g. line 1 and 2 'package main')
  const lines = updated.split('\n');
  const pkgLines: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*package\s+\w+/.test(lines[i])) {
      pkgLines.push(i);
    }
  }
  if (pkgLines.length > 1) {
    for (let i = pkgLines.length - 1; i >= 1; i--) {
      const idxToRemove = pkgLines[i];
      lines.splice(idxToRemove, 1);
      changes.push(`Suppression de 'package' redondant (ligne ${idxToRemove + 1})`);
    }
    updated = lines.join('\n');
  }

  // 2. Ensure package main exists if missing
  if (!/^\s*package\s+\w+/m.test(updated)) {
    updated = `package main\n\n${updated}`;
    changes.push("Ajout de 'package main'");
  }

  // 3. Fix common lowercase functions (fmt.println -> fmt.Println)
  for (const [wrong, info] of Object.entries(COMMON_CASE_ERRORS)) {
    if (updated.includes(wrong)) {
      updated = updated.split(wrong).join(info.correct);
      changes.push(`Correction '${wrong}' ➔ '${info.correct}'`);
      updated = addImportToCode(updated, info.pkg);
    }
  }

  // 4. Fix builtin print/println -> fmt.Println
  if (/\b(println|print)\s*\(/.test(updated) && !/\bfmt\.(println|print)\b/.test(updated)) {
    updated = updated.replace(/\bprintln\s*\(/g, 'fmt.Println(');
    updated = updated.replace(/\bprint\s*\(/g, 'fmt.Print(');
    updated = addImportToCode(updated, 'fmt');
    changes.push("Remplacement de 'println()' par 'fmt.Println()'");
  }

  // 5. Fix := typos (::= or : =)
  if (/::=|:\s+=/.test(updated)) {
    updated = updated.replace(/::=|:\s+=/g, ':=');
    changes.push("Correction de l'opérateur d'assignation ':='");
  }

  // 6. Fix compiler-reported unused imports
  for (const err of parsedErrors) {
    const unusedMatch = err.message.match(/(?:imported and not used:\s*"([^"]+)"|"([^"]+)"\s+imported and not used)/);
    if (unusedMatch) {
      const pkgToRemove = unusedMatch[1] || unusedMatch[2];
      if (pkgToRemove) {
        updated = removeImportFromCode(updated, pkgToRemove);
        changes.push(`Suppression de l'import inutilisé "${pkgToRemove}"`);
      }
    }
  }

  // 7. Check unclosed braces
  let openBraces = 0;
  let inString = false;
  let strChar = '';
  for (let i = 0; i < updated.length; i++) {
    const char = updated[i];
    const prev = i > 0 ? updated[i - 1] : '';
    if (inString) {
      if (char === strChar && prev !== '\\') inString = false;
      continue;
    }
    if (char === '"' || char === '`') {
      inString = true;
      strChar = char;
      continue;
    }
    if (char === '{') openBraces++;
    else if (char === '}') openBraces--;
  }

  if (openBraces > 0) {
    updated = `${updated.trimEnd()}\n${'}'.repeat(openBraces)}\n`;
    changes.push(`Ajout de ${openBraces} accolade(s) fermante(s) '}'`);
  }

  // 8. Run any available static diagnostics fixes
  const staticDiags = analyzeGoCode(updated);
  for (const d of staticDiags) {
    if (d.fix) {
      try {
        const next = d.fix.apply(updated);
        if (next !== updated) {
          updated = next;
          changes.push(d.fix.label);
        }
      } catch {
        // ignore
      }
    }
  }

  return {
    repairedCode: updated,
    hasChanges: updated !== code,
    changesApplied: changes,
  };
}

/**
 * Applies all available automatic fixes sequentially to the Go code
 */
export function applyAllFixes(code: string, diagnostics: GoDiagnostic[]): string {
  let updatedCode = code;
  const fixableDiagnostics = diagnostics.filter((d) => d.fix !== undefined);

  for (const diag of fixableDiagnostics) {
    if (diag.fix) {
      try {
        updatedCode = diag.fix.apply(updatedCode);
      } catch (err) {
        console.error('Failed to apply fix:', diag.id, err);
      }
    }
  }

  // If no static fix was applied, run master auto-repair
  if (updatedCode === code) {
    updatedCode = autoRepairGoCode(code).repairedCode;
  }

  return updatedCode;
}

/**
 * Detects which lines were modified, added, or replaced between oldCode and newCode.
 * Returns 1-based line numbers in the new document.
 */
export function findModifiedLineNumbers(oldCode: string, newCode: string): number[] {
  if (oldCode === newCode) return [];
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');

  // Match common prefix lines
  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) {
    prefix++;
  }

  // Match common suffix lines from end
  let oldSuffix = oldLines.length - 1;
  let newSuffix = newLines.length - 1;
  while (
    oldSuffix >= prefix &&
    newSuffix >= prefix &&
    oldLines[oldSuffix] === newLines[newSuffix]
  ) {
    oldSuffix--;
    newSuffix--;
  }

  const modifiedLines: number[] = [];
  for (let i = prefix; i <= newSuffix; i++) {
    modifiedLines.push(i + 1); // 1-based line number
  }

  // If a line was deleted (e.g., redundant package or unused import), newSuffix < prefix
  if (modifiedLines.length === 0) {
    // The target is the remaining statement at prefix or immediately before it (e.g. package main)
    if (prefix > 0 && newLines[prefix - 1]?.trim().length > 0) {
      modifiedLines.push(prefix);
    } else if (prefix < newLines.length && newLines[prefix]?.trim().length > 0) {
      modifiedLines.push(prefix + 1);
    } else {
      let found = false;
      for (let j = Math.max(0, prefix - 1); j < newLines.length; j++) {
        if (newLines[j].trim().length > 0) {
          modifiedLines.push(j + 1);
          found = true;
          break;
        }
      }
      if (!found) {
        modifiedLines.push(Math.min(prefix + 1, Math.max(1, newLines.length)));
      }
    }
  }

  // If the modified line is completely blank, ensure we also include an adjacent line with real code
  const resultLines: number[] = [];
  for (const lineNum of modifiedLines) {
    const text = newLines[lineNum - 1];
    if (text && text.trim().length > 0) {
      resultLines.push(lineNum);
    } else {
      if (lineNum > 1 && newLines[lineNum - 2]?.trim().length > 0) {
        resultLines.push(lineNum - 1);
      } else if (lineNum < newLines.length && newLines[lineNum]?.trim().length > 0) {
        resultLines.push(lineNum + 1);
      } else {
        resultLines.push(lineNum);
      }
    }
  }

  return [...new Set(resultLines)].sort((a, b) => a - b);
}


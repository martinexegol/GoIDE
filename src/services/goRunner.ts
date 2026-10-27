import { CompileResult, ParsedError } from '../types';

/**
 * Detects if Go code uses standard input (fmt.Scan, bufio.Scanner, os.Stdin, etc.)
 */
export function detectStdinUsage(code: string): boolean {
  if (!code) return false;
  return /\b(?:fmt\.(?:Scan|Scanln|Scanf)|os\.Stdin|bufio\.New(?:Scanner|Reader))\b/.test(code);
}

/**
 * Prepares Go code with virtual stdin input pipe when stdin is provided
 * Restores exact user line numbers using //line directives
 */
export function prepareGoCodeWithStdin(code: string, stdinText?: string): string {
  if (!stdinText || stdinText.trim() === '') {
    return code;
  }

  const escaped = JSON.stringify(stdinText.endsWith('\n') ? stdinText : stdinText + '\n');
  const lines = code.split('\n');

  let codeWithImport = code;
  let importLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s*\(/.test(lines[i])) {
      importLineIdx = i + 1;
      break;
    }
  }

  if (importLineIdx !== -1) {
    lines.splice(importLineIdx, 0, `\t_gopher_os "os"\n//line main.go:${importLineIdx + 1}:1`);
    codeWithImport = lines.join('\n');
  } else if (/^\s*import\s+"[^"]+"/m.test(code)) {
    const singleIdx = lines.findIndex((l) => /^\s*import\s+"[^"]+"/.test(l));
    lines.splice(singleIdx + 1, 0, `import _gopher_os "os"\n//line main.go:${singleIdx + 2}:1`);
    codeWithImport = lines.join('\n');
  } else {
    const pkgIdx = lines.findIndex((l) => /^\s*package\s+\w+/.test(l));
    const targetIdx = pkgIdx !== -1 ? pkgIdx + 1 : 0;
    lines.splice(targetIdx, 0, `import _gopher_os "os"\n//line main.go:${targetIdx + 1}:1`);
    codeWithImport = lines.join('\n');
  }

  const initCode = `
var _gopher_stdin_ready = false
func init() {
\tif _gopher_stdin_ready { return }
\t_gopher_stdin_ready = true
\tr, w, err := _gopher_os.Pipe()
\tif err == nil {
\t\tw.WriteString(${escaped})
\t\tw.Close()
\t\t_gopher_os.Stdin = r
\t}
}
`;

  return codeWithImport + '\n' + initCode;
}

export async function runGoCode(code: string, stdin?: string): Promise<CompileResult> {
  const startTime = performance.now();
  const effectiveCode = prepareGoCodeWithStdin(code, stdin);

  try {
    // 1. Try local server proxy
    let response: Response;
    try {
      response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: effectiveCode, stdin }),
      });
    } catch {
      // 2. Direct fallback to official Go compiler API if backend unreachable
      const params = new URLSearchParams();
      params.append('version', '2');
      params.append('body', effectiveCode);

      response = await fetch('https://go.dev/_/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    }

    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        events: [],
        errors: `Erreur HTTP ${response.status}: ${errText}`,
        vetErrors: '',
        executionTimeMs: elapsed,
        stdinUsed: stdin && stdin.trim() ? stdin : undefined,
      };
    }

    const data = await response.json();
    return {
      success: !data.Errors && !data.errors,
      events: data.Events || data.events || [],
      errors: data.Errors || data.errors || '',
      vetErrors: data.VetErrors || data.vetErrors || '',
      executionTimeMs: elapsed,
      stdinUsed: stdin && stdin.trim() ? stdin : undefined,
    };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - startTime);
    const msg = err instanceof Error ? err.message : 'Erreur de connexion';
    return {
      success: false,
      events: [],
      errors: `Échec d'exécution du compilateur Go: ${msg}. Vérifiez votre connexion Internet.`,
      vetErrors: '',
      executionTimeMs: elapsed,
      stdinUsed: stdin && stdin.trim() ? stdin : undefined,
    };
  }
}

/**
 * Parses Go compiler error strings into structured line/column entries
 * Example Go error formats:
 * ./prog.go:8:2: undefined: fmt.Printlnn
 * prog.go:14: syntax error: unexpected newline
 * main.go:21:12: cannot use 42 (type int) as type string
 */
export function parseGoErrors(rawErrorString: string): ParsedError[] {
  if (!rawErrorString) return [];

  const lines = rawErrorString.split('\n');
  const results: ParsedError[] = [];

  const goErrorRegex = /(?:(?:\.\/)?[\w\-.]+\.go):(\d+)(?::(\d+))?:\s*(.*)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(goErrorRegex);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      const colNum = match[2] ? parseInt(match[2], 10) : undefined;
      const message = match[3] || trimmed;

      results.push({
        line: lineNum,
        column: colNum,
        message,
        raw: trimmed,
      });
    } else {
      results.push({
        message: trimmed,
        raw: trimmed,
      });
    }
  }

  return results;
}

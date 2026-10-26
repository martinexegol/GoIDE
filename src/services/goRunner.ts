import { CompileResult, ParsedError } from '../types';

export async function runGoCode(code: string): Promise<CompileResult> {
  const startTime = performance.now();

  try {
    // 1. Try local server proxy
    let response: Response;
    try {
      response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
    } catch {
      // 2. Direct fallback to official Go compiler API if backend unreachable
      const params = new URLSearchParams();
      params.append('version', '2');
      params.append('body', code);

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
      };
    }

    const data = await response.json();
    return {
      success: !data.Errors && !data.errors,
      events: data.Events || data.events || [],
      errors: data.Errors || data.errors || '',
      vetErrors: data.VetErrors || data.vetErrors || '',
      executionTimeMs: elapsed,
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

export async function formatGoCode(code: string): Promise<{ formatted: string; error?: string }> {
  try {
    let response: Response;
    try {
      response = await fetch('/api/fmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
    } catch {
      // Fallback directly to go.dev/_/fmt
      const params = new URLSearchParams();
      params.append('body', code);
      response = await fetch('https://go.dev/_/fmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    }

    if (!response.ok) {
      return { formatted: code, error: `Erreur ${response.status}` };
    }

    const data = await response.json();
    if (data.Error || data.error) {
      return { formatted: code, error: data.Error || data.error };
    }

    return { formatted: data.Body || data.body || code };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de formattage';
    return { formatted: code, error: msg };
  }
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '2mb' }));

  // API Route: Compile and run Go code using Go Compiler service
  app.post('/api/compile', async (req, res) => {
    try {
      const { code } = req.body;
      if (typeof code !== 'string') {
        res.status(400).json({ error: 'Code Go requis' });
        return;
      }

      // Call the official Go playground compiler endpoint (uses latest stable Go release)
      const params = new URLSearchParams();
      params.append('version', '2');
      params.append('body', code);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('https://go.dev/_/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'GopherPad-Go-IDE/1.0',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).json({
          error: `Erreur du serveur Go (${response.status}): ${text}`,
          events: [],
          compileError: text,
        });
        return;
      }

      const data = await response.json();
      res.json({
        success: true,
        events: data.Events || [],
        errors: data.Errors || '',
        vetErrors: data.VetErrors || '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      res.status(500).json({
        error: `Impossible de compiler le code: ${message}`,
        events: [],
        compileError: message,
      });
    }
  });

  // API Route: gofmt format Go code
  app.post('/api/fmt', async (req, res) => {
    try {
      const { code } = req.body;
      if (typeof code !== 'string') {
        res.status(400).json({ error: 'Code Go requis' });
        return;
      }

      const params = new URLSearchParams();
      params.append('body', code);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('https://go.dev/_/fmt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'GopherPad-Go-IDE/1.0',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        res.status(response.status).json({ error: 'Échec de gofmt' });
        return;
      }

      const data = await response.json();
      res.json({
        body: data.Body || code,
        error: data.Error || '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      res.status(500).json({ error: message, body: req.body?.code || '' });
    }
  });

  // Health / info endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', language: 'go', goVersion: 'Go 1.23+' });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GopherPad IDE Go dev server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

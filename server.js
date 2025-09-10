import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import fs from 'fs';
import submitUserDataHandler from './api/submit-user-data.js';
import uploadImageHandler from './api/upload-image.js';
import generateImageHandler from './api/generate-image.js';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists and serve it publicly at /uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
} catch (e) {
  console.warn('Could not create or serve uploads directory', e);
}

// Mount submit-user-data API at top level so frontend requests to /api/submit-user-data are handled
app.post('/api/submit-user-data', async (req, res) => submitUserDataHandler(req, res));
// Mount upload-image endpoint
app.post('/api/upload-image', async (req, res) => uploadImageHandler(req, res));





app.post('/api/generate-image', (req, res) => generateImageHandler(req, res));


// Test endpoint to ping configured n8n webhook from the server
app.post('/api/test-n8n', async (req, res) => {
  try {
    const configuredN8n = process.env.N8N_WEBHOOK_URL || 'https://nano-ms.app.n8n.cloud/webhook-test/sticker-app';
    const payload = req.body && Object.keys(req.body).length ? req.body : { test: 'ping', timestamp: new Date().toISOString() };
    console.log('Server test-n8n: calling', configuredN8n);
    const headers = { 'Content-Type': 'application/json' };
    const n8nAuth = process.env.N8N_WEBHOOK_AUTH || null;
    if (n8nAuth) headers['Authorization'] = String(n8nAuth);
    const resp = await fetch(configuredN8n, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await resp.text().catch(() => '');
    return res.status(200).json({ ok: resp.ok, status: resp.status, statusText: resp.statusText, body: text });
  } catch (e) {
    console.error('test-n8n error', e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// Image proxy to convert external image URLs to data URLs to avoid CORS when composing canvas
app.post('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'Missing url' });
    // Basic validation: only allow http/https
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Invalid url' });

    const resp = await fetch(url);
    if (!resp.ok) return res.status(502).json({ error: 'Failed to fetch target image', status: resp.status });
    const buf = await resp.arrayBuffer();
    const contentType = resp.headers.get('content-type') || 'image/png';
    const b64 = Buffer.from(buf).toString('base64');
    const dataUrl = `data:${contentType};base64,${b64}`;
    return res.json({ dataUrl });
  } catch (err) {
    console.error('Proxy image error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});


// Serve static built site if present, otherwise fall back to project index.html (development)
const distPath = path.join(process.cwd(), 'dist');
const distIndex = path.join(distPath, 'index.html');
const rootIndex = path.join(process.cwd(), 'index.html');

if (fs.existsSync(distIndex)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(distIndex));
} else if (fs.existsSync(rootIndex)) {
  // In dev mode serve the project index.html directly
  app.get('*', (req, res) => res.sendFile(rootIndex));
} else {
  // No index available
  app.get('*', (req, res) => res.status(404).send('Not Found'));
}

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Server listening on ${port}`));
// Disable automatic timeouts so long-running provider requests can complete
if (server && typeof server.setTimeout === 'function') {
  server.setTimeout(0); // 0 = no timeout
  console.log('Server timeout disabled to allow long-running provider requests');
}

// In development, spawn Vite dev server so API + front run together
if (process.env.NODE_ENV !== 'production' && process.env.SPAWN_VITE !== 'false') {
  try {
    const { spawn } = await import('child_process');
    const viteProcess = spawn('npm', ['run', 'dev:vite'], { shell: true, stdio: 'inherit' });
    viteProcess.on('error', (err) => console.warn('Failed to start Vite dev server:', err));
    viteProcess.on('exit', (code) => console.log('Vite dev server exited with code', code));
  } catch (e) {
    console.warn('Could not spawn Vite dev server:', e);
  }
}

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import fs from 'fs';

// Minimal static server: no API routes, no outbound fetches.
const app = express();

// Simple CORS handling so frontend running on different port can call API during dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

// Serve public/uploads if present
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
} catch (e) {
  console.warn('Could not create or serve uploads directory', e);
}

// Small API request logger for debugging
app.use('/api', (req, res, next) => {
  try { console.log('API request', req.method, req.originalUrl); } catch (e) {}
  next();
});

// Ping endpoint to verify API reachability
app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

// Mount generate-sticker endpoint (generates image via OpenAI)
try {
  const generateSticker = await import('./api/generate-sticker.js');
  app.post('/api/generate-sticker', express.json({ limit: '10mb' }), (req, res) => generateSticker.default(req, res));
} catch (e) {
  console.warn('generate-sticker API not available', e);
}

// Mount upload-composed endpoint (accepts composed dataURL, uploads to Supabase, triggers n8n)
try {
  const uploadComposed = await import('./api/upload-composed.js');
  app.post('/api/upload-composed', express.json({ limit: '50mb' }), (req, res) => uploadComposed.default(req, res));
} catch (e) {
  console.warn('upload-composed API not available', e);
}

// Mount send-to-n8n endpoint for manually posting payloads to n8n
try {
  const sendToN8n = await import('./api/send-to-n8n.js');
  app.post('/api/send-to-n8n', express.json({ limit: '1mb' }), (req, res) => sendToN8n.default(req, res));
} catch (e) {
  console.warn('send-to-n8n API not available', e);
}

const distPath = path.join(process.cwd(), 'dist');
const distIndex = path.join(distPath, 'index.html');
const rootIndex = path.join(process.cwd(), 'index.html');

if (fs.existsSync(distIndex)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(distIndex));
} else if (fs.existsSync(rootIndex)) {
  app.get('*', (req, res) => res.sendFile(rootIndex));
} else {
  app.get('*', (req, res) => res.status(404).send('Not Found'));
}

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Server listening on ${port}`));
if (server && typeof server.setTimeout === 'function') server.setTimeout(0);

// Start Vite in dev (same behavior as before)
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

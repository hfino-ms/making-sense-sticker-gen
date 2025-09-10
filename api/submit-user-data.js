import fs from 'fs';
import path from 'path';

// Simple, explicit endpoint to: 1) persist a sticker (data URL or URL) to Supabase (or local fallback)
// and 2) POST a clean payload to the configured n8n webhook and return its result.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, name, timestamp, sticker, archetype, survey = {}, photo = '' } = req.body || {};

    if (!email || !name) {
      return res.status(400).json({ error: 'Missing required fields: email and name' });
    }

    let stickerUrl = String(sticker || '');

    // If sticker is a data URL, try uploading to Supabase storage using service role key
    if (stickerUrl.startsWith('data:')) {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
      const bucket = process.env.SUPABASE_BUCKET || 'stickers';

      if (supabaseUrl && supabaseKey) {
        try {
          // build deterministic filename from sha256 to avoid duplicates
          const comma = stickerUrl.indexOf(',');
          const header = stickerUrl.slice(0, comma);
          const mimeMatch = header.match(/^data:(.+?)(;base64)?$/);
          const mime = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : 'image/png';
          const b64 = stickerUrl.slice(comma + 1);
          const buffer = Buffer.from(b64, 'base64');

          const crypto = await import('crypto');
          const hash = crypto.createHash('sha256').update(buffer).digest('hex');
          const ext = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png');
          const filename = `${hash}.${ext}`;

          const uploadEndpoint = `${String(supabaseUrl).replace(/\/$/, '')}/storage/v1/object/${bucket}/${filename}`;
          const uploadResp = await fetch(uploadEndpoint, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
              'Content-Type': mime
            },
            body: buffer
          });

          if (!uploadResp.ok) {
            const txt = await uploadResp.text().catch(() => '');
            throw new Error(`Supabase upload failed: ${uploadResp.status} ${txt}`);
          }

          stickerUrl = `${String(supabaseUrl).replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${filename}`;
        } catch (e) {
          console.error('Supabase upload failed and SUPABASE credentials are present:', String(e?.message || e));
          // If Supabase config is present but upload fails, abort so callers can surface the error and avoid sending non-public localhost URLs to n8n
          return res.status(500).json({ error: 'Supabase upload failed', detail: String(e?.message || e) });
        }
      }

      // Fallback: persist locally in /public/uploads (only when Supabase not configured)
      if (stickerUrl.startsWith('data:')) {
        try {
          const comma = stickerUrl.indexOf(',');
          const header = stickerUrl.slice(0, comma);
          const mimeMatch = header.match(/^data:(.+?)(;base64)?$/);
          const mime = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : 'image/png';
          const b64 = stickerUrl.slice(comma + 1);
          const buffer = Buffer.from(b64, 'base64');

          const crypto = await import('crypto');
          const hash = crypto.createHash('sha256').update(buffer).digest('hex');
          const ext = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png');
          const filename = `${hash}.${ext}`;

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          fs.mkdirSync(uploadsDir, { recursive: true });
          const savePath = path.join(uploadsDir, filename);
          fs.writeFileSync(savePath, buffer);

          const host = req.get('host');
          const protocol = req.protocol || 'https';
          stickerUrl = `${protocol}://${host}/uploads/${filename}`;
        } catch (e) {
          console.error('Failed to persist image to disk', e);
          return res.status(500).json({ error: 'Failed to upload sticker image' });
        }
      }
    }

    const payload = {
      email: String(email),
      name: String(name),
      timestamp: timestamp || new Date().toISOString(),
      sticker: stickerUrl,
      photo: String(photo || ''),
      archetype: archetype || null,
      survey: survey || {}
    };

    // If Supabase is configured, require the sticker URL to be hosted in the configured Supabase project public storage
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const allowLocalFallback = (process.env.USE_LOCAL_UPLOAD_FALLBACK === 'true') || (process.env.NODE_ENV !== 'production');
    if (supabaseUrl) {
      const normalized = String(supabaseUrl).replace(/\/$/, '');
      const isHostedOnSupabase = String(stickerUrl || '').startsWith(normalized);
      const isLocalhost = String(stickerUrl || '').startsWith('http://localhost') || String(stickerUrl || '').startsWith('https://localhost');
      if (!isHostedOnSupabase) {
        if (isLocalhost && allowLocalFallback) {
          // allow local uploads during development/test when fallback enabled
          console.warn('Using localhost sticker URL because local fallback is allowed');
        } else {
          return res.status(400).json({ error: 'When SUPABASE_URL is configured, sticker must be uploaded to Supabase public storage. Upload via /api/upload-image to persist to Supabase.' });
        }
      }
    }

    const webhook = process.env.N8N_WEBHOOK_URL || '';
    if (!webhook) return res.status(500).json({ error: 'N8N webhook not configured (N8N_WEBHOOK_URL)' });

    const headers = { 'Content-Type': 'application/json' };
    const n8nAuth = process.env.N8N_WEBHOOK_AUTH || '';
    if (n8nAuth) headers['Authorization'] = String(n8nAuth);

    // Post and return n8n response body and status
    const resp = await fetch(webhook, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await resp.text().catch(() => '');

    return res.status(200).json({ ok: resp.ok, status: resp.status, bodyText: text, payload });
  } catch (err) {
    console.error('submit-user-data error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

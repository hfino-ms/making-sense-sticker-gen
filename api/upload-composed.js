import fetch from 'node-fetch';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const { email, name, timestamp, agent, survey, photo, composedDataUrl, filename: providedFilename } = body;

    if (!email || !name || !agent || !agent.name) {
      return res.status(400).json({ error: 'Missing required fields: email, name, agent.name' });
    }

    if (!composedDataUrl) return res.status(400).json({ error: 'Missing composedDataUrl' });

    // Extract base64 from data URL
    const matches = String(composedDataUrl).match(/^data:(image\/(png|jpeg|jpg));base64,(.*)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid composedDataUrl format' });

    const contentType = matches[1];
    const b64 = matches[3];
    const buffer = Buffer.from(b64, 'base64');

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'stickers';

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('upload-composed: missing SUPABASE_URL or SUPABASE_KEY, envs present:', {
        hasUrl: Boolean(process.env.SUPABASE_URL),
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_KEY),
        hasKey: Boolean(process.env.SUPABASE_KEY),
        hasRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      });
      return res.status(500).json({ error: 'Server missing Supabase configuration (SUPABASE_URL and SUPABASE_SERVICE_KEY required)' });
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = contentType.includes('png') ? 'png' : (contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png');
    const filename = providedFilename || `sticker_${Date.now()}_${hash.slice(0,8)}.${ext}`;

    const { uploadBufferToSupabase } = await import('./services/supabaseService.js');
    const publicUrl = await uploadBufferToSupabase(SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET, buffer, contentType, filename);

    // Return only the uploaded image URL. The webhook payload will be composed and sent separately.
    return res.status(200).json({ ok: true, imageUrl: publicUrl });
  } catch (err) {
    console.error('upload-composed error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

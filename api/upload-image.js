import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { dataUrl } = req.body || {};
    if (!dataUrl || !String(dataUrl).startsWith('data:')) return res.status(400).json({ error: 'Missing or invalid dataUrl' });

    const commaIndex = String(dataUrl).indexOf(',');
    if (commaIndex === -1) return res.status(400).json({ error: 'Invalid dataUrl format' });

    const header = String(dataUrl).slice(0, commaIndex);
    const m = header.match(/^data:(.+?)(;base64)?$/);
    const mime = (m && m[1]) ? m[1] : 'image/png';
    const b64 = String(dataUrl).slice(commaIndex + 1);
    const buffer = Buffer.from(b64, 'base64');

    // build deterministic filename from sha256 of buffer so repeats overwrite same file
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    // preserve extension from mime if possible
    const ext = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png');
    const filename = `${hash}.${ext}`;

    const supabaseUrl = process.env.SUPABASE_URL || null;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || null;
    const bucket = process.env.SUPABASE_BUCKET || 'stickers';

    const allowLocalFallback = (process.env.USE_LOCAL_UPLOAD_FALLBACK === 'true') || (process.env.NODE_ENV !== 'production');

    if (supabaseUrl && supabaseKey) {
      try {
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
        if (uploadResp.ok) {
          const publicUrl = `${String(supabaseUrl).replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${filename}`;
          return res.status(200).json({ url: publicUrl });
        } else {
          const txt = await uploadResp.text().catch(() => '');
          const detail = `Supabase upload failed: ${uploadResp.status} ${txt}`;
          console.error(detail);
          if (!allowLocalFallback) {
            return res.status(502).json({ error: 'Supabase upload failed', detail });
          }
          console.warn('Falling back to local disk because USE_LOCAL_UPLOAD_FALLBACK is enabled or not in production');
        }
      } catch (e) {
        console.error('Supabase upload error', e);
        if (!allowLocalFallback) {
          return res.status(502).json({ error: 'Supabase upload error', detail: String(e?.message || e) });
        }
        console.warn('Falling back to local disk because USE_LOCAL_UPLOAD_FALLBACK is enabled or not in production');
      }
    }

    // Fallback to local disk (deterministic filename)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });
      const savePath = path.join(uploadsDir, filename);
      fs.writeFileSync(savePath, buffer);
      const host = req.get('host');
      const protocol = req.protocol || 'https';
      const publicUrl = `${protocol}://${host}/uploads/${filename}`;
      return res.status(200).json({ url: publicUrl });
    } catch (e) {
      console.error('Failed to persist image to disk', e);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  } catch (err) {
    console.error('upload-image error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

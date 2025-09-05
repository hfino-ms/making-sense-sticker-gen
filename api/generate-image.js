import fetch from 'node-fetch';
import FormData from 'form-data';

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.VITE_API_KEY_IMAGE_GENERATION;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI key' });
    const { prompt, selfieDataUrl } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    let resp;

    try {
      if (selfieDataUrl) {
        // Use Images Edits endpoint and send multipart/form-data with the selfie
        const match = selfieDataUrl.match(/^data:(.*);base64,(.*)$/);
        if (!match) return res.status(400).json({ error: 'Invalid selfie data URL' });
        const mime = match[1];
        const b64 = match[2];
        const buffer = Buffer.from(b64, 'base64');

        const form = new FormData();
        form.append('image', buffer, { filename: 'selfie.png', contentType: mime });
        form.append('prompt', prompt);
        form.append('size', '1024x1024');
        form.append('n', '1');

        resp = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            ...form.getHeaders(),
          },
          body: form,
        });
      } else {
        resp = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024', n: 1 }),
        });
      }
    } catch (fetchErr) {
      console.error('Error calling OpenAI Images API', fetchErr);
      return res.status(502).json({ error: String(fetchErr?.message || fetchErr) });
    }

    try {
      const respText = await resp.text();
      try { console.log('OpenAI response status:', resp.status); console.log('OpenAI response body (truncated 2000 chars):', respText.slice ? respText.slice(0,2000) : respText); } catch(e){}
      let parsed = null;
      try { parsed = JSON.parse(respText); } catch (e) { parsed = null; }
      return res.status(resp.status).json({ status: resp.status, ok: resp.ok, bodyText: respText, bodyJson: parsed });
    } catch (readErr) {
      return res.status(500).json({ error: String(readErr?.message || readErr) });
    }
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

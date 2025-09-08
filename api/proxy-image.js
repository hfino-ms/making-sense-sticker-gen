export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'Missing url' });
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
}

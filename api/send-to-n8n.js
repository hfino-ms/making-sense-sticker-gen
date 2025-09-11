export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const { email, name, timestamp, sticker, photo, archetype, survey } = body;

    if (!email || !name || !sticker) {
      return res.status(400).json({ error: 'Missing required fields: email, name, sticker' });
    }

    const { getN8nWebhook } = await import('./services/configService.js');
    const { url: N8N_WEBHOOK, auth: N8N_AUTH } = getN8nWebhook();
    if (!N8N_WEBHOOK) return res.status(500).json({ error: 'Server missing N8N_WEBHOOK_URL' });

    const payload = {
      email: String(email || ''),
      name: String(name || ''),
      timestamp: String(timestamp || new Date().toISOString()),
      sticker: String(sticker || ''),
      photo: String(photo || ''),
      archetype: archetype || null,
      survey: survey || {}
    };

    const headers = { 'Content-Type': 'application/json' };
    if (N8N_AUTH) headers['Authorization'] = String(N8N_AUTH);

    // Use global fetch if available (test env), otherwise dynamically import node-fetch
    let fetcher = typeof fetch === 'function' ? fetch : null;
    if (!fetcher) {
      const nf = await import('node-fetch');
      fetcher = nf.default || nf;
    }

    const resp = await fetcher(N8N_WEBHOOK, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await (resp && resp.text ? resp.text() : Promise.resolve(''));
    let bodyResp;
    try { bodyResp = JSON.parse(text); } catch (e) { bodyResp = text; }

    return res.status(200).json({ ok: Boolean(resp && resp.ok), status: (resp && resp.status) || 200, body: bodyResp });
  } catch (err) {
    console.error('send-to-n8n error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

import OpenAI, { toFile } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Only accept generation requests from the UI to avoid accidental CLI usage and credit consumption
  // Client must include header: 'x-source': 'ui'
  if ((req.headers['x-source'] || req.headers['x-source'] === '') && String(req.headers['x-source']) !== 'ui') {
    return res.status(403).json({ error: 'Image generation only allowed from UI' });
  }

  const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY || process.env.VITE_API_KEY_IMAGE_GENERATION || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.VERCEL_OPENAI_API_KEY || process.env.OPENAI_API_KEY_SERVER || null;
  if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI key' });

  const openai = new OpenAI({ apiKey: OPENAI_KEY });

  try {
    const { prompt, selfieDataUrl, photoStep } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    let result;
    const skipped = (typeof photoStep === 'string' && photoStep === 'skipped') || !selfieDataUrl;

    if (!skipped && selfieDataUrl) {
      // Use real image with OpenAI images.edit via REST
      const match = selfieDataUrl.match(/^data:(.*);base64,(.*)$/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid selfie data URL format' });
      }
      const mimeType = match[1];
      const base64Data = match[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const imageFile = await toFile(imageBuffer, 'selfie.png', { type: mimeType || 'image/png' });
      const editResult = await openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: prompt,
        size: '1024x1024',
        n: 1,
      });
      result = editResult;
    } else {
      const genResult = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        n: 1,
      });
      result = genResult;
    }

    // Extract base64 image if present
    const b64 = result?.data?.[0]?.b64_json || result?.data?.[0]?.b64 || result?.data?.[0]?.base64 || null;
    const remoteUrl = result?.data?.[0]?.url || result?.data?.[0]?.image_url || null;

    let imageDataUrl = null;
    try {
      if (b64) {
        imageDataUrl = `data:image/png;base64,${b64}`;
      } else if (remoteUrl) {
        try {
          const p = await fetch(remoteUrl);
          if (p.ok) {
            const arr = await p.arrayBuffer();
            const buf = Buffer.from(arr);
            const contentType = p.headers.get('content-type') || 'image/png';
            imageDataUrl = `data:${contentType};base64,${buf.toString('base64')}`;
          }
        } catch (e) {
          // fallback: leave imageDataUrl null
        }
      }
    } catch (e) {
      // ignore
    }

    return res.status(200).json({ status: 200, ok: true, imageDataUrl: imageDataUrl, bodyJson: result });
  } catch (openaiErr) {
    console.error('OpenAI API error:', openaiErr);
    return res.status(502).json({ status: openaiErr.status || 500, ok: false, bodyText: String(openaiErr?.message || openaiErr), bodyJson: null, error: String(openaiErr?.message || openaiErr) });
  }
}

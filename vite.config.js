import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev middleware proxy for OpenAI image generation (no selfie edit support in this simple proxy)
export default defineConfig({
  plugins: [react()],
  configureServer(server) {
    server.middlewares.use('/api/generate-image', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      try {
        let body = '';
        for await (const chunk of req) body += chunk;
        const data = JSON.parse(body || '{}');
        const prompt = data.prompt;
        // const selfieDataUrl = data.selfieDataUrl; // not used here
        const OPENAI_KEY = process.env.VITE_API_KEY_IMAGE_GENERATION || process.env.OPENAI_API_KEY;
        if (!OPENAI_KEY) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'No server OpenAI key configured' }));
          return;
        }

        // Use OpenAI Images generation endpoint
        const genRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024', n: 1 }),
        });
        const json = await genRes.json();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(json));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err?.message || err) }));
      }
    });
  },
})

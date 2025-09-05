import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/generate-image': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  configureServer(server) {
    // Simple test endpoint first
    server.middlewares.use('/api/test', (req, res) => {
      console.log('📡 Test endpoint hit!');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Test endpoint working!' }));
    });

    server.middlewares.use('/api/generate-image', async (req, res) => {
      console.log('🚀 Generate image endpoint hit!', req.method);
      
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      try {
        // Read body
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            console.log('📝 Raw body received:', body.substring(0, 200));
            
            const data = JSON.parse(body || '{}');
            const { prompt, selfieDataUrl } = data;
            
            console.log('📝 Parsed prompt:', prompt?.substring(0, 100));
            console.log('📸 Has selfie:', !!selfieDataUrl);
            
            const OPENAI_KEY = process.env.VITE_API_KEY_IMAGE_GENERATION || process.env.OPENAI_API_KEY;
            console.log('🔑 Has key:', !!OPENAI_KEY);
            console.log('🔑 Key start:', OPENAI_KEY?.substring(0, 10));
            
            if (!OPENAI_KEY) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                status: 500,
                ok: false,
                bodyText: 'No OpenAI key configured',
                bodyJson: null
              }));
              return;
            }

            if (!prompt) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                status: 400,
                ok: false,
                bodyText: 'Missing prompt',
                bodyJson: null
              }));
              return;
            }

            console.log('🚀 Calling OpenAI...');
            
            // Call OpenAI
            const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'dall-e-2',
                prompt: prompt,
                size: '1024x1024',
                n: 1,
                response_format: 'b64_json'
              }),
            });

            console.log('🚀 OpenAI status:', openaiResponse.status);
            
            const responseText = await openaiResponse.text();
            console.log('🚀 OpenAI response (first 500 chars):', responseText.substring(0, 500));
            
            let responseJson = null;
            try {
              responseJson = JSON.parse(responseText);
            } catch (parseErr) {
              console.error('❌ Failed to parse OpenAI response:', parseErr);
            }

            // Return envelope format
            const envelope = {
              status: openaiResponse.status,
              ok: openaiResponse.ok,
              bodyText: responseText,
              bodyJson: responseJson,
            };

            console.log('✅ Returning envelope:', { status: envelope.status, ok: envelope.ok });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(envelope));
            
          } catch (innerErr) {
            console.error('❌ Error processing request:', innerErr);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              status: 500,
              ok: false,
              bodyText: String(innerErr?.message || innerErr),
              bodyJson: null
            }));
          }
        });
        
      } catch (err) {
        console.error('❌ Outer error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          status: 500,
          ok: false,
          bodyText: String(err?.message || err),
          bodyJson: null
        }));
      }
    });
  },
})

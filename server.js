import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import OpenAI, { toFile } from 'openai';

const app = express();
app.use(express.json({ limit: '10mb' }));

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.VITE_API_KEY_IMAGE_GENERATION;
const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

// Email transporter configuration expects SMTP_* env vars
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'no-reply@example.com';

app.post('/api/generate-image', async (req, res) => {
  try {
    console.log('🔑 OPENAI_KEY present:', !!OPENAI_KEY);
    console.log('🔑 OPENAI_KEY first 10 chars:', OPENAI_KEY?.substring(0, 10));
    
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI key' });
    
    const { prompt, selfieDataUrl } = req.body || {};
    console.log('📝 Prompt received:', prompt?.substring(0, 100) + '...');
    console.log('📸 Selfie provided:', !!selfieDataUrl);
    
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    try {
      let result;
      
      if (selfieDataUrl) {
        // Use real image with images.edit()
        console.log('🚀 Using real image with OpenAI images.edit()...');
        
        // Convert data URL to buffer
        const match = selfieDataUrl.match(/^data:(.*);base64,(.*)$/);
        if (!match) {
          return res.status(400).json({ error: 'Invalid selfie data URL format' });
        }
        
        const mimeType = match[1];
        const base64Data = match[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        console.log('📷 Image buffer size:', imageBuffer.length, 'bytes');
        console.log('📷 Image MIME type:', mimeType);
        
        // Convert buffer to File using toFile
        const imageFile = await toFile(imageBuffer, 'selfie.jpg', {
          type: mimeType || 'image/jpeg'
        });
        
        console.log('📁 Created file object for OpenAI');
        
        // Create enhanced prompt for personalization
        const personalizedPrompt = `${prompt}. Transform this into a circular sticker design incorporating the person's appearance and features from the reference image. Make it creative and stylized while maintaining the person's recognizable characteristics.`;
        
        result = await openai.images.edit({
          model: "gpt-image-1",
          image: imageFile,
          prompt: personalizedPrompt,
          size: "1024x1024",
          n: 1
        });
        
        console.log('✅ OpenAI images.edit() success with real photo!');
        
      } else {
        // Use regular generation for no photo
        console.log('🚀 Using regular image generation...');
        
        result = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt,
          size: "1024x1024",
          n: 1
        });
        
        console.log('✅ OpenAI images.generate() success!');
      }
      
      console.log('📊 Result structure keys:', Object.keys(result));
      console.log('📊 Result data length:', result.data?.length);
      console.log('📊 Has b64_json:', !!result.data?.[0]?.b64_json);
      console.log('📊 Has url:', !!result.data?.[0]?.url);
      
      // Return envelope format for compatibility
      return res.status(200).json({
        status: 200,
        ok: true,
        bodyText: JSON.stringify(result),
        bodyJson: result,
      });
      
    } catch (openaiErr) {
      console.error('❌ OpenAI API error:', openaiErr);
      console.error('❌ Error details:', {
        message: openaiErr.message,
        status: openaiErr.status,
        code: openaiErr.code,
        type: openaiErr.type
      });
      
      return res.status(502).json({ 
        status: openaiErr.status || 500,
        ok: false,
        bodyText: String(openaiErr?.message || openaiErr),
        bodyJson: null,
        error: String(openaiErr?.message || openaiErr) 
      });
    }
  } catch (err) {
    console.error('❌ General error:', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// Email send endpoint: expects { to, subject, text, imageUrl }
app.post('/api/send-sticker-email', async (req, res) => {
  try {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return res.status(500).json({ error: 'SMTP credentials not configured on server.' });
    }

    const { to, subject, text, imageUrl } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'Missing to or subject' });

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // Retrieve image as buffer
    let attachment;
    if (imageUrl && imageUrl.startsWith('data:')) {
      // Data URL
      const match = imageUrl.match(/^data:(.*);base64,(.*)$/);
      if (match) {
        const mime = match[1];
        const data = Buffer.from(match[2], 'base64');
        attachment = { filename: 'sticker.png', content: data, contentType: mime };
      }
    } else if (imageUrl) {
      const resp = await fetch(imageUrl);
      const buf = await resp.arrayBuffer();
      const contentType = resp.headers.get('content-type') || 'image/png';
      attachment = { filename: 'sticker.png', content: Buffer.from(buf), contentType };
    }

    const mailOpts = {
      from: FROM_EMAIL,
      to,
      subject,
      text: text || '',
      attachments: attachment ? [attachment] : undefined,
    };

    await transporter.sendMail(mailOpts);
    return res.json({ success: true });
  } catch (err) {
    console.error('send email error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// Serve static built site
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Server listening on ${port}`));
// Disable automatic timeouts so long-running provider requests can complete
if (server && typeof server.setTimeout === 'function') {
  server.setTimeout(0); // 0 = no timeout
  console.log('Server timeout disabled to allow long-running provider requests');
}

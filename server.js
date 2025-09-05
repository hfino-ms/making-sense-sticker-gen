import express from 'express';
import path from 'path';

const app = express();
app.use(express.json({ limit: '10mb' }));

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.VITE_API_KEY_IMAGE_GENERATION;
import nodemailer from 'nodemailer';

// Email transporter configuration expects SMTP_* env vars
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'no-reply@example.com';

app.post('/api/generate-image', async (req, res) => {
  try {
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI key' });
    const { prompt, selfieDataUrl } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    let resp;
    try {
      if (selfieDataUrl) {
        // Use Images Edits endpoint and send multipart/form-data with the selfie
        const FormData = (await import('form-data')).default;
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
        // Simple generation (no selfie edits) using OpenAI Images Generations
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

    // Read response text once and return a structured JSON envelope so clients can always parse it
    try {
      const respText = await resp.text();
      // log full response for debugging (trim if very long)
      try {
        console.log('OpenAI response status:', resp.status);
        console.log('OpenAI response body (truncated 2000 chars):', respText.slice ? respText.slice(0, 2000) : respText);
      } catch (logErr) {
        console.error('Failed to log OpenAI response', logErr);
      }
      let parsed = null;
      try {
        parsed = JSON.parse(respText);
      } catch (_e) {
        parsed = null;
      }
      return res.status(resp.status).json({
        status: resp.status,
        ok: resp.ok,
        bodyText: respText,
        bodyJson: parsed,
      });
    } catch (readErr) {
      return res.status(500).json({ error: String(readErr?.message || readErr) });
    }
  } catch (err) {
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

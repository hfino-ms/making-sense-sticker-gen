import fs from 'fs';
import os from 'os';
import path from 'path';
import OpenAI, { toFile } from 'openai';

export async function generateImageFromPrompt(prompt, openaiKey, photoDataUrl = null) {
  if (!openaiKey) throw new Error('Missing OPENAI key');
  const client = new OpenAI({ apiKey: openaiKey });

  // If a photo (data URL) is provided, write it to a temp file and use images.edit with image reference
  if (photoDataUrl) {
    const m = String(photoDataUrl).match(/^data:(image\/(png|jpeg|jpg));base64,(.*)$/);
    if (!m) throw new Error('Invalid photo data URL');
    const contentType = m[1];
    const b64 = m[3];
    const buffer = Buffer.from(b64, 'base64');

    // create temp file
    const tmpDir = os.tmpdir();
    const tmpName = `selfie-${Date.now()}-${Math.round(Math.random()*1e6)}.png`;
    const tmpPath = path.join(tmpDir, tmpName);
    try {
      fs.writeFileSync(tmpPath, buffer);
      console.log('openaiService: wrote temp selfie to', tmpPath, 'size', buffer.length);

      // Convert to file reference using SDK helper
      const fileRef = await toFile(fs.createReadStream(tmpPath), null, { type: contentType });
      console.log('openaiService: created fileRef, calling images.edit with model gpt-image-1');

      // Call images.edit with the reference image
      const resp = await client.images.edit({
        model: 'gpt-image-1',
        image: [fileRef],
        prompt,
        n: 1,
        size: '1024x1024',
      });

      console.log('openaiService: images.edit response status, keys:', Object.keys(resp || {}).slice(0,10));
      const b64json = resp?.data?.[0]?.b64_json || null;
      const url = resp?.data?.[0]?.url || null;
      return { b64: b64json, url, raw: resp };
    } finally {
      // cleanup temp file
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
  }

  // Otherwise generate from prompt only
  const resp = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
  });

  const b64 = resp?.data?.[0]?.b64_json || null;
  const url = resp?.data?.[0]?.url || null;
  return { b64, url, raw: resp };
}

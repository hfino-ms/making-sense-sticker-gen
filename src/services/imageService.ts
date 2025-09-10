import { buildPrompt as buildPromptUtil } from '../utils/prompt';
import type { Archetype, GenerationResult } from '../types';

async function b64ToObjectUrl(b64: string, mime = 'image/png') {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

// Try requesting generation from server-side endpoint first (more reliable)
async function generateViaServer(prompt: string, selfieDataUrl?: string): Promise<string> {
  try {
    const resp = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'ui'
      },
      body: JSON.stringify({ prompt, selfieDataUrl }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(json?.error || json?.bodyText || 'Server generation failed');
    }

    // Server may return a resized data URL directly in imageDataUrl for performance
    if (json?.imageDataUrl) return json.imageDataUrl;

    const bodyJson = json?.bodyJson || json;

    // Helper to find image data in multiple possible shapes
    const findImageInObj = (obj: any): { type: 'b64' | 'url'; value: string } | null => {
      if (!obj || typeof obj !== 'object') return null;
      // If array with data/artifacts/images
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const found = findImageInObj(item);
          if (found) return found;
        }
      }
      // common locations
      const candidates: any[] = [
        obj.data?.[0],
        obj.images?.[0],
        obj.output?.[0],
        obj.artifacts?.[0],
        obj?.result?.[0],
        obj?.[0],
        obj,
      ];
      for (const c of candidates) {
        if (!c) continue;
        // base64 fields
        const b64 = (c as any).b64_json || (c as any).b64 || (c as any).base64 || (c as any).b64Image || (c as any).b64_image;
        if (b64 && typeof b64 === 'string') return { type: 'b64', value: b64 };
        // url-like fields
        const url = (c as any).url || (c as any).image_url || (c as any).src || (c as any).uri || (c as any).href || (c as any).link;
        if (url && typeof url === 'string') return { type: 'url', value: url };
        // sometimes the whole field is a string data:image... or a url
        if (typeof c === 'string') {
          if (c.startsWith('data:') || c.match(/^data:/)) return { type: 'b64', value: c };
          if (c.startsWith('http')) return { type: 'url', value: c };
        }
      }
      // traverse deeper
      for (const key of Object.keys(obj)) {
        try {
          const found = findImageInObj((obj as any)[key]);
          if (found) return found;
        } catch (e) {
          continue;
        }
      }
      return null;
    };

    const found: { type: 'b64' | 'url'; value: string } | null = findImageInObj(bodyJson);
    if (found) {
      if (found.type === 'b64') {
        // if it's already a full data URL
        if (found.value.startsWith('data:')) return found.value;
        // otherwise return a data URL to avoid object URL/CORS issues when drawing into canvas
        return `data:image/png;base64,${found.value}`;
      }
      if (found.type === 'url') {
        // If server returned an external URL, proxy it through our backend to avoid CORS when compositing on canvas
        try {
          const p = await fetch('/api/proxy-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: found.value }),
          });
          if (p.ok) {
            const pj = await p.json();
            if (pj?.dataUrl) return pj.dataUrl;
          }
        } catch (e) {
          // ignore and fallback to returning original url
        }
        return found.value;
      }
    }

    // fallback: attempt to stringify response for easier debugging
    throw new Error('Server returned no image data. Response: ' + JSON.stringify(bodyJson).substring(0, 1000));
  } catch (err: any) {
    throw new Error(`Server generation failed: ${err?.message || String(err)}`);
  }
}

// Call OpenAI REST API directly from the client (no backend). Expects VITE_OPENAI_API_KEY to be set.
export async function generateViaOpenAI(prompt: string, selfieDataUrl?: string, photoStep?: string): Promise<string> {
  const key = (import.meta.env.VITE_OPENAI_API_KEY as string) || '';
  if (!key) throw new Error('No OpenAI key available in client environment (VITE_OPENAI_API_KEY).');

  // If selfie provided (or photoStep indicates sent), use image edits with gpt-image-1
  const useEdit = Boolean(selfieDataUrl) && photoStep !== 'skipped';

  if (useEdit && selfieDataUrl) {
    // prepare personalized prompt
    const personalizedPrompt = `${prompt}. Transform this into a square, full-bleed 1:1 sticker design (sized for 2x2 inches). Do NOT include rounded corners or any circular masking — produce a full-bleed square image that fills the canvas, with no text and no external borders. Keep the person's recognizable features integrated respectfully.`;

    const blob = await dataUrlToBlob(selfieDataUrl);
    const fd = new FormData();
    // The images edit endpoint expects one or more files under the key 'image[]' in some implementations.
    // We'll append as 'image' which the OpenAI images/edits endpoint also accepts.
    // Use image[] key for edits and set necessary params
    fd.append('image', blob, 'selfie.png');
    fd.append('model', 'gpt-image-1');
    fd.append('prompt', personalizedPrompt);
    fd.append('size', '1024x1024');
    fd.append('n', '1');

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        // Note: DO NOT set Content-Type header when sending FormData in browser
      },
      body: fd,
    });

    const text = await resp.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse OpenAI images.edit response: ${String(e)} — ${text.substring(0, 300)}`);
    }

    if (!resp.ok) {
      const errMsg = json?.error?.message || JSON.stringify(json);
      throw new Error(`OpenAI images.edit error: ${errMsg}`);
    }

    const b64 = json?.data?.[0]?.b64_json;
    const url = json?.data?.[0]?.url;
    if (b64) return await b64ToObjectUrl(b64);
    if (url) return url;

    throw new Error(`OpenAI images.edit returned no image data. Response: ${JSON.stringify(json)}`);
  }

  // Otherwise generate from text using gpt-image-1
  const payload = {
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024',
    n: 1,
  };

  const genResp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const genText = await genResp.text();
  let genJson: any = null;
  try {
    genJson = JSON.parse(genText);
  } catch (e) {
    throw new Error(`Failed to parse OpenAI images.generate response: ${String(e)} — ${genText.substring(0, 300)}`);
  }

  if (!genResp.ok) {
    const errMsg = genJson?.error?.message || JSON.stringify(genJson);
    throw new Error(`OpenAI images.generate error: ${errMsg}`);
  }

  const b64 = genJson?.data?.[0]?.b64_json;
  const url = genJson?.data?.[0]?.url;
  if (b64) return await b64ToObjectUrl(b64);
  if (url) return url;

  throw new Error(`OpenAI images.generate returned no image data. Response: ${JSON.stringify(genJson)}`);
}

// Generate sticker - accepts optional promptOverride from the LLM
export async function generateSticker(archetype: Archetype, selfieDataUrl?: string, promptOverride?: string, photoStepParam?: string): Promise<GenerationResult> {
  const includeSelfie = Boolean(selfieDataUrl);
  const prompt = promptOverride ?? buildPromptUtil(archetype, includeSelfie);
  const photoStep = photoStepParam ?? (selfieDataUrl ? 'sent' : 'skipped');
  // reference photoStep to avoid unused variable TypeScript error (may be used for logging or future features)
  void photoStep;
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (online) {
    // Prefer server-side generation to avoid client-side CORS and exposing keys.
    try {
      const url = await generateViaServer(prompt, selfieDataUrl);
      // Mark as 'openai' source to satisfy GenerationResult type (server proxies OpenAI)
      return { imageUrl: url, archetype, prompt, source: 'openai' };
    } catch (serverErr: any) {
      // Do NOT attempt client-side OpenAI from the browser (would require exposing keys).
      // Instead, return a graceful fallback image and include providerError so the UI can show details.
      const errMsg = serverErr?.message || String(serverErr);
      const dataUrl = svgDataUrl(archetype, selfieDataUrl);
      return { imageUrl: dataUrl, archetype, prompt, source: 'fallback', providerError: errMsg };
    }
  }

  const dataUrl = svgDataUrl(archetype, selfieDataUrl);
  return { imageUrl: dataUrl, archetype, prompt, source: 'fallback' };
}

// Fallback: return a provided static image asset instead of SVG
function svgDataUrl(archetype: Archetype, selfieDataUrl?: string) {
  // Reference params to avoid unused-variable TS errors
  void archetype;
  void selfieDataUrl;
  // Use the designer-provided rectangle image as a friendly fallback
  return 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F8c6851ed424248ef976a48b883ae9729?format=webp&width=800';
}

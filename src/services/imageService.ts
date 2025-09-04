import { svgDataUrl } from '../utils/canvas';
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

async function generateViaProxy(prompt: string, selfieDataUrl?: string): Promise<string> {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, selfieDataUrl }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Proxy image generation error ${res.status} ${text}`);
  }
  let json: any;
  try { json = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON from proxy'); }
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error('Proxy returned no image data');
  return await b64ToObjectUrl(b64);
}

// Generate sticker - accepts optional promptOverride from the LLM
export async function generateSticker(archetype: Archetype, selfieDataUrl?: string, promptOverride?: string): Promise<GenerationResult> {
  const includeSelfie = Boolean(selfieDataUrl);
  const prompt = promptOverride ?? buildPromptUtil(archetype, includeSelfie);
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (online) {
    try {
      const url = await generateViaProxy(prompt, selfieDataUrl);
      return { imageUrl: url, archetype, prompt, source: 'openai' };
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      const dataUrl = svgDataUrl(archetype, selfieDataUrl);
      return { imageUrl: dataUrl, archetype, prompt, source: 'fallback', providerError: errMsg };
    }
  }

  const dataUrl = svgDataUrl(archetype, selfieDataUrl);
  return { imageUrl: dataUrl, archetype, prompt, source: 'fallback' };
}

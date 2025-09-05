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

  // Server returns a JSON envelope with { status, ok, bodyText, bodyJson }
  let envelope: any = null;
  try {
    envelope = await res.json();
  } catch (e: any) {
    // If response body was already read for some reason, try a fresh retry to the proxy once
    const msg = String(e);
    if (msg.includes('body already read') || msg.includes('Failed to execute \"json\" on \'Response\'')) {
      // retry once
      try {
        const retryRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, selfieDataUrl }),
          cache: 'no-store',
        });
        envelope = await retryRes.json();
      } catch (retryErr) {
        throw new Error(`Failed to parse proxy JSON response after retry: ${String(retryErr)}`);
      }
    } else {
      throw new Error(`Failed to parse proxy JSON response: ${String(e)}`);
    }
  }

  if (!envelope.ok) {
    // include status and bodyText for debugging
    throw new Error(`Proxy image generation error ${String(envelope.status)} ${String(envelope.bodyText ?? '')}`);
  }

  const json = envelope.bodyJson ?? null;
  const text = envelope.bodyText ?? null;

  // Check for base64 format first
  const b64 = json?.data?.[0]?.b64_json;
  if (b64) {
    console.log('🖼️ Got base64 image data');
    return await b64ToObjectUrl(b64);
  }

  // Check for URL format
  const url = json?.data?.[0]?.url;
  if (url) {
    console.log('🖼️ Got URL image data:', url);
    return url;
  }

  console.error('❌ No image data found. JSON structure:', json);
  throw new Error(`Proxy returned no image data. Response: ${String(text ?? '')}`);
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

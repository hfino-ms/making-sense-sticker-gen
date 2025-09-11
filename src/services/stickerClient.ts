import { composeStickerFromSource } from '../utils/composeSticker';

type Gen = { b64?: string | null; url?: string | null; raw?: any };

async function fetchJson(path: string, body: any) {
  // Decide backend origin: in dev the express server runs on port 3000
  let url = path;
  try {
    if (typeof window !== 'undefined') {
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocal) {
        const port = 3000;
        url = `${window.location.protocol}//${window.location.hostname}:${port}${path}`;
      }
    }
  } catch (e) {}

  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(json?.error || json || resp.statusText || 'Request failed');
  return json;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
}

export async function generateStickerAndCompose({ agent, survey, variant, photo }: { agent: any; survey: Record<string, string>; variant?: string; photo?: string }) {
  const payload = { agent, survey, variant, photo };
  const json = await fetchJson('/api/generate-sticker', payload);
  const gen: Gen = json?.gen || {};

  let source: string | null = null;
  if (gen.b64) source = `data:image/png;base64,${gen.b64}`;
  else if (gen.url) source = String(gen.url);

  // Try composing using the given source. If the image is remote and CORS blocks it, attempt to fetch and convert to dataURL.
  let composedDataUrl: string | null = null;
  if (source) {
    try {
      composedDataUrl = await composeStickerFromSource(source);
    } catch (e) {
      console.warn('composeStickerFromSource failed on initial source, attempting to fetch and convert to data URL', e);
    }
  }

  if (!composedDataUrl && gen.url) {
    try {
      const resp = await fetch(gen.url);
      if (resp.ok) {
        const blob = await resp.blob();
        const dataUrl = await blobToDataUrl(blob);
        composedDataUrl = await composeStickerFromSource(dataUrl);
        source = dataUrl;
      }
    } catch (e) {
      console.warn('Failed to fetch remote image for composition', e);
    }
  }

  return { gen, source, composedDataUrl };
}

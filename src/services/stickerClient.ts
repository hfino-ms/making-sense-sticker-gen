import { composeStickerFromSource } from '../utils/composeSticker';
import { composeStickerWithHtmlLabel } from '../utils/htmlToCanvas';

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
      // Try new HTML-based approach first
      if (agent?.name || agent?.key) {
        // Map agent key to a specific frame overlay URL so each archetype gets its own frame
        const FRAME_MAP: Record<string, string> = {
          integrator: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2F36ddb163aecf4607ae7f3136c6d2a7fa?format=png&width=2000',
          deal_hunter: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2F530b9323aa6f426cb1543cc036aab13b?format=png&width=2000',
          transformer: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2Ff1890e2416d841a1bd81a075bb8f5d49?format=png&width=2000',
          risk_balancer: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2Fe8b17a6f965d4303a193561747e24489?format=png&width=2000',
          visionary: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2F1e486f47baf14c56a0655d049071b8f9?format=png&width=2000'
        };
        const defaultFrame = 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000';
        const frameUrl = FRAME_MAP[String(agent.key).toLowerCase()] || defaultFrame;

        composedDataUrl = await composeStickerWithHtmlLabel(source, agent.name || agent.key, {
          stickerSize: 1024,
          frameUrl,
          drawFrame: true
        });
      } else {
        // Fallback to canvas approach
        composedDataUrl = await composeStickerFromSource(source, undefined, 1024, { agentLabel: null, drawFrame: true });
      }
    } catch (e) {
      console.warn('HTML composition failed, attempting canvas fallback', e);
      try {
        composedDataUrl = await composeStickerFromSource(source, undefined, 1024, { agentLabel: agent?.name || agent?.key || null, drawFrame: true });
      } catch (e2) {
        console.warn('Canvas fallback also failed, attempting to fetch and convert to data URL', e2);
      }
    }
  }

  if (!composedDataUrl && gen.url) {
    try {
      const resp = await fetch(gen.url);
      if (resp.ok) {
        const blob = await resp.blob();
        const dataUrl = await blobToDataUrl(blob);
        try {
          // Try HTML approach first
          if (agent?.name || agent?.key) {
            const FRAME_MAP: Record<string, string> = {
              integrator: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2F36ddb163aecf4607ae7f3136c6d2a7fa?format=png&width=2000',
              deal_hunter: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2F530b9323aa6f426cb1543cc036aab13b?format=png&width=2000',
              transformer: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2Ff1890e2416d841a1bd81a075bb8f5d49?format=png&width=2000',
              risk_balancer: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2Fe8b17a6f965d4303a193561747e24489?format=png&width=2000',
              visionary: 'https://cdn.builder.io/api/v1/image/assets%2F6ba43b4c1bf9477e9a28cc511e7171f9%2F1e486f47baf14c56a0655d049071b8f9?format=png&width=2000'
            };
            const defaultFrame = 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000';
            const frameUrl = FRAME_MAP[String(agent.key).toLowerCase()] || defaultFrame;
            composedDataUrl = await composeStickerWithHtmlLabel(dataUrl, agent.name || agent.key, {
              stickerSize: 1024,
              frameUrl,
              drawFrame: true
            });
          } else {
            composedDataUrl = await composeStickerFromSource(dataUrl, undefined, 1024, { agentLabel: null, drawFrame: true });
          }
        } catch (e) {
          console.warn('HTML composition failed for remote image, using canvas fallback', e);
          composedDataUrl = await composeStickerFromSource(dataUrl, undefined, 1024, { agentLabel: agent?.name || agent?.key || null, drawFrame: true });
        }
        source = dataUrl;
      }
    } catch (e) {
      console.warn('Failed to fetch remote image for composition', e);
    }
  }

  return { gen, source, composedDataUrl };
}

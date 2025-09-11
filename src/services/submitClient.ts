export async function uploadComposedToServer(payload: { email:string; name:string; timestamp:string; agent:any; survey:any; photo?:string; composedDataUrl:string; filename?:string }) {
  let url = '/api/upload-composed';
  try {
    if (typeof window !== 'undefined') {
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocal) {
        const port = 3000;
        url = `${window.location.protocol}//${window.location.hostname}:${port}/api/upload-composed`;
      }
    }
  } catch (e) {}

  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const json = await resp.json().catch(() => null);

  // If server reports missing Supabase config, attempt client-side upload using anon keys (fallback)
  if (!resp.ok) {
    const errMsg = json?.error || json || resp.statusText || 'Upload failed';
    if (String(errMsg).includes('Supabase configuration') || String(errMsg).includes('Missing Supabase')) {
      try {
        // try client-side upload using VITE variables
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
        const supabaseAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
        const supabaseBucket = (import.meta.env.VITE_SUPABASE_BUCKET as string) || '';
        if (!supabaseUrl || !supabaseAnon || !supabaseBucket) throw new Error('Client Supabase not configured (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_BUCKET required)');
        const { uploadDataUrlToSupabase } = await import('./supabaseClient');
        const publicUrl = await uploadDataUrlToSupabase(supabaseUrl, supabaseAnon, supabaseBucket, payload.composedDataUrl);

        // Optionally fire n8n webhook from client if configured
        const n8nWebhook = (import.meta.env.VITE_N8N_WEBHOOK_URL as string) || '';
        const n8nAuth = (import.meta.env.VITE_N8N_WEBHOOK_AUTH as string) || '';
        if (n8nWebhook) {
          try {
            const headers: Record<string,string> = { 'Content-Type': 'application/json' };
            if (n8nAuth) headers['Authorization'] = n8nAuth;
            await fetch(n8nWebhook, { method: 'POST', headers, body: JSON.stringify({ email: payload.email, name: payload.name, timestamp: payload.timestamp, sticker: publicUrl, photo: payload.photo || '', agent: payload.agent?.name || payload.agent?.key || null, survey: payload.survey }) });
          } catch (e) { console.warn('client n8n webhook failed', e); }
        }

        return { ok: true, imageUrl: publicUrl, clientFallback: true };
      } catch (clientErr) {
        throw new Error(`Server upload failed: ${String(errMsg)}; Client fallback failed: ${String((clientErr as any)?.message || clientErr)}`);
      }
    }

    throw new Error(errMsg);
  }

  return json;
}

export async function sendToN8nFromClient(payload: { email:string; name:string; timestamp:string; sticker:string; photo?:string; archetype?:string; survey?:any }) {
  let url = '/api/send-to-n8n';
  try {
    if (typeof window !== 'undefined') {
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocal) {
        const port = 3000;
        url = `${window.location.protocol}//${window.location.hostname}:${port}/api/send-to-n8n`;
      }
    }
  } catch (e) {}

  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const json = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(json?.error || json || resp.statusText || 'n8n send failed');
  return json;
}

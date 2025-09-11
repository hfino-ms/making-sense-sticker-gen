// submitFlow: client-side upload to Supabase using supabase-js and post to n8n webhook from client.
// Returns the response object from the final submission (ok, status, body or bodyText)

export async function submitFlow({ email, name, timestamp, stickerDataUrl, agent, survey }: { email: string; name: string; timestamp: string; stickerDataUrl?: string | null; agent?: any; survey?: any }) {
  let stickerUrl = stickerDataUrl || null;

  // If we have a data URL, upload directly from client using supabase-js helper
  if (stickerUrl && String(stickerUrl).startsWith('data:')) {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const supabaseAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    const supabaseBucket = (import.meta.env.VITE_SUPABASE_BUCKET as string) || '';

    if (!supabaseUrl || !supabaseAnon || !supabaseBucket) {
      return { ok: false, status: 400, bodyText: 'Client Supabase not configured (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_BUCKET required)'};
    }

    try {
      const { uploadDataUrlToSupabase } = await import('./supabaseClient');
      const publicUrl = await uploadDataUrlToSupabase(supabaseUrl, supabaseAnon, supabaseBucket, stickerUrl);
      stickerUrl = publicUrl;
    } catch (e) {
      return { ok: false, status: 500, bodyText: `Failed to upload image to Supabase: ${String((e as any)?.message || e)}` };
    }
  }

  const payload = {
    email: String(email || ''),
    name: String(name || ''),
    timestamp: timestamp || new Date().toISOString(),
    sticker: stickerUrl,
    agent: agent || null,
    survey: survey || {}
  };

  // Determine Agent from answers (we include survey map as answers)
  try {
    const { exportAgentResult } = await import('../utils/agent');
    const agentResult = exportAgentResult(survey as any);
    // Return agent and payload
    return { ok: true, status: 200, body: { agent: agentResult.agent, payload } };
  } catch (e) {
    // If agent calc fails, still return payload without agent
    return { ok: true, status: 200, body: { payload, agentError: String((e as any)?.message || e) } };
  }
}

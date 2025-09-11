export function getOpenAIKey({ strict = false } = {}) {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '';
  if (strict && !key) throw new Error('Missing OPENAI_API_KEY');
  return key;
}

export function getSupabaseConfig({ strict = false } = {}) {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const bucket = process.env.SUPABASE_BUCKET || 'stickers';
  if (strict && (!url || !key)) throw new Error('Missing Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  return { url, key, bucket };
}

export function getN8nWebhook({ strict = false } = {}) {
  const url = process.env.N8N_WEBHOOK_URL || '';
  const auth = process.env.N8N_WEBHOOK_AUTH || '';
  if (strict && !url) throw new Error('Missing N8N_WEBHOOK_URL');
  return { url, auth };
}

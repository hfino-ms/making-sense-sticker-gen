import fetch from 'node-fetch';

export async function uploadBufferToSupabase(supabaseUrl, supabaseKey, bucket, buffer, contentType, filename) {
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase config');
  const normalized = String(supabaseUrl).replace(/\/$/, '');
  const uploadEndpoint = `${normalized}/storage/v1/object/${bucket}/${filename}`;

  const resp = await fetch(uploadEndpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: buffer
  });

  const txt = await resp.text().catch(() => '');
  if (!resp.ok) throw new Error(`Supabase upload failed: ${resp.status} ${txt}`);
  return `${normalized}/storage/v1/object/public/${bucket}/${filename}`;
}

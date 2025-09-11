import { createClient } from '@supabase/supabase-js';

// Upload a data URL directly to Supabase Storage (client-side) using the anon key.
// Returns the public URL of the uploaded object.
export async function uploadDataUrlToSupabase(supabaseUrl: string, anonKey: string, bucket: string, dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) throw new Error('Invalid dataUrl');
  if (!supabaseUrl || !anonKey || !bucket) throw new Error('Missing Supabase configuration');

  // Convert data URL to Blob without calling fetch
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) throw new Error('Invalid data URL');
  const mime = matches[1] || 'image/png';
  const b64 = matches[2] || '';
  const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const blob = new Blob([binary], { type: mime });

  // compute sha256 filename from binary
  const arr = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arr);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const ext = mime.includes('png') ? 'png' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png');
  const filename = `${hashHex}.${ext}`;

  const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  // Upload using upsert so repeated uploads overwrite same file
  try {
    const { error } = await supabase.storage.from(bucket).upload(filename, blob, { upsert: true, contentType: mime });
    if (error) {
      // throw to be handled by fallback below
      throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    if (!data || !data.publicUrl) throw new Error('Failed to get public URL from Supabase');
    return data.publicUrl;
  } catch (uploadErr: any) {
    // No REST fallback in strict clean mode. Surface the original error so caller can handle it.
    console.error('supabaseClient: upload via supabase-js failed:', String(uploadErr?.message || uploadErr));
    throw new Error(`Supabase upload failed: ${String(uploadErr?.message || uploadErr)}`);
  }
}

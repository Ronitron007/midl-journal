import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

type AuthResult =
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; error: string };

export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');

  // Debug env vars (just prefixes for security)
  const url = Deno.env.get('SUPABASE_URL') || 'NOT_SET';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'NOT_SET';
  console.log('[AUTH] SUPABASE_URL:', url.substring(0, 30));
  console.log('[AUTH] ANON_KEY prefix:', anonKey.substring(0, 20));

  if (!authHeader) {
    console.error('[AUTH] No auth header in request');
    return { ok: false, error: 'No auth header' };
  }

  // Debug: log token format
  const tokenPreview = authHeader.substring(0, 50) + '...';
  console.log('[AUTH] Header:', tokenPreview);

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    console.error(
      '[AUTH] getUser failed:',
      error?.message || 'no user',
      error?.status
    );
    return { ok: false, error: error?.message || 'Unauthorized' };
  }

  console.log('[AUTH] Success:', user.id);
  return { ok: true, userId: user.id, supabase };
}

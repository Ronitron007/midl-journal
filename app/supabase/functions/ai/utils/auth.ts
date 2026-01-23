import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

type AuthResult =
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; error: string };

export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { ok: false, error: "No auth header" };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false, error: "Unauthorized" };
  }

  return { ok: true, userId: user.id, supabase };
}

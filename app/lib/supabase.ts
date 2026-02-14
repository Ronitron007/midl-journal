import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Buffer before expiry to trigger refresh (60 seconds)
const TOKEN_REFRESH_BUFFER_SECONDS = 60;

/**
 * Get a valid session, refreshing only if token is expired or about to expire.
 * Use this before calling Edge Functions to ensure a valid access token.
 */
export async function getValidSession(): Promise<Session> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  // Check if token is expired or will expire within buffer period
  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = expiresAt - now < TOKEN_REFRESH_BUFFER_SECONDS;

  if (needsRefresh) {
    const {
      data: { session: refreshedSession },
      error,
    } = await supabase.auth.refreshSession();
    if (error || !refreshedSession) {
      throw new Error('Session expired, please sign in again');
    }
    return refreshedSession;
  }

  return session;
}

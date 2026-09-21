import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://yczragtkgtqtngdodkgk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_D_aTvmUW5fVsGNYDQgjKBQ_JgyCGpBU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const ADMIN_EMAIL = 'igetobiloluwa36@gmail.com';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function ensureProfile(user) {
  if (!user) return null;
  const email = String(user.email || '').trim().toLowerCase();
  const { data, error } = await supabase.from('profiles')
    .upsert({ id: user.id, email, full_name: user.user_metadata?.full_name || '' }, { onConflict: 'id' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) throw new Error('Enter an email address.');
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: window.location.origin + window.location.pathname }
  });
  if (error) throw error;
  return normalized;
}

export async function signOut() { await supabase.auth.signOut(); }

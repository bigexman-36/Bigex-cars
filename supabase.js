// Supabase browser client configuration.
// Add your project's public URL and anon key here after creating the Supabase project.
// Never put a service-role key in this file.

const SUPABASE_URL = window.BIGEX_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.BIGEX_SUPABASE_ANON_KEY || '';

window.BigexSupabase = {
  configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

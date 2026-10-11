const { url, anonKey } = window.SUPABASE_CONFIG;

window.supabaseClient = window.supabase.createClient(url, anonKey);
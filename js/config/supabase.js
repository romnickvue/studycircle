const { url, anonKey } = window.SUPABASE_CONFIG;

const supabaseClient = window.supabase.createClient(url, anonKey);
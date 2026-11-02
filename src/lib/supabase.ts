// Supabase client configuration & fallback helper

export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Standard logger for development & audit
export const logDatabaseAction = (action: string, details?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(`[DB Action: ${action}]`, details || '');
  }
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'movie-tracker@0.0.0'
    }
  }
});

// Add a more detailed connection test function
export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // First test: Basic health check
    const { error: healthError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('Health check failed:', healthError);
      return false;
    }
    
    // Second test: Auth configuration
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth check failed:', authError);
      return false;
    }
    
    console.log('Supabase connection successful');
    console.log('Auth status:', authData.session ? 'Has session' : 'No session');
    
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    return false;
  }
}
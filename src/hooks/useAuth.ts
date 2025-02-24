import { useCallback, useEffect, useState } from 'react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const createUserIfNeeded = async (user: User) => {
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
            avatar_url: user.user_metadata.avatar_url
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error creating user:', err);
      // Don't throw - we still want the user to be able to use the app
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkConnection = async () => {
      if (!mounted) return;

      console.log(`Attempting connection (try ${retryCount + 1}/${MAX_RETRIES})`);
      
      const connected = await testSupabaseConnection();
      
      if (!mounted) return;
      
      if (connected) {
        setIsConnected(true);
        setError(null);
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          await createUserIfNeeded(session.user);
          setUser(session.user);
        } else {
          setUser(null);
        }

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to get session. Please try again.');
        }
      } else {
        if (retryCount < MAX_RETRIES - 1) {
          console.log('Connection failed, retrying in 2 seconds...');
          setTimeout(() => {
            if (mounted) {
              setRetryCount(prev => prev + 1);
            }
          }, 2000);
        } else {
          setError('Unable to connect to the database after multiple attempts. Please check your connection and try again later.');
        }
      }
      
      if (mounted) {
        setIsLoading(false);
      }
    };

    checkConnection();

    // Listen for auth changes if connected
    let subscription: { unsubscribe: () => void } | null = null;
    if (isConnected) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (mounted) {
          if (session?.user) {
            await createUserIfNeeded(session.user);
            setUser(session.user);
          } else {
            setUser(null);
          }
          setError(null);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [retryCount]);

  const signIn = async () => {
    if (!isConnected) {
      setError('Cannot sign in: Database connection is not available');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email'
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAuthCallback = useCallback(async () => {
    if (!isConnected) {
      setError('Cannot complete authentication: Database connection is not available');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      window.location.href = '/';
    } catch (err) {
      console.error('Auth callback error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const signOut = async () => {
    if (!isConnected) {
      setError('Cannot sign out: Database connection is not available');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    user, 
    signIn, 
    signOut, 
    handleAuthCallback, 
    error, 
    isLoading,
    isConnected 
  };
}
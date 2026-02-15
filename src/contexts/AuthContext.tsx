import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatarUrl?: string }) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(timeout);
      })
      .catch((error) => {
        console.error('Auth error:', error);
        setLoading(false);
        clearTimeout(timeout);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string }) => {
    const updates: Record<string, string> = {};
    if (data.displayName !== undefined) updates.display_name = data.displayName;
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
    
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    
    return { error };
  };

  const deleteAccount = async () => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      // Delete user data from all tables
      await supabase.from('user_progress').delete().eq('user_id', user.id);
      await supabase.from('user_profiles').delete().eq('id', user.id);
      
      // Delete avatar from storage if exists
      const { data: avatarFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);
      
      if (avatarFiles && avatarFiles.length > 0) {
        const filesToDelete = avatarFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filesToDelete);
      }
      
      // Call server endpoint to delete auth user (requires service role)
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://tewter.vercel.app';
      const response = await fetch(`${API_BASE}/api/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
      
      // Sign out after deletion
      await signOut();
      
      return { error: null };
    } catch (error) {
      console.error('Delete account error:', error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

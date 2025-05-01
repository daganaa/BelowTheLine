import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signUp: async (email, password) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: authData.user.id,
          full_name: email.split('@')[0], // Set a default name from email
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (profileError) {
        // If the error is due to duplicate profile, that's okay - the user can still proceed
        if (profileError.code !== '23505') { // Not a duplicate key error
          throw new Error('Failed to create profile. Please try again.');
        }
      }
    }
  },
  signOut: async () => {
    try {
      set({ user: null, session: null }); // Clear local state first
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during sign out:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error during sign out:", error);
      throw error; // Re-throw to allow handling by the UI
    }
  },
  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },
}));
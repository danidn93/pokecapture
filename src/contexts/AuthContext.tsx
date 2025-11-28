import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// -----------------------------
// Perfil REAL según la tabla
// -----------------------------
interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  points: number;
  level: number;
  guessed_pokemon: string[] | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;

  signUp: (
    email: string,
    password: string,
    username: string,
    avatar_url: string
  ) => Promise<{ error: Error | null }>;

  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================
  // Obtener perfil completo
  // =========================
  const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, created_at, points, level, guessed_pokemon')
    .eq('id', userId)
    .maybeSingle();

  if (!error && data) {
    setProfile(data);
  }
};

  // Si usas roles -> opcional
  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkAdminRole(user.id);
    }
  };

  // ================================
  // Listener de sesión Auth
  // ================================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ====================================
  // CREAR CUENTA (SIGNUP)
  // ====================================
  const signUp = async (email: string, password: string, username: string, avatar_url: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username,
          avatar_url
        }
      }
    });

    if (!error) {
      // enviar correo
      const gifUrl = "https://rnqjafnxqgbpibphnkkt.supabase.co/storage/v1/object/public/assets/welcome.gif";

      await supabase.functions.invoke("send-welcome-email", {
        body: { email, username, gifUrl }
      });
    }

    return { error };
  };

  // ====================================
  // LOGIN
  // ====================================
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  };

  // ====================================
  // LOGOUT
  // ====================================
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

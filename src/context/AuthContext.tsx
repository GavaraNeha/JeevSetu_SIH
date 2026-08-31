import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Role, Language } from '@/types/db';
import { createTranslator, type TFunction } from '@/lib/i18n';
import { normalizeLocationNullable } from '@/lib/location';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  t: TFunction;
  lang: Language;
  setLang: (l: Language) => void;
  signUp: (email: string, password: string, data: SignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  full_name: string;
  phone: string;
  role: Role;
  language: Language;
  village: string;
  block: string;
  district: string;
  state: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Language>('en');

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) {
      console.error('Profile fetch error:', error);
      return;
    }
    if (data) {
      setProfile(data as Profile);
      setLangState((data as Profile).language);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        (async () => {
          await fetchProfile(sess.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfile]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
  }, []);

  const t = createTranslator(lang);

  const signUp = useCallback(
    async (email: string, password: string, data: SignUpData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
          },
        },
      });
      if (error) return { error: error.message };
      if (!authData.user) return { error: 'Sign up failed' };

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: data.full_name,
        phone: data.phone || null,
        role: data.role,
        language: data.language,
        village: normalizeLocationNullable(data.village),
        block: normalizeLocationNullable(data.block),
        district: normalizeLocationNullable(data.district),
        state: normalizeLocationNullable(data.state),
      });
      if (profileError) return { error: profileError.message };

      return { error: null };
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, t, lang, setLang, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

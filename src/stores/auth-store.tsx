import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { authCallbackUrl } from '@/config/links';
import { ensureProfile } from '@/lib/supabase/repositories';

type AuthContextValue = { session: Session | null; loading: boolean; demoMode: boolean; signInWithEmail: (email: string) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false); if (data.session) void ensureProfile(data.session.user).catch(() => undefined); } }).catch(() => { if (active) { setSession(null); setLoading(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false); if (nextSession) void ensureProfile(nextSession.user).catch(() => undefined); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  const value = useMemo<AuthContextValue>(() => ({ session, loading, demoMode: !isSupabaseConfigured, signInWithEmail: async (email) => { const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: authCallbackUrl() } }); if (error) throw error; }, signOut: async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; } }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }

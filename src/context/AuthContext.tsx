import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'farmer' | 'officer';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  mobile_number: string | null;
  phone: string | null;
  district: string;
  village: string | null;
  farm_size: number | null;
  soil_type: string | null;
  preferred_language: string;
  crops_grown: string | null;
  role: UserRole;
  department: string | null;
  designation: string | null;
  employee_id: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  // Officer auth (email/password)
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; mobile_number?: string; role?: UserRole }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // Farmer auth (phone/name)
  farmerSignIn: (phone: string) => Promise<UserProfile | null>;
  farmerSignUp: (fullName: string, phone: string, district?: string) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const FARMER_SESSION_KEY = 'agromihira-farmer-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data as UserProfile | null;
  }

  async function fetchProfileByPhone(phone: string): Promise<UserProfile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .single();
    return data as UserProfile | null;
  }

  // Check for farmer session in localStorage
  useEffect(() => {
    async function initAuth() {
      // Check for officer session (Supabase auth)
      const { data: { session: sbSession } } = await supabase.auth.getSession();

      if (sbSession) {
        setSession(sbSession);
        setUser(sbSession.user);
        const profileData = await fetchProfile(sbSession.user.id);
        setProfile(profileData);
      } else {
        // Check for farmer session (localStorage)
        const farmerSessionStr = localStorage.getItem(FARMER_SESSION_KEY);
        if (farmerSessionStr) {
          try {
            const farmerSession = JSON.parse(farmerSessionStr);
            const profileData = await fetchProfileByPhone(farmerSession.phone);
            if (profileData) {
              setProfile(profileData);
              // Create a pseudo user object for farmer
              setUser({
                id: profileData.user_id,
                email: null,
                phone: profileData.phone,
                created_at: '',
                app_metadata: {},
                user_metadata: { full_name: profileData.full_name, role: 'farmer' },
                aud: 'authenticated',
              } as User);
            }
          } catch {
            localStorage.removeItem(FARMER_SESSION_KEY);
          }
        }
      }
      setLoading(false);
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id);
        setProfile(profileData);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Officer sign in (email/password)
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // Officer sign up (email/password)
  const signUp = async (email: string, password: string, metadata?: { full_name?: string; mobile_number?: string; role?: UserRole }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata?.full_name,
          mobile_number: metadata?.mobile_number,
          role: metadata?.role || 'officer',
        },
      },
    });
    if (error) throw error;
  };

  // Farmer sign in (phone lookup)
  const farmerSignIn = async (phone: string): Promise<UserProfile | null> => {
    const profileData = await fetchProfileByPhone(phone);
    if (profileData) {
      setProfile(profileData);
      setUser({
        id: profileData.user_id,
        email: null,
        phone: profileData.phone,
        created_at: '',
        app_metadata: {},
        user_metadata: { full_name: profileData.full_name, role: 'farmer' },
        aud: 'authenticated',
      } as User);
      localStorage.setItem(FARMER_SESSION_KEY, JSON.stringify({ phone }));
      return profileData;
    }
    return null;
  };

  // Farmer sign up (name + phone, no email required)
  const farmerSignUp = async (fullName: string, phone: string, district: string = 'Srikakulam'): Promise<UserProfile> => {
    // Check if phone already exists
    const existing = await fetchProfileByPhone(phone);
    if (existing) {
      throw new Error('Phone number already registered');
    }

    // Create a dummy email for Supabase auth (required field)
    const dummyEmail = `farmer_${phone.replace(/\D/g, '')}@agromihira.local`;

    // Create user with dummy email (auto-confirmed via trigger)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dummyEmail,
      password: Math.random().toString(36).slice(-12) + 'A1!', // Random strong password
      options: {
        data: {
          full_name: fullName,
          role: 'farmer',
          phone,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create account');

    // Update profile with phone number
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone,
        district,
      })
      .eq('user_id', authData.user.id);

    if (profileError) throw profileError;

    // Fetch the complete profile
    const profileData = await fetchProfile(authData.user.id);
    if (profileData) {
      setProfile(profileData);
      setUser({
        id: authData.user.id,
        email: null,
        phone,
        created_at: '',
        app_metadata: {},
        user_metadata: { full_name: fullName, role: 'farmer' },
        aud: 'authenticated',
      } as User);
      localStorage.setItem(FARMER_SESSION_KEY, JSON.stringify({ phone }));
      return profileData;
    }

    throw new Error('Failed to create profile');
  };

  const signOut = async () => {
    // Clear farmer session
    localStorage.removeItem(FARMER_SESSION_KEY);

    // Sign out from Supabase
    await supabase.auth.signOut();

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const profileData = await fetchProfile(session.user.id);
      setProfile(profileData);
    } else if (profile?.phone) {
      const profileData = await fetchProfileByPhone(profile.phone);
      setProfile(profileData);
    }
  };

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    farmerSignIn,
    farmerSignUp,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

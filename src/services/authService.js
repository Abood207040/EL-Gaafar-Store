import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[EL-Gaafar Store] Missing Supabase environment variables.\n' +
    'Copy .env.example to .env in the project root and fill in your values:\n' +
    '  VITE_SUPABASE_URL=https://your-project-ref.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key-here\n' +
    'Find these in Supabase → Project Settings → API.'
  );
}

const PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split('.')[0];
  } catch {
    return 'unknown-project';
  }
})();
const AUTH_STORAGE_PREFIX = `sb-${PROJECT_REF}-`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export function clearStoredAuthSession() {
  const clearByPrefix = (storage) => {
    try {
      const keys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key && key.startsWith(AUTH_STORAGE_PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach((key) => storage.removeItem(key));
    } catch {
      // Ignore storage access failures in restricted environments.
    }
  };

  if (typeof window === 'undefined') return;
  clearByPrefix(window.localStorage);
  clearByPrefix(window.sessionStorage);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

export async function getProfileByUserId(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getCustomerProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  // 1. Try finding customer by auth_user_id
  const byAuth = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (byAuth.data) return byAuth.data;

  // 2. Try finding by email
  if (user.email) {
    const byEmail = await supabase
      .from('customers')
      .select('*')
      .eq('email', user.email)
      .limit(1)
      .maybeSingle();

    if (byEmail.data) {
      // Auto-link auth_user_id
      try {
        await supabase
          .from('customers')
          .update({ auth_user_id: user.id })
          .eq('id', byEmail.data.id);
      } catch {
        // ignore if RLS restricts update
      }
      return byEmail.data;
    }
  }

  return null;
}

export async function signUpWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function registerCustomerProfile(profileData) {
  const { data, error } = await supabase.rpc('register_customer', {
    p_full_name: profileData.full_name || '',
    p_phone: profileData.phone || '',
    p_email: profileData.email || '',
    p_city: profileData.city || '',
    p_area: profileData.area || '',
    p_address: profileData.address || ''
  });
  if (error) throw error;
  return data;
}

export async function signInWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

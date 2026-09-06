import { createContext, useContext, useEffect, useState } from 'react';
import {
  clearStoredAuthSession,
  getCurrentUser,
  getProfileByUserId,
  getSession,
  onAuthStateChange,
  signInWithPassword as signInWithPasswordService,
  signOut as signOutService,
  getCustomerProfile,
  signUpWithPassword as signUpWithPasswordService
} from '../services/authService.js';

const AuthContext = createContext(null);
const DEV_MODE = import.meta.env.DEV;

function logSessionDebug(label, session, event = '') {
  if (!DEV_MODE) return;
  const token = session?.access_token || '';
  const tokenPreview = token
    ? `${token.slice(0, 12)}...${token.slice(-8)}`
    : null;
  console.log('[auth] session debug:', {
    label,
    event,
    hasSession: Boolean(session),
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    expiresAt: session?.expires_at ?? null,
    tokenPreview,
  });
}

function shouldResetStoredSession(error) {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  const name = String(error?.name || '').toLowerCase();
  const text = `${message} ${code} ${name}`;
  return (
    text.includes('refresh token') ||
    text.includes('invalid token') ||
    text.includes('jwt') ||
    text.includes('auth session missing') ||
    text.includes('invalid_grant')
  );
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const setAdminState = (currentUser, currentProfile) => {
    const isAdmin = currentProfile?.role === 'admin';
    const message = !currentProfile
      ? 'No profile found for this account.'
      : !isAdmin
        ? 'Logged in but role is not admin.'
        : '';

    if (DEV_MODE) {
      console.log('[auth] current user id:', currentUser?.id ?? null);
      console.log('[auth] current user email:', currentUser?.email ?? null);
      console.log('[auth] loaded profile:', currentProfile ?? null);
      console.log('[auth] isAdmin value:', isAdmin);
    }

    setUser(currentUser);
    setProfile(currentProfile);
    setAdminMessage(message);
    return { isAdmin, message };
  };

  const clearUserState = () => {
    setUser(null);
    setProfile(null);
    setCustomerProfile(null);
    setAdminMessage('');
  };

  const loadCurrentUserProfile = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      clearUserState();
      return { user: null, profile: null, isAdmin: false, message: '' };
    }

    const [currentProfile, currentCustomerProfile] = await Promise.all([
      getProfileByUserId(currentUser.id),
      getCustomerProfile()
    ]);

    const { isAdmin, message } = setAdminState(currentUser, currentProfile);
    setCustomerProfile(currentCustomerProfile);

    return { user: currentUser, profile: currentProfile, customerProfile: currentCustomerProfile, isAdmin, message };
  };

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (event, currentSession) => {
      if (!isMounted) return;
      
      setSession(currentSession);
      logSessionDebug('auth_state_change', currentSession, event);
      setAuthError('');

      try {
        if (currentSession?.user) {
          await loadCurrentUserProfile();
        } else {
          clearUserState();
        }
      } catch (error) {
        console.error('Failed during auth change/profile refresh', error);
        if (shouldResetStoredSession(error)) {
          clearStoredAuthSession();
        }
        setAuthError(error.message || 'Failed to refresh auth state.');
        if (!currentSession?.user) {
          clearUserState();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const { data: subscription } = onAuthStateChange((event, nextSession) => {
      handleAuthChange(event, nextSession);
    });

    // Supabase usually fires INITIAL_SESSION synchronously or immediately,
    // but as a fallback, we fetch session if loading is still true after a small delay.
    const fallbackTimer = setTimeout(async () => {
      if (isMounted && loading) {
        try {
          const fbSession = await getSession();
          await handleAuthChange('FALLBACK_INIT', fbSession);
        } catch {
          if (isMounted) setLoading(false);
        }
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithPassword = async ({ email, password }) => {
    setLoading(true);
    setAuthError('');
    try {
      const result = await signInWithPasswordService({ email, password });
      setSession(result.session || null);
      logSessionDebug('sign_in', result.session || null);
      const profileState = await loadCurrentUserProfile();
      return { ...result, isAdmin: profileState.isAdmin };
    } catch (error) {
      if (shouldResetStoredSession(error)) {
        clearStoredAuthSession();
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async ({ email, password }) => {
    setLoading(true);
    setAuthError('');
    try {
      const result = await signUpWithPasswordService({ email, password });
      setSession(result.session || null);
      logSessionDebug('sign_up', result.session || null);
      await loadCurrentUserProfile();
      return result;
    } catch (error) {
      if (shouldResetStoredSession(error)) {
        clearStoredAuthSession();
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await signOutService();
      setSession(null);
      clearUserState();
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomerProfile = async () => {
    try {
      const cust = await getCustomerProfile();
      setCustomerProfile(cust);
      return cust;
    } catch (err) {
      console.warn('Failed to refresh customer profile:', err);
      return null;
    }
  };


  const isAdmin = profile?.role === 'admin';
  const value = {
    session,
    user,
    profile,
    customerProfile,
    isAdmin,
    adminMessage,
    authError,
    loading,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    refreshCustomerProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

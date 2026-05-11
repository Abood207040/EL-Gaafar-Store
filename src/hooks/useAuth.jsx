import { createContext, useContext, useEffect, useState } from 'react';
import {
  getCurrentUser,
  getProfileByUserId,
  getSession,
  onAuthStateChange,
  signInWithPassword as signInWithPasswordService,
  signOut as signOutService,
} from '../services/authService.js';

const AuthContext = createContext(null);
const DEV_MODE = import.meta.env.DEV;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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
    setAdminMessage('');
  };

  const loadCurrentUserProfile = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      clearUserState();
      return { user: null, profile: null, isAdmin: false, message: '' };
    }

    const currentProfile = await getProfileByUserId(currentUser.id);
    const { isAdmin, message } = setAdminState(currentUser, currentProfile);
    return { user: currentUser, profile: currentProfile, isAdmin, message };
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const initialSession = await getSession();
        if (!isMounted) return;
        setSession(initialSession);
        setAuthError('');
        if (initialSession?.user) {
          await loadCurrentUserProfile();
        } else {
          clearUserState();
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load auth session/profile', error);
        setAuthError(error.message || 'Failed to load auth state.');
        clearUserState();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const { data: subscription } = onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setLoading(true);
      setSession(nextSession);
      setAuthError('');
      try {
        if (nextSession?.user) {
          await loadCurrentUserProfile();
        } else {
          clearUserState();
        }
      } catch (error) {
        console.error('Failed during auth change/profile refresh', error);
        setAuthError(error.message || 'Failed to refresh auth state.');
        clearUserState();
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
    // `loadCurrentUserProfile` intentionally lives in component scope for shared reuse
    // between init/auth-change/sign-in flows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithPassword = async ({ email, password }) => {
    setLoading(true);
    setAuthError('');
    const result = await signInWithPasswordService({ email, password });
    setSession(result.session || null);
    try {
      await loadCurrentUserProfile();
    } finally {
      setLoading(false);
    }
    return result;
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

  const isAdmin = profile?.role === 'admin';
  const value = {
    session,
    user,
    profile,
    isAdmin,
    adminMessage,
    authError,
    loading,
    signInWithPassword,
    signOut,
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

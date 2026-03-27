import type { AuthUser, UserSummary } from '@aurora/shared';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { fetchProfile, updateProfile as patchProfile } from '../api/account';
import {
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
  requestEmailCode as requestEmailCodeRequest,
  type EmailCodeResponse,
} from '../api/auth';
import { getStoredAuthToken, setStoredAuthToken } from '../api/client';

type AuthSessionContextValue = {
  loaded: boolean;
  pending: boolean;
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  requestRegisterCode: (email: string) => Promise<EmailCodeResponse>;
  register: (payload: { name: string; email: string; password: string; code: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    avatar?: string;
    jobTitle?: string;
    phone?: string;
    location?: string;
    website?: string;
    bio?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function toAuthUser(user: AuthUser | UserSummary) {
  return user as AuthUser;
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const storedToken = await getStoredAuthToken();
      if (!active) {
        return;
      }

      if (!storedToken) {
        setLoaded(true);
        return;
      }

      setToken(storedToken);

      try {
        const currentUser = await fetchCurrentUser();
        if (!active) {
          return;
        }
        setUser(currentUser);
      } catch {
        await setStoredAuthToken(null);
        if (!active) {
          return;
        }
        setToken(null);
        setUser(null);
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function applyAuthSession(nextToken: string, nextUser: AuthUser) {
    await setStoredAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function login(payload: { email: string; password: string }) {
    setPending(true);
    try {
      const response = await loginRequest(payload);
      await applyAuthSession(response.token, response.user);
    } finally {
      setPending(false);
    }
  }

  async function requestRegisterCode(email: string) {
    setPending(true);
    try {
      return await requestEmailCodeRequest({
        email,
        purpose: 'register',
      });
    } finally {
      setPending(false);
    }
  }

  async function register(payload: { name: string; email: string; password: string; code: string }) {
    setPending(true);
    try {
      const response = await registerRequest(payload);
      await applyAuthSession(response.token, response.user);
    } finally {
      setPending(false);
    }
  }

  async function refreshProfile() {
    setPending(true);
    try {
      const profile = await fetchProfile();
      setUser(toAuthUser(profile));
    } finally {
      setPending(false);
    }
  }

  async function updateProfile(payload: {
    name?: string;
    avatar?: string;
    jobTitle?: string;
    phone?: string;
    location?: string;
    website?: string;
    bio?: string;
  }) {
    setPending(true);
    try {
      const profile = await patchProfile(payload);
      setUser(toAuthUser(profile));
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    await setStoredAuthToken(null);
    setToken(null);
    setUser(null);
  }

  const value: AuthSessionContextValue = {
    loaded,
    pending,
    token,
    user,
    isAuthenticated: Boolean(token && user),
    login,
    requestRegisterCode,
    register,
    refreshProfile,
    updateProfile,
    logout,
  };

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }

  return context;
}

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { refreshSession, setAccessToken, setSessionExpiredHandler } from '../services/apiClient';
import { authService } from '../services/authService';
import { AuthContext } from './authContextObject';

/**
 * status: 'loading' while restoring the session from the refresh cookie,
 * then 'authenticated' or 'anonymous'.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null });

  const clearSession = useCallback(() => {
    setAccessToken(null);
    queryClient.clear();
    setState({ status: 'anonymous', user: null });
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    let cancelled = false;
    refreshSession()
      .then((session) => !cancelled && setState({ status: 'authenticated', user: session.user }))
      .catch(() => !cancelled && setState({ status: 'anonymous', user: null }));
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const session = await authService.login(credentials);
    setAccessToken(session.accessToken);
    setState({ status: 'authenticated', user: session.user });
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  /** Re-reads the current user, e.g. after an admin changes their own role. */
  const reloadUser = useCallback(async () => {
    const user = await authService.me();
    setState({ status: 'authenticated', user });
  }, []);

  const value = useMemo(() => {
    const permissions = new Set(state.user?.permissions ?? []);
    return {
      ...state,
      login,
      logout,
      reloadUser,
      clearSession,
      can: (...codes) => codes.every((code) => permissions.has(code)),
      canAny: (...codes) => codes.some((code) => permissions.has(code)),
    };
  }, [state, login, logout, reloadUser, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

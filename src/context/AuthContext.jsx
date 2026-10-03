import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  refreshSession,
  setAccessToken,
  setBranchId,
  setSessionExpiredHandler,
} from '../services/apiClient';
import { authService } from '../services/authService';
import { AuthContext } from './authContextObject';

const branchStorageKey = (userId) => `jcb-inventory:branch:${userId}`;

function readStoredBranch(userId) {
  try {
    return Number(localStorage.getItem(branchStorageKey(userId))) || null;
  } catch {
    return null;
  }
}

function storeBranch(userId, id) {
  try {
    localStorage.setItem(branchStorageKey(userId), String(id));
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only.
  }
}

/** Picks the remembered branch if the user still has it, otherwise their first branch. */
function initialBranchId(user) {
  const branches = user?.branches ?? [];
  const stored = readStoredBranch(user?.id);
  const id = branches.some((b) => b.id === stored) ? stored : (branches[0]?.id ?? null);
  // Set before any query runs so the first requests already target the right branch.
  setBranchId(id);
  return id;
}

/**
 * status: 'loading' while restoring the session from the refresh cookie,
 * then 'authenticated' or 'anonymous'. Also holds the branch the user is working in.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null, branchId: null });

  const signedIn = useCallback(
    (user) => setState({ status: 'authenticated', user, branchId: initialBranchId(user) }),
    [],
  );

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setBranchId(null);
    queryClient.clear();
    setState({ status: 'anonymous', user: null, branchId: null });
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    let cancelled = false;
    refreshSession()
      .then((session) => !cancelled && signedIn(session.user))
      .catch(() => !cancelled && setState({ status: 'anonymous', user: null, branchId: null }));
    return () => {
      cancelled = true;
    };
  }, [clearSession, signedIn]);

  const login = useCallback(
    async (credentials) => {
      const session = await authService.login(credentials);
      setAccessToken(session.accessToken);
      signedIn(session.user);
      return session.user;
    },
    [signedIn],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  /** Re-reads the current user, e.g. after an admin changes their own role or branches. */
  const reloadUser = useCallback(async () => {
    const user = await authService.me();
    signedIn(user);
  }, [signedIn]);

  /** Switches branch: every cached query belongs to the old branch, so all are refetched. */
  const { user: currentUser, branchId: currentBranchId } = state;
  const setBranch = useCallback(
    (id) => {
      if (!currentUser || currentBranchId === id) return;
      storeBranch(currentUser.id, id);
      // The request header must change before queries refetch.
      setBranchId(id);
      setState((prev) => ({ ...prev, branchId: id }));
      queryClient.resetQueries();
    },
    [currentUser, currentBranchId, queryClient],
  );

  const value = useMemo(() => {
    const permissions = new Set(state.user?.permissions ?? []);
    const branches = state.user?.branches ?? [];
    return {
      ...state,
      branches,
      branch: branches.find((b) => b.id === state.branchId) ?? null,
      setBranch,
      login,
      logout,
      reloadUser,
      clearSession,
      can: (...codes) => codes.every((code) => permissions.has(code)),
      canAny: (...codes) => codes.some((code) => permissions.has(code)),
    };
  }, [state, setBranch, login, logout, reloadUser, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

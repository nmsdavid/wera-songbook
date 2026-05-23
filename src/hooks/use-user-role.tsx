'use client';

import { createContext, useContext } from 'react';
import type { AppRole } from '@/types/database';

export type UserRoleState = {
  userId: string | null;
  email: string | null;
  role: AppRole | null;
  isAdmin: boolean;
  isLeader: boolean;
  loading: boolean;
};

const defaultState: UserRoleState = {
  userId: null,
  email: null,
  role: null,
  isAdmin: false,
  isLeader: false,
  loading: false,
};

const UserRoleContext = createContext<UserRoleState>(defaultState);

export function UserRoleProvider({
  value,
  children,
}: {
  value: UserRoleState;
  children: React.ReactNode;
}) {
  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

/**
 * Returns the current user's role. The value is sourced once on the server in
 * the (app) layout via getUserMembership and shared through context — it is the
 * same source of truth as the server-side access gate, so it never drifts and
 * needs no client-side fetch (no stale-JWT issues).
 */
export function useUserRole(): UserRoleState {
  return useContext(UserRoleContext);
}

'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { AppRole } from '@/types/database';
import type { User } from '@supabase/supabase-js';

type UserRoleState = {
  user: User | null;
  role: AppRole | null;
  isAdmin: boolean;
  isLeader: boolean;
  loading: boolean;
};

export function useUserRole(): UserRoleState {
  const [state, setState] = useState<UserRoleState>({
    user: null,
    role: null,
    isAdmin: false,
    isLeader: false,
    loading: true,
  });

  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchUserRole() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setState({ user: null, role: null, isAdmin: false, isLeader: false, loading: false });
        return;
      }

      // Try to get role from app_metadata (set by custom access token hook)
      const appMetadata = user.app_metadata;
      if (appMetadata?.role) {
        const role = appMetadata.role as AppRole;
        setState({
          user,
          role,
          isAdmin: role === 'admin',
          isLeader: role === 'leader',
          loading: false,
        });
        return;
      }

      // Fallback: query org_members directly
      const { data: members } = await supabase
        .from('org_members')
        .select('id, user_id, role')
        .eq('user_id', user.id)
        .limit(1) as { data: Array<{ id: string; user_id: string; role: AppRole }> | null };

      const role: AppRole = members?.[0]?.role ?? 'member';
      setState({
        user,
        role,
        isAdmin: role === 'admin',
        isLeader: role === 'leader',
        loading: false,
      });
    }

    fetchUserRole();
  }, []);

  return state;
}

import { createServerClient } from './server';
import type { AppRole } from '@/types/database';

export type UserMembership = {
  userId: string;
  email: string | undefined;
  orgId: string;
  departmentId: string;
  role: AppRole;
};

/**
 * Get the current user's org membership from Supabase.
 * Returns null if not authenticated or no membership found.
 * Use in Server Actions to get org_id and department_id for RLS-compliant queries.
 */
export async function getUserMembership(
  supabase?: Awaited<ReturnType<typeof createServerClient>>,
): Promise<UserMembership | null> {
  const client = supabase ?? await createServerClient();

  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: membership } = await client
    .from('org_members')
    .select('org_id, department_id, role')
    .eq('user_id', user.id)
    .limit(1) as { data: Array<{ org_id: string; department_id: string; role: AppRole }> | null };

  if (!membership?.[0]) return null;

  return {
    userId: user.id,
    email: user.email,
    orgId: membership[0].org_id,
    departmentId: membership[0].department_id,
    role: membership[0].role,
  };
}

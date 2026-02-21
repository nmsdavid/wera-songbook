'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getUserMembership } from '@/lib/supabase/auth-helpers';
import type { ActionResult } from '@/lib/actions/types';
import type { AppRole, Department, OrgMember } from '@/types/database';

// ── Types ──────────────────────────────────────────────

export type UserWithMembership = {
  id: string;
  email: string;
  created_at: string;
  membership: {
    id: string;
    role: AppRole;
    department_id: string;
    department_name: string;
  };
};

export type CreateUserInput = {
  email: string;
  password: string;
  displayName: string;
  role: AppRole;
  departmentId: string;
};

// ── Helpers ────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createServerClient();
  const membership = await getUserMembership(supabase);
  if (!membership) return null;
  if (membership.role !== 'admin') return null;
  return { supabase, membership };
}

// ── User Actions ───────────────────────────────────────

export async function getUsers(): Promise<ActionResult<{ users: UserWithMembership[] }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  const serviceClient = await createServiceRoleClient();

  // Get org members for this org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members, error: membersError } = (await (ctx.supabase.from('org_members') as any)
    .select('id, user_id, role, department_id')
    .eq('org_id', ctx.membership.orgId)) as {
    data: Array<{ id: string; user_id: string; role: AppRole; department_id: string }> | null;
    error: { message: string } | null;
  };

  if (membersError || !members) {
    console.error('getUsers members:', membersError);
    return { success: false, error: 'Nutzer konnten nicht geladen werden.' };
  }

  // Get departments for name lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: departments } = (await (ctx.supabase.from('departments') as any)
    .select('id, name')
    .eq('org_id', ctx.membership.orgId)) as {
    data: Array<{ id: string; name: string }> | null;
  };

  const deptMap = new Map((departments ?? []).map(d => [d.id, d.name]));

  // Get auth user details via service role
  const { data: authData } = await serviceClient.auth.admin.listUsers();
  const authUsers = authData?.users ?? [];
  const authMap = new Map(authUsers.map(u => [u.id, u]));

  const users: UserWithMembership[] = members
    .map(m => {
      const authUser = authMap.get(m.user_id);
      if (!authUser) return null;
      return {
        id: m.user_id,
        email: authUser.email ?? '',
        created_at: authUser.created_at,
        membership: {
          id: m.id,
          role: m.role,
          department_id: m.department_id,
          department_name: deptMap.get(m.department_id) ?? 'Unbekannt',
        },
      };
    })
    .filter((u): u is UserWithMembership => u !== null)
    .sort((a, b) => a.email.localeCompare(b.email));

  return { success: true, data: { users } };
}

export async function createUser(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (!input.email || !input.password || !input.departmentId) {
    return { success: false, error: 'Bitte alle Pflichtfelder ausfüllen.' };
  }

  if (input.password.length < 6) {
    return { success: false, error: 'Passwort muss mindestens 6 Zeichen lang sein.' };
  }

  const serviceClient = await createServiceRoleClient();

  // Create auth user
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });

  if (authError || !authData.user) {
    console.error('createUser auth:', authError);
    if (authError?.message?.includes('already')) {
      return { success: false, error: 'Ein Nutzer mit dieser E-Mail existiert bereits.' };
    }
    return { success: false, error: 'Nutzer konnte nicht erstellt werden.' };
  }

  // Create org membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: memberError } = (await (serviceClient.from('org_members') as any)
    .insert({
      org_id: ctx.membership.orgId,
      department_id: input.departmentId,
      user_id: authData.user.id,
      role: input.role,
    })) as { error: { message: string } | null };

  if (memberError) {
    console.error('createUser membership:', memberError);
    // Clean up: delete the auth user
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: 'Mitgliedschaft konnte nicht erstellt werden.' };
  }

  revalidatePath('/admin');
  return { success: true, data: { id: authData.user.id } };
}

export async function updateUserRole(
  userId: string,
  role: AppRole,
  departmentId: string,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (userId === ctx.membership.userId) {
    return { success: false, error: 'Du kannst deine eigene Rolle nicht ändern.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (ctx.supabase.from('org_members') as any)
    .update({ role, department_id: departmentId })
    .eq('user_id', userId)
    .eq('org_id', ctx.membership.orgId)) as { error: { message: string } | null };

  if (error) {
    console.error('updateUserRole:', error);
    return { success: false, error: 'Rolle konnte nicht aktualisiert werden.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (newPassword.length < 6) {
    return { success: false, error: 'Passwort muss mindestens 6 Zeichen lang sein.' };
  }

  // Verify user is in admin's org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = (await (ctx.supabase.from('org_members') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', ctx.membership.orgId)
    .limit(1)) as { data: Array<{ id: string }> | null };

  if (!member?.[0]) {
    return { success: false, error: 'Nutzer nicht gefunden.' };
  }

  const serviceClient = await createServiceRoleClient();
  const { error } = await serviceClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error('resetUserPassword:', error);
    return { success: false, error: 'Passwort konnte nicht zurückgesetzt werden.' };
  }

  return { success: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (userId === ctx.membership.userId) {
    return { success: false, error: 'Du kannst dich nicht selbst löschen.' };
  }

  // Delete org membership first (RLS enforced)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: memberError } = (await (ctx.supabase.from('org_members') as any)
    .delete()
    .eq('user_id', userId)
    .eq('org_id', ctx.membership.orgId)) as { error: { message: string } | null };

  if (memberError) {
    console.error('deleteUser membership:', memberError);
    return { success: false, error: 'Nutzer konnte nicht entfernt werden.' };
  }

  // Delete auth user via service role
  const serviceClient = await createServiceRoleClient();
  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('deleteUser auth:', authError);
    return { success: false, error: 'Auth-Konto konnte nicht gelöscht werden.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

// ── Department Actions ─────────────────────────────────

export async function getDepartments(): Promise<ActionResult<{ departments: (Department & { memberCount: number })[] }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: departments, error } = (await (ctx.supabase.from('departments') as any)
    .select('*')
    .eq('org_id', ctx.membership.orgId)
    .order('name')) as { data: Department[] | null; error: { message: string } | null };

  if (error) {
    console.error('getDepartments:', error);
    return { success: false, error: 'Abteilungen konnten nicht geladen werden.' };
  }

  // Count members per department
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = (await (ctx.supabase.from('org_members') as any)
    .select('department_id')
    .eq('org_id', ctx.membership.orgId)) as {
    data: Array<{ department_id: string }> | null;
  };

  const countMap = new Map<string, number>();
  (members ?? []).forEach(m => {
    countMap.set(m.department_id, (countMap.get(m.department_id) ?? 0) + 1);
  });

  const result = (departments ?? []).map(d => ({
    ...d,
    memberCount: countMap.get(d.id) ?? 0,
  }));

  return { success: true, data: { departments: result } };
}

export async function createDepartment(name: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (!name.trim()) {
    return { success: false, error: 'Name darf nicht leer sein.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (ctx.supabase.from('departments') as any)
    .insert({ org_id: ctx.membership.orgId, name: name.trim() })
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null };

  if (error || !data) {
    console.error('createDepartment:', error);
    return { success: false, error: 'Abteilung konnte nicht erstellt werden.' };
  }

  revalidatePath('/admin');
  return { success: true, data: { id: data.id } };
}

export async function updateDepartment(id: string, name: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (!name.trim()) {
    return { success: false, error: 'Name darf nicht leer sein.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (ctx.supabase.from('departments') as any)
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('org_id', ctx.membership.orgId)) as { error: { message: string } | null };

  if (error) {
    console.error('updateDepartment:', error);
    return { success: false, error: 'Abteilung konnte nicht aktualisiert werden.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  // Check if department has members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = (await (ctx.supabase.from('org_members') as any)
    .select('id')
    .eq('department_id', id)
    .limit(1)) as { data: Array<{ id: string }> | null };

  if (members && members.length > 0) {
    return { success: false, error: 'Abteilung hat noch Mitglieder. Bitte zuerst alle Mitglieder verschieben.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (ctx.supabase.from('departments') as any)
    .delete()
    .eq('id', id)
    .eq('org_id', ctx.membership.orgId)) as { error: { message: string } | null };

  if (error) {
    console.error('deleteDepartment:', error);
    return { success: false, error: 'Abteilung konnte nicht gelöscht werden.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

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

export type PendingUser = {
  id: string;
  email: string;
  displayName: string;
  created_at: string;
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
    console.error('getUsers members failed');
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { success: false, error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
  }

  if (input.password.length < 8) {
    return { success: false, error: 'Passwort muss mindestens 8 Zeichen lang sein.' };
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
    console.error('createUser auth failed');
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
    console.error('createUser membership failed');
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
    console.error('updateUserRole failed');
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
    console.error('resetUserPassword failed');
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
    console.error('deleteUser membership failed');
    return { success: false, error: 'Nutzer konnte nicht entfernt werden.' };
  }

  // Delete auth user via service role
  const serviceClient = await createServiceRoleClient();
  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('deleteUser auth failed');
    return { success: false, error: 'Auth-Konto konnte nicht gelöscht werden.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function blockUser(userId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (userId === ctx.membership.userId) {
    return { success: false, error: 'Du kannst dich nicht selbst sperren.' };
  }

  // Remove the membership → the user reverts to "pending" (locked out until an
  // admin approves them again). The auth account is kept.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (ctx.supabase.from('org_members') as any)
    .delete()
    .eq('user_id', userId)
    .eq('org_id', ctx.membership.orgId)) as { error: { message: string } | null };

  if (error) {
    console.error('blockUser failed');
    return { success: false, error: 'Nutzer konnte nicht gesperrt werden.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

// ── Registrierungs-Anfragen (Freigabe) ─────────────────

/**
 * Pending users: authenticated accounts that have signed up but do not yet
 * have an org_members row (i.e. not yet approved by an admin).
 */
export async function getPendingUsers(): Promise<ActionResult<{ users: PendingUser[] }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  const serviceClient = await createServiceRoleClient();

  const { data: authData, error: authError } = await serviceClient.auth.admin.listUsers();
  if (authError || !authData) {
    console.error('getPendingUsers list failed');
    return { success: false, error: 'Anfragen konnten nicht geladen werden.' };
  }

  // Any membership counts as "approved" – use service role to see all orgs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = (await (serviceClient.from('org_members') as any)
    .select('user_id')) as { data: Array<{ user_id: string }> | null };

  const memberIds = new Set((members ?? []).map(m => m.user_id));

  const users: PendingUser[] = authData.users
    .filter(u => !memberIds.has(u.id))
    .map(u => ({
      id: u.id,
      email: u.email ?? '',
      displayName: (u.user_metadata?.display_name as string | undefined) ?? '',
      created_at: u.created_at,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return { success: true, data: { users } };
}

export async function approveUser(
  userId: string,
  role: AppRole,
  departmentId: string,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (!departmentId) {
    return { success: false, error: 'Bitte eine Abteilung wählen.' };
  }

  // Department must belong to the admin's org (RLS-scoped client).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dept } = (await (ctx.supabase.from('departments') as any)
    .select('id')
    .eq('id', departmentId)
    .eq('org_id', ctx.membership.orgId)
    .limit(1)) as { data: Array<{ id: string }> | null };

  if (!dept?.[0]) {
    return { success: false, error: 'Ungültige Abteilung.' };
  }

  const serviceClient = await createServiceRoleClient();

  // Already approved?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (serviceClient.from('org_members') as any)
    .select('id')
    .eq('user_id', userId)
    .limit(1)) as { data: Array<{ id: string }> | null };

  if (existing?.[0]) {
    return { success: false, error: 'Nutzer ist bereits freigegeben.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (serviceClient.from('org_members') as any)
    .insert({
      org_id: ctx.membership.orgId,
      department_id: departmentId,
      user_id: userId,
      role,
    })) as { error: { message: string } | null };

  if (error) {
    console.error('approveUser failed');
    return { success: false, error: 'Freigabe fehlgeschlagen.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function rejectUser(userId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: 'Keine Berechtigung.' };

  if (userId === ctx.membership.userId) {
    return { success: false, error: 'Du kannst dich nicht selbst ablehnen.' };
  }

  const serviceClient = await createServiceRoleClient();

  // Safety: only delete accounts that are still pending (no membership).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = (await (serviceClient.from('org_members') as any)
    .select('id')
    .eq('user_id', userId)
    .limit(1)) as { data: Array<{ id: string }> | null };

  if (existing?.[0]) {
    return { success: false, error: 'Nutzer ist bereits Mitglied. Bitte über die Nutzerliste entfernen.' };
  }

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) {
    console.error('rejectUser failed');
    return { success: false, error: 'Ablehnen fehlgeschlagen.' };
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
    console.error('getDepartments failed');
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
  if (name.length > 100) {
    return { success: false, error: 'Name darf maximal 100 Zeichen lang sein.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (ctx.supabase.from('departments') as any)
    .insert({ org_id: ctx.membership.orgId, name: name.trim() })
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null };

  if (error || !data) {
    console.error('createDepartment failed');
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
    console.error('updateDepartment failed');
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
    console.error('deleteDepartment failed');
    return { success: false, error: 'Abteilung konnte nicht gelöscht werden.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

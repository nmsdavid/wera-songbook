/**
 * Shared return types for all Server Actions.
 *
 * Usage in server actions:
 *   import type { ActionResult } from '@/lib/actions/types';
 *   export async function myAction(): Promise<ActionResult<{ id: string }>> { ... }
 *
 * Usage in client components (narrowing):
 *   const result = await myAction();
 *   if (result.success) { result.data.id } else { result.error }
 */

export type ActionSuccess<T = undefined> = T extends undefined
  ? { success: true }
  : { success: true; data: T };

export type ActionError = { success: false; error: string };

export type ActionResult<T = undefined> = ActionSuccess<T> | ActionError;

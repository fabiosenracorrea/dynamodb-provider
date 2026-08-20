import { toast } from 'sonner';

import type { ExecuteResponse } from './api';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? 'Unknown error');
}

/**
 * Handled failures come back as a 200-shaped `{ success: false }`, so acting only on
 * `success` left rejected mutations completely silent. Everything routes through here.
 *
 * @returns whether the operation succeeded.
 */
export function reportResult(action: string, result: ExecuteResponse): boolean {
  if (result.success) {
    toast.success(`${action} succeeded`);
    return true;
  }

  toast.error(`${action} failed`, { description: result.error });

  return false;
}

export function reportError(action: string, error: unknown): void {
  toast.error(`${action} failed`, { description: messageOf(error) });
}

import type { ActionResult } from '@/lib/server-action';

/** Validates if a secret name is valid. */
export function validateSecretNameFormat(name: string): ActionResult<boolean> {
  if (!name || name.trim().length === 0) {
    return { error: { message: 'Secret name is required' } };
  }

  if (name.length > 100) {
    return { error: { message: 'Secret name must be 100 characters or less' } };
  }

  const nameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!nameRegex.test(name)) {
    return {
      error: { message: 'Secret name must contain only letters, numbers, underscores, and hyphens' },
    };
  }

  return { data: true };
}

import type { ZodType } from 'zod';

import { PlaygroundError } from './errors';

/**
 * Single place validation turns into an HTTP-shaped failure, so no handler has to
 * think about error formatting.
 */
export function parseWith<T>(schema: ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);

  if (result.success) return result.data;

  const issues = result.error.issues.map(({ path, message }) => ({
    path: path.join('.'),
    message,
  }));

  const summary = issues
    .map(({ path, message }) => (path ? `${path}: ${message}` : message))
    .join('; ');

  throw PlaygroundError.badRequest(`Invalid ${label} — ${summary}`, issues);
}

import { z } from 'zod';

export type FieldErrors = Record<string, string>;

/**
 * Validate `data` against a zod schema and return either the parsed value
 * or a flat { fieldPath: message } map for rendering inline under inputs.
 * Only the first issue per field path is kept.
 */
export function validateForm<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: FieldErrors } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return { success: false, errors };
}

/** Shared login schemas — reused across every email/username + password login form. */
export const emailLoginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const usernameLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

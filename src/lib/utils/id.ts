/**
 * Generates a temporary UUID for frontend use.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

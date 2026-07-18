/**
 * Extracts a message string from any error value.
 *
 * Vendored verbatim from `@maxclicks/utilities` so the SDK stays dependency-free
 * and dual ESM/CJS. Keep in sync with the source of truth.
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Unknown error.'): string {
  const candidate = error as { message?: unknown; toString?: () => string } | null | undefined
  return (
    (typeof error === 'string' ? error : String(candidate?.message || candidate?.toString?.() || defaultMessage)) ||
    defaultMessage
  )
}
